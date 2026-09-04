// Testes dos 8 métodos novos (`increment`, `decrement`, `multiply`, `divide`,
// `sum`, `average`, `min`, `max`), no mesmo espírito de `base-methods.test.ts`:
// verifica QUAIS métodos do `VSRepoAdapter` são chamados e COM QUAIS
// argumentos (`field`, `value`, `where` já resolvido com soft-delete,
// `options`), sem precisar de um banco ou ORM real.

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

// Mesma entidade, mas com `softRemoveKey` configurado — usada para confirmar
// que `increment`/`sum`/etc. também respeitam o filtro automático de
// soft-delete, do mesmo jeito que `get`/`total` já respeitam.
class SoftDeletableUserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({ adapter, pkName: "id", softRemoveKey: "deletedAt" });
    }
}

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
let userRepository: UserRepository;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
    userRepository = new UserRepository(fakeAdapter);
});

describe("increment / decrement / multiply / divide", () => {
    it("'increment' delega para 'adapter.incrementOne' com 'field', 'value' e 'where: { id: pk }'", async () => {
        const updated = buildUser({ balance: 150 });
        fakeAdapter.incrementOne.mockResolvedValueOnce(updated);

        const result = await userRepository.increment("user-1", "balance", 50);

        expect(fakeAdapter.incrementOne).toHaveBeenCalledTimes(1);
        const [field, value, where] = fakeAdapter.incrementOne.mock.calls[0]!;
        expect(field).toBe("balance");
        expect(value).toBe(50);
        expect(where).toEqual({ id: "user-1" });
        expect(result).toBe(updated);
    });

    it("'decrement' delega para 'adapter.decrementOne'", async () => {
        const updated = buildUser({ balance: 50 });
        fakeAdapter.decrementOne.mockResolvedValueOnce(updated);

        const result = await userRepository.decrement("user-1", "balance", 50);

        expect(fakeAdapter.decrementOne).toHaveBeenCalledTimes(1);
        const [field, value, where] = fakeAdapter.decrementOne.mock.calls[0]!;
        expect(field).toBe("balance");
        expect(value).toBe(50);
        expect(where).toEqual({ id: "user-1" });
        expect(result).toBe(updated);
    });

    it("'multiply' delega para 'adapter.multiplyOne'", async () => {
        const updated = buildUser({ balance: 200 });
        fakeAdapter.multiplyOne.mockResolvedValueOnce(updated);

        const result = await userRepository.multiply("user-1", "balance", 2);

        expect(fakeAdapter.multiplyOne).toHaveBeenCalledTimes(1);
        const [field, value, where] = fakeAdapter.multiplyOne.mock.calls[0]!;
        expect(field).toBe("balance");
        expect(value).toBe(2);
        expect(where).toEqual({ id: "user-1" });
        expect(result).toBe(updated);
    });

    it("'divide' delega para 'adapter.divideOne'", async () => {
        const updated = buildUser({ balance: 25 });
        fakeAdapter.divideOne.mockResolvedValueOnce(updated);

        const result = await userRepository.divide("user-1", "balance", 4);

        expect(fakeAdapter.divideOne).toHaveBeenCalledTimes(1);
        const [field, value, where] = fakeAdapter.divideOne.mock.calls[0]!;
        expect(field).toBe("balance");
        expect(value).toBe(4);
        expect(where).toEqual({ id: "user-1" });
        expect(result).toBe(updated);
    });

    it("aceita um campo numérico nullable (ex: 'bonusPoints')", async () => {
        const updated = buildUser({ bonusPoints: 10 });
        fakeAdapter.incrementOne.mockResolvedValueOnce(updated);

        await userRepository.increment("user-1", "bonusPoints", 10);

        expect(fakeAdapter.incrementOne.mock.calls[0]?.[0]).toBe("bonusPoints");
    });

    it("propaga 'options' (ex: 'select') para o adapter", async () => {
        fakeAdapter.incrementOne.mockResolvedValueOnce(buildUser());

        await userRepository.increment("user-1", "balance", 50, {
            select: { id: true, balance: true },
        });

        const options = fakeAdapter.incrementOne.mock.calls[0]?.[3];
        expect(options?.select).toEqual({ id: true, balance: true });
    });

    it("respeita 'softRemoveKey': só incrementa registros ativos por padrão", async () => {
        const softDeletableRepo = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.incrementOne.mockResolvedValueOnce(buildUser());

        await softDeletableRepo.increment("user-1", "balance", 50);

        const where = fakeAdapter.incrementOne.mock.calls[0]?.[2];
        expect(where).toEqual({ id: "user-1", deletedAt: null });
    });

    it("com 'see: \"all\"', ignora o filtro de soft-delete", async () => {
        const softDeletableRepo = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.incrementOne.mockResolvedValueOnce(buildUser());

        await softDeletableRepo.increment("user-1", "balance", 50, { see: "all" });

        const where = fakeAdapter.incrementOne.mock.calls[0]?.[2];
        expect(where).toEqual({ id: "user-1" });
    });
});

describe("sum / average / min / max", () => {
    it("'sum' delega para 'adapter.sum' com 'field' e 'where' vazio por padrão", async () => {
        fakeAdapter.sum.mockResolvedValueOnce(1000);

        const result = await userRepository.sum("balance");

        expect(fakeAdapter.sum).toHaveBeenCalledTimes(1);
        const [field, where] = fakeAdapter.sum.mock.calls[0]!;
        expect(field).toBe("balance");
        expect(where).toEqual({});
        expect(result).toBe(1000);
    });

    it("'sum' repassa um 'where' explícito para o adapter", async () => {
        fakeAdapter.sum.mockResolvedValueOnce(500);

        await userRepository.sum("balance", { active: true });

        expect(fakeAdapter.sum.mock.calls[0]?.[1]).toEqual({ active: true });
    });

    it("'sum' retorna 'null' quando o adapter não encontra nenhum registro", async () => {
        fakeAdapter.sum.mockResolvedValueOnce(null);

        const result = await userRepository.sum("balance");

        expect(result).toBeNull();
    });

    it("'average' delega para 'adapter.average'", async () => {
        fakeAdapter.average.mockResolvedValueOnce(42.5);

        const result = await userRepository.average("balance");

        expect(fakeAdapter.average).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.average.mock.calls[0]?.[0]).toBe("balance");
        expect(result).toBe(42.5);
    });

    it("'min' delega para 'adapter.min'", async () => {
        fakeAdapter.min.mockResolvedValueOnce(0);

        const result = await userRepository.min("balance");

        expect(fakeAdapter.min).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.min.mock.calls[0]?.[0]).toBe("balance");
        expect(result).toBe(0);
    });

    it("'max' delega para 'adapter.max'", async () => {
        fakeAdapter.max.mockResolvedValueOnce(9999);

        const result = await userRepository.max("balance");

        expect(fakeAdapter.max).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.max.mock.calls[0]?.[0]).toBe("balance");
        expect(result).toBe(9999);
    });

    it("respeita 'softRemoveKey': só agrega registros ativos por padrão", async () => {
        const softDeletableRepo = new SoftDeletableUserRepository(fakeAdapter);
        fakeAdapter.sum.mockResolvedValueOnce(1000);

        await softDeletableRepo.sum("balance");

        const where = fakeAdapter.sum.mock.calls[0]?.[1];
        expect(where).toEqual({ deletedAt: null });
    });
});
