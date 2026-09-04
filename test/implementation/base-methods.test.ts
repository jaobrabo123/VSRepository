// Testes dos métodos base (`get`, `save`, `remove`, `patch`, `has`, `total`,
// etc) do core da v2. Reproduz o mesmo tipo de cenário do `describe("Métodos
// base", ...)` da v1 (`functional-api.test.ts`), mas em vez de rodar contra
// um Postgres real, verifica QUAIS métodos do `VSRepoAdapter` são chamados e
// COM QUAIS argumentos (`where` resolvido, `options`) — o adapter é quem
// falaria com o banco de verdade, e isso já é responsabilidade testada nos
// pacotes de adapter (ex.: `VSRepoPrisma7Adapter`), não do core.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User, buildUser } from "../helpers/entities";

class UserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({ adapter, pkName: "id" });
    }
}

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
let userRepository: UserRepository;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
    userRepository = new UserRepository(fakeAdapter);
});

describe("get / getOrThrow / getList", () => {
    it("'get' busca por 'where: { id: pk }' e retorna o resultado do adapter", async () => {
        const user = buildUser();
        fakeAdapter.findOne.mockResolvedValueOnce(user);

        const result = await userRepository.get("user-1");

        expect(fakeAdapter.findOne).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({ id: "user-1" });
        expect(result).toBe(user);
    });

    it("'getOrThrow' delega para 'adapter.findOneOrThrow'", async () => {
        const user = buildUser();
        fakeAdapter.findOneOrThrow.mockResolvedValueOnce(user);

        const result = await userRepository.getOrThrow("user-1");

        expect(fakeAdapter.findOneOrThrow).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.findOneOrThrow.mock.calls[0]?.[0]).toEqual({ id: "user-1" });
        expect(result).toBe(user);
    });

    it("'getList' busca por 'where: { id: { in: pks } }'", async () => {
        const users = [buildUser({ id: "user-1" }), buildUser({ id: "user-2" })];
        fakeAdapter.findMany.mockResolvedValueOnce(users);

        const result = await userRepository.getList(["user-1", "user-2"]);

        expect(fakeAdapter.findMany.mock.calls[0]?.[0]).toEqual({
            id: { in: ["user-1", "user-2"] },
        });
        expect(result).toBe(users);
    });

    it("'getList' rejeita quando 'pks' não é um array", async () => {
        await expect(userRepository.getList("user-1" as any)).rejects.toThrow();
    });
});

describe("getAll", () => {
    it("busca com 'where' vazio e propaga 'pagination'/'order' para o adapter", async () => {
        fakeAdapter.findMany.mockResolvedValueOnce([]);

        await userRepository.getAll({
            pagination: { limit: 10, offset: 0 },
            order: { createdAt: "desc" },
        });

        expect(fakeAdapter.findMany).toHaveBeenCalledTimes(1);
        const [where, options] = fakeAdapter.findMany.mock.calls[0]!;
        expect(where).toEqual({});
        expect(options?.pagination).toEqual({ limit: 10, offset: 0 });
        expect(options?.order).toEqual({ createdAt: "desc" });
    });
});

describe("save / saveList / patch", () => {
    it("'save' delega o objeto recebido para 'adapter.save'", async () => {
        const payload = { name: "Maria", email: "maria@email.com" };
        const saved = buildUser({ name: "Maria", email: "maria@email.com" });
        fakeAdapter.save.mockResolvedValueOnce(saved);

        const result = await userRepository.save(payload);

        expect(fakeAdapter.save).toHaveBeenCalledWith(payload, expect.anything());
        expect(result).toBe(saved);
    });

    it("'saveList' delega a lista recebida para 'adapter.saveMany'", async () => {
        const payload = [{ name: "Maria" }, { name: "João" }];
        fakeAdapter.saveMany.mockResolvedValueOnce([buildUser(), buildUser()]);

        await userRepository.saveList(payload);

        expect(fakeAdapter.saveMany).toHaveBeenCalledWith(payload, expect.anything());
    });

    it("'saveList' rejeita quando 'objs' não é um array", async () => {
        await expect(userRepository.saveList({} as any)).rejects.toThrow();
    });

    it("'patch' busca por 'where: { id: pk }' e passa o objeto parcial para 'adapter.update'", async () => {
        const patched = buildUser({ name: "Novo nome" });
        fakeAdapter.update.mockResolvedValueOnce(patched);

        const result = await userRepository.patch("user-1", { name: "Novo nome" });

        expect(fakeAdapter.update).toHaveBeenCalledWith(
            { id: "user-1" },
            { name: "Novo nome" },
            expect.anything(),
        );
        expect(result).toBe(patched);
    });
});

