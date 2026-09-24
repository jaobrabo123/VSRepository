// Testes da option `vsPlaceholders`: quando ligada, strings cruas passadas
// para `VSRepository.query()` e `@QueryMethod` usam os placeholders próprios
// do VSRepository (`?1`, `?2`, ... — estilo Spring Data JPA) em vez da
// sintaxe nativa do adapter, traduzidos via `adapter.getPlaceholder()`.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { QueryMethod } from "../../src/decorators/query-method.decorator";
import { QueryMethodArg } from "../../src/types/utils/query-method-arg.type";
import { QueryArgs } from "../../src/types/utils/query-args.type";
import { VSLogLevel } from "../../src/internal/enums/vs-log-level.enum";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User, buildUser } from "../helpers/entities";

class VsPlaceholdersUserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({ adapter, pkName: "id", logLevel: VSLogLevel.ERROR, vsPlaceholders: true });
    }

    @QueryMethod('SELECT * FROM "user" WHERE email = ?1')
    declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;

    @QueryMethod('SELECT * FROM "user" WHERE 1=1 OR ?1 = ?1 AND email = ?2', { spreadArgs: true })
    declare findByEmailRepeated: (...args: QueryArgs<[flag: boolean, email: string]>) => Promise<User[]>;
}

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
    fakeAdapter.getPlaceholder = jest.fn((index: number) => `$${index + 1}`);
});

describe("'vsPlaceholders' — construção", () => {
    it("lança 'VSRepoError' se 'vsPlaceholders: true' e o adapter não implementa 'getPlaceholder'", () => {
        delete (fakeAdapter as any).getPlaceholder;

        expect(
            () =>
                new (class extends VSRepository<User, string> {
                    constructor() {
                        super({ adapter: fakeAdapter, pkName: "id", vsPlaceholders: true });
                    }
                })(),
        ).toThrow(/did not implement the 'getPlaceholder' method/);
    });

    it("não lança quando 'vsPlaceholders' está desligado (default), mesmo sem 'getPlaceholder' no adapter", () => {
        delete (fakeAdapter as any).getPlaceholder;

        expect(
            () =>
                new (class extends VSRepository<User, string> {
                    constructor() {
                        super({ adapter: fakeAdapter, pkName: "id" });
                    }
                })(),
        ).not.toThrow();
    });
});

describe("'vsPlaceholders' — 'VSRepository.query()' (overload de string)", () => {
    let userRepository: VsPlaceholdersUserRepository;

    beforeEach(() => {
        userRepository = new VsPlaceholdersUserRepository(fakeAdapter);
    });

    it("traduz um único '?1' para o placeholder nativo do adapter", async () => {
        fakeAdapter.query.mockResolvedValueOnce([]);

        await userRepository.query('SELECT * FROM "user" WHERE email = ?1', { args: ["joao@email.com"] });

        expect(fakeAdapter.getPlaceholder).toHaveBeenCalledWith(0);
        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE email = $1',
            expect.objectContaining({ args: ["joao@email.com"], modifying: false }),
        );
    });

    it("traduz múltiplos placeholders distintos mantendo a ordem", async () => {
        fakeAdapter.query.mockResolvedValueOnce([]);

        await userRepository.query('SELECT * FROM "user" WHERE email = ?1 AND "userType" = ?2', {
            args: ["joao@email.com", "admin"],
        });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE email = $1 AND "userType" = $2',
            expect.objectContaining({ args: ["joao@email.com", "admin"] }),
        );
    });

    it("um '?1' repetido duplica o valor no array de args final, um placeholder novo por ocorrência", async () => {
        fakeAdapter.query.mockResolvedValueOnce([]);

        await userRepository.query('SELECT * FROM "user" WHERE ?1 = ?1 AND email = ?2', {
            args: [true, "joao@email.com"],
        });

        expect(fakeAdapter.getPlaceholder).toHaveBeenNthCalledWith(1, 0);
        expect(fakeAdapter.getPlaceholder).toHaveBeenNthCalledWith(2, 1);
        expect(fakeAdapter.getPlaceholder).toHaveBeenNthCalledWith(3, 2);
        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE $1 = $2 AND email = $3',
            expect.objectContaining({ args: [true, true, "joao@email.com"] }),
        );
    });

    it("rejeita uma referência fora do range de 'args'", async () => {
        await expect(
            userRepository.query('SELECT * FROM "user" WHERE email = ?2', { args: ["joao@email.com"] }),
        ).rejects.toThrow(/Invalid 'vsPlaceholders' reference '\?2'/);
        expect(fakeAdapter.query).not.toHaveBeenCalled();
    });
});

describe("'vsPlaceholders' — '@QueryMethod'", () => {
    let userRepository: VsPlaceholdersUserRepository;

    beforeEach(() => {
        userRepository = new VsPlaceholdersUserRepository(fakeAdapter);
    });

    it("'findByEmailRaw' traduz o '?1' declarado no decorator antes de chamar 'adapter.query'", async () => {
        const users = [buildUser()];
        fakeAdapter.query.mockResolvedValueOnce(users);

        const result = await userRepository.findByEmailRaw({ args: ["joao@email.com"] });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE email = $1',
            expect.objectContaining({ args: ["joao@email.com"], modifying: false }),
        );
        expect(result).toBe(users);
    });

    it("'findByEmailRepeated' (spreadArgs) duplica o argumento repetido corretamente", async () => {
        fakeAdapter.query.mockResolvedValueOnce([]);

        await userRepository.findByEmailRepeated(true, "joao@email.com");

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE 1=1 OR $1 = $2 AND email = $3',
            expect.objectContaining({ args: [true, true, "joao@email.com"] }),
        );
    });
});
