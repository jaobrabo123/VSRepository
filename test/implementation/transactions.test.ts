// Testes de transação. Equivalente ao `transactions.test.ts` da v1: aqui não
// existe uma transação real (isso é responsabilidade do adapter/ORM), então
// verificamos apenas o contrato entre `VSRepository` e `VSRepoAdapter`:
// `transaction()` delega para `adapter.runInTransaction`, e passar `options.db`
// em um método base evita que o repository busque um client novo via
// `adapter.getDbClient()`.

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

describe("transaction()", () => {
    it("delega a função e as opções recebidas para 'adapter.runInTransaction'", async () => {
        const fn = jest.fn(async (tx: any) => tx);
        fakeAdapter.runInTransaction.mockImplementationOnce((f: any) => f("fake-tx"));

        const result = await userRepository.transaction(fn, {
            isolationLevel: "Serializable" as any,
        });

        expect(fakeAdapter.runInTransaction).toHaveBeenCalledWith(
            fn,
            expect.objectContaining({ isolationLevel: "Serializable" }),
        );
        expect(fn).toHaveBeenCalledWith("fake-tx");
        expect(result).toBe("fake-tx");
    });

    it("propaga o erro lançado dentro do callback da transação", async () => {
        const boom = new Error("rollback");
        fakeAdapter.runInTransaction.mockRejectedValueOnce(boom);

        await expect(userRepository.transaction(async () => undefined)).rejects.toBe(boom);
    });
});

describe("compartilhando o client de transação via 'options.db'", () => {
    it("usa o 'db' informado em vez de chamar 'adapter.getDbClient()'", async () => {
        const tx = { fakeTransactionClient: true };
        fakeAdapter.findOne.mockResolvedValueOnce(buildUser());

        await userRepository.get("user-1", { db: tx });

        expect(fakeAdapter.getDbClient).not.toHaveBeenCalled();
        expect(fakeAdapter.findOne.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ db: tx }),
        );
    });

    it("sem 'options.db', busca o client padrão via 'adapter.getDbClient()'", async () => {
        const defaultClient = { default: true };
        fakeAdapter.getDbClient.mockReturnValueOnce(defaultClient);
        fakeAdapter.findOne.mockResolvedValueOnce(buildUser());

        await userRepository.get("user-1");

        expect(fakeAdapter.getDbClient).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.findOne.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ db: defaultClient }),
        );
    });
});
