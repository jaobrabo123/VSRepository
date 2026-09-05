// Testes do soft-delete (`softRemove`, `softRemoveList`, `restore`,
// `restoreList`) e do filtro automático por `softRemoveKey` nos métodos base
// (`opt.see`). Equivalente ao `soft-delete.test.ts` da v1.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User, buildUser } from "../helpers/entities";

class SoftDeletableUserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({ adapter, pkName: "id", softRemoveKey: "deletedAt" });
    }
}

class UserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({ adapter, pkName: "id" });
    }
}

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
});

describe("sem 'softRemoveKey' configurado", () => {
    it("'softRemove' rejeita informando que o repository não tem 'softRemoveKey'", async () => {
        const userRepository = new UserRepository(fakeAdapter);

        await expect(userRepository.softRemove("user-1")).rejects.toThrow(/softRemoveKey/);
    });

    it("'restoreList' rejeita informando que o repository não tem 'softRemoveKey'", async () => {
        const userRepository = new UserRepository(fakeAdapter);

        await expect(userRepository.restoreList(["user-1"])).rejects.toThrow(/softRemoveKey/);
    });
});

describe("com 'softRemoveKey' configurado", () => {
    it("'softRemove' faz 'update' setando a chave configurada para a data atual", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.update.mockResolvedValueOnce(buildUser());

        await softDeletable.softRemove("user-1");

        const [where, data] = fakeAdapter.update.mock.calls[0]!;
        expect(where).toEqual({ id: "user-1" });
        expect(data.deletedAt).toBeInstanceOf(Date);
    });

    it("'restore' faz 'update' setando a chave configurada para 'null'", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.update.mockResolvedValueOnce(buildUser());

        await softDeletable.restore("user-1");

        const [, data] = fakeAdapter.update.mock.calls[0]!;
        expect(data.deletedAt).toBeNull();
    });

    it("'softRemoveList' faz 'updateMany' para todas as PKs informadas", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.updateMany.mockResolvedValueOnce({ count: 2 });

        const result = await softDeletable.softRemoveList(["user-1", "user-2"]);

        const [where, data] = fakeAdapter.updateMany.mock.calls[0]!;
        expect(where).toEqual({ id: { in: ["user-1", "user-2"] } });
        expect(data.deletedAt).toBeInstanceOf(Date);
        expect(result).toEqual({ count: 2 });
    });

    it("'softRemoveList' rejeita quando 'pks' não é um array", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);

        await expect(softDeletable.softRemoveList("user-1" as any)).rejects.toThrow();
    });

    it("'get' (see: 'active', padrão) filtra registros não removidos", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.findOne.mockResolvedValueOnce(buildUser());

        await softDeletable.get("user-1");

        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({
            id: "user-1",
            deletedAt: null,
        });
    });

    it("'get' com 'see: \"removed\"' busca apenas os removidos", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.findOne.mockResolvedValueOnce(null);

        await softDeletable.get("user-1", { see: "removed" });

        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({
            id: "user-1",
            deletedAt: { not: null },
        });
    });

    it("'get' com 'see: \"all\"' não aplica nenhum filtro de soft-delete", async () => {
        const softDeletable = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.findOne.mockResolvedValueOnce(buildUser());

        await softDeletable.get("user-1", { see: "all" });

        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({ id: "user-1" });
    });
});
