// Testes dos métodos dinâmicos (`@DynamicMethod`) do core da v2. Equivalente
// ao `describe("Métodos dinâmicos", ...)` da v1, mas verificando a chamada
// feita no `VSRepoAdapter` falso em vez do resultado de uma query real —
// exatamente o que um método dinâmico resolve (nome -> `where`/operação) é
// responsabilidade do core, então é isso que testamos aqui.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { UserRepository } from "../helpers/user-repository";
import { User, buildUser } from "../helpers/entities";

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
let userRepository: UserRepository;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
    userRepository = new UserRepository(fakeAdapter);
});

describe("prefixo 'findBy' / 'findOneBy'", () => {
    it("'findByEmail' chama 'adapter.findMany' com o campo do nome como filtro de igualdade", async () => {
        const users = [buildUser()];
        fakeAdapter.findMany.mockResolvedValueOnce(users);

        const result = await userRepository.findByEmail("joao@email.com");

        expect(fakeAdapter.findMany.mock.calls[0]?.[0]).toEqual({ email: "joao@email.com" });
        expect(result).toBe(users);
    });

    it("'findOneByEmail' chama 'adapter.findOne' (retorno único) em vez de 'findMany'", async () => {
        const user = buildUser();
        fakeAdapter.findOne.mockResolvedValueOnce(user);

        const result = await userRepository.findOneByEmail("joao@email.com");

        expect(fakeAdapter.findOne).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.findMany).not.toHaveBeenCalled();
        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({ email: "joao@email.com" });
        expect(result).toBe(user);
    });
});

describe("operador lógico 'And' entre campos", () => {
    it("'findOneByIdAndEmail' combina os dois campos no mesmo 'where'", async () => {
        fakeAdapter.findOne.mockResolvedValueOnce(buildUser());

        await userRepository.findOneByIdAndEmail("user-1", "joao@email.com");

        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({
            id: "user-1",
            email: "joao@email.com",
        });
    });
});

describe("prefixo 'existsBy'", () => {
    it("'existsByEmail' chama 'adapter.exists' e retorna um boolean", async () => {
        fakeAdapter.exists.mockResolvedValueOnce(true);

        const result = await userRepository.existsByEmail("joao@email.com");

        expect(fakeAdapter.exists.mock.calls[0]?.[0]).toEqual({ email: "joao@email.com" });
        expect(result).toBe(true);
    });
});

describe("filtro 'IsTrue' / 'injectOrdering'", () => {
    it("'findByActiveIsTrue' filtra 'active: true' e injeta a ordenação fixa configurada no decorator", async () => {
        fakeAdapter.findMany.mockResolvedValueOnce([]);

        await userRepository.findByActiveIsTrue();

        const [where, options] = fakeAdapter.findMany.mock.calls[0]!;
        expect(where).toEqual({ active: true });
        expect(options?.order).toEqual({ createdAt: "desc" });
    });
});

describe("@QueryMethod — query crua", () => {
    it("'findByEmailRaw' delega para 'adapter.query' com o SQL declarado e os 'args' informados", async () => {
        const users = [buildUser()];
        fakeAdapter.query.mockResolvedValueOnce(users);

        const result = await userRepository.findByEmailRaw({ args: ["joao@email.com"] });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE email = $1',
            expect.objectContaining({ args: ["joao@email.com"], modifying: false }),
        );
        expect(result).toBe(users);
    });
});