describe("remove / removeList", () => {
    it("'remove' busca por 'where: { id: pk }' e delega para 'adapter.delete'", async () => {
        const removed = buildUser();
        fakeAdapter.delete.mockResolvedValueOnce(removed);

        const result = await userRepository.remove("user-1");

        expect(fakeAdapter.delete.mock.calls[0]?.[0]).toEqual({ id: "user-1" });
        expect(result).toBe(removed);
    });

    it("'removeList' busca por 'where: { id: { in: pks } }' e delega para 'adapter.deleteMany'", async () => {
        fakeAdapter.deleteMany.mockResolvedValueOnce({ count: 2 });

        const result = await userRepository.removeList(["user-1", "user-2"]);

        expect(fakeAdapter.deleteMany.mock.calls[0]?.[0]).toEqual({
            id: { in: ["user-1", "user-2"] },
        });
        expect(result).toEqual({ count: 2 });
    });

    it("'removeList' rejeita quando 'pks' não é um array", async () => {
        await expect(userRepository.removeList("user-1" as any)).rejects.toThrow();
    });
});

describe("total / has / merge", () => {
    it("'total' delega para 'adapter.count' com 'where' vazio", async () => {
        fakeAdapter.count.mockResolvedValueOnce(42);

        const result = await userRepository.total();

        expect(fakeAdapter.count.mock.calls[0]?.[0]).toEqual({});
        expect(result).toBe(42);
    });

    it("'has' delega para 'adapter.exists' com 'where: { id: pk }'", async () => {
        fakeAdapter.exists.mockResolvedValueOnce(true);

        const result = await userRepository.has("user-1");

        expect(fakeAdapter.exists.mock.calls[0]?.[0]).toEqual({ id: "user-1" });
        expect(result).toBe(true);
    });

    it("'merge' delega para 'adapter.merge' sem persistir nada", async () => {
        const merged = { ...buildUser(), name: "Nome atualizado" };
        fakeAdapter.merge.mockResolvedValueOnce(merged);

        const result = await userRepository.merge("user-1", { name: "Nome atualizado" });

        expect(fakeAdapter.merge).toHaveBeenCalledWith(
            { id: "user-1" },
            { name: "Nome atualizado" },
            expect.anything(),
        );
        expect(fakeAdapter.save).not.toHaveBeenCalled();
        expect(fakeAdapter.update).not.toHaveBeenCalled();
        expect(result).toBe(merged);
    });
});

describe("transaction / getDbClient / query", () => {
    it("'transaction' delega para 'adapter.runInTransaction'", async () => {
        fakeAdapter.runInTransaction.mockResolvedValueOnce("ok");

        const fn = jest.fn(async () => "ok");
        const result = await userRepository.transaction(fn);

        expect(fakeAdapter.runInTransaction).toHaveBeenCalledWith(fn, expect.anything());
        expect(result).toBe("ok");
    });

    it("'getDbClient' delega para 'adapter.getDbClient'", () => {
        const dbClient = { fake: true };
        fakeAdapter.getDbClient.mockReturnValueOnce(dbClient);

        expect(userRepository.getDbClient()).toBe(dbClient);
    });

    it("'query' delega para 'adapter.query' passando 'args' e 'modifying'", async () => {
        fakeAdapter.query.mockResolvedValueOnce([buildUser()]);

        await userRepository.query('SELECT * FROM "user" WHERE email = $1', {
            args: ["joao@email.com"],
        });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE email = $1',
            expect.objectContaining({ args: ["joao@email.com"], modifying: false }),
        );
    });

    it("'query' rejeita quando 'query' não é uma string", async () => {
        await expect(userRepository.query(123 as any)).rejects.toThrow();
    });
});
