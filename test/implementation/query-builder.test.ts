// Testes do query builder (`VSQueryBuilder`, criado via `createQueryBuilder()`).
// Como no resto do core, não há banco/ORM real: o `VSRepoAdapter` é falso e
// verificamos QUAIS métodos do adapter cada método terminal chama, COM QUAIS
// argumentos (`where` já resolvido com o filtro de soft-delete, `select`,
// `relations`, `order`, `pagination`, `distinct` e `db`), e que o retorno é
// propagado sem alterações.

import "reflect-metadata";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { types } from "node:util";
import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { VSRepoError } from "../../src/errors/VSRepoError";
import { VSRepoErrorType } from "../../src/internal/enums/vsrepo-error-type.enum";
import { VSLogLevel } from "../../src/internal/enums/vs-log-level.enum";
import { MergeWheresResolver } from "../../src/internal/resolvers/merge-wheres.resolver";
import { VSLogger } from "../../src/internal/utils/vs-logger.util";
import { VSQueryBuilder } from "../../src/internal/utils/vs-query-builder.util";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User, UserType, buildUser } from "../helpers/entities";
import { SoftDeletableUserRepository, UserRepository } from "../helpers/user-repository";

const dbClient = { name: "db-client" };
const tx = { name: "transaction" };

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
let userRepository: UserRepository;
let softDeletableRepository: SoftDeletableUserRepository;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
    fakeAdapter.getDbClient.mockReturnValue(dbClient);

    userRepository = new UserRepository(fakeAdapter);
    softDeletableRepository = new SoftDeletableUserRepository(fakeAdapter);
});

// Captura o erro lançado por uma chamada síncrona (os métodos de encadeamento
// do builder validam de forma síncrona, então `expect(...).toThrow` não
// permite inspecionar `type`/`message` de uma vez só).
function catchError(fn: () => unknown): VSRepoError {
    try {
        fn();
    } catch (err) {
        return err as VSRepoError;
    }

    throw new Error("A função deveria ter lançado um erro, mas não lançou");
}

describe("createQueryBuilder()", () => {
    it("usa o client retornado por 'adapter.getDbClient()' quando nenhum 'db' é informado", async () => {
        fakeAdapter.findMany.mockResolvedValueOnce([]);

        await userRepository.createQueryBuilder().getResult();

        const [, options] = fakeAdapter.findMany.mock.calls[0]!;
        expect(options!.db).toBe(dbClient);
    });

    it("usa o 'db' informado (ex.: uma transação) em vez do client padrão", async () => {
        fakeAdapter.findMany.mockResolvedValueOnce([]);

        await userRepository.createQueryBuilder(tx).getResult();

        const [, options] = fakeAdapter.findMany.mock.calls[0]!;
        expect(options!.db).toBe(tx);
    });

    it("retorna uma instância nova (e independente) a cada chamada", async () => {
        const qbA = userRepository.createQueryBuilder();
        const qbB = userRepository.createQueryBuilder();
        fakeAdapter.findMany.mockResolvedValue([]);

        qbA.where({ name: "João" }).limit(5);
        await qbB.getResult();

        expect(qbA).not.toBe(qbB);
        expect(qbA).toBeInstanceOf(VSQueryBuilder);
        expect(fakeAdapter.findMany).toHaveBeenCalledWith({}, { distinct: undefined, db: dbClient });
    });
});

describe("métodos terminais", () => {
    describe("getResult()", () => {
        it("sem nenhuma configuração chama 'adapter.findMany' com 'where' vazio", async () => {
            fakeAdapter.findMany.mockResolvedValueOnce([]);

            await userRepository.createQueryBuilder().getResult();

            expect(fakeAdapter.findMany).toHaveBeenCalledTimes(1);
            expect(fakeAdapter.findMany).toHaveBeenCalledWith({}, { db: dbClient });
        });

        it("repassa 'where', 'select', 'relations', 'order', 'pagination', 'distinct' e 'db' para 'adapter.findMany'", async () => {
            const users = [buildUser(), buildUser({ id: "user-2" })];
            fakeAdapter.findMany.mockResolvedValueOnce(users);

            const result = await userRepository
                .createQueryBuilder()
                .where({ active: true })
                .select({ id: true, name: true })
                .relations({ address: true })
                .orderBy({ createdAt: "desc" })
                .limit(10)
                .offset(20)
                .distinctOn("name")
                .getResult();

            expect(fakeAdapter.findMany).toHaveBeenCalledWith(
                { active: true },
                {
                    select: { id: true, name: true },
                    relations: { address: true },
                    order: { createdAt: "desc" },
                    pagination: { limit: 10, offset: 20 },
                    distinct: ["name"],
                    db: dbClient,
                },
            );
            expect(result).toBe(users);
        });

        it("propaga o erro lançado pelo adapter", async () => {
            fakeAdapter.findMany.mockRejectedValueOnce(new Error("db down"));

            await expect(userRepository.createQueryBuilder().getResult()).rejects.toThrow("db down");
        });
    });

    describe("getOneResult()", () => {
        it("chama 'adapter.findOne' com as options (sem 'distinct') e retorna a entidade", async () => {
            const user = buildUser();
            fakeAdapter.findOne.mockResolvedValueOnce(user);

            const result = await userRepository
                .createQueryBuilder()
                .where({ email: "joao@email.com" })
                .select({ id: true })
                .relations({ address: true })
                .orderBy({ createdAt: "asc" })
                .distinctOn("name")
                .getOneResult();

            expect(fakeAdapter.findOne).toHaveBeenCalledTimes(1);
            const [where, options] = fakeAdapter.findOne.mock.calls[0]!;
            expect(where).toEqual({ email: "joao@email.com" });
            expect(options).toEqual({
                select: { id: true },
                relations: { address: true },
                order: { createdAt: "asc" },
                db: dbClient,
            });
            expect(options).not.toHaveProperty("distinct");
            expect(result).toBe(user);
        });

        it("retorna 'null' quando o adapter não encontra nada", async () => {
            fakeAdapter.findOne.mockResolvedValueOnce(null);

            await expect(userRepository.createQueryBuilder().where({ id: "x" }).getOneResult()).resolves.toBeNull();
        });
    });

    describe("getOneResultOrThrow()", () => {
        it("chama 'adapter.findOneOrThrow' e retorna a entidade", async () => {
            const user = buildUser();
            fakeAdapter.findOneOrThrow.mockResolvedValueOnce(user);

            const result = await userRepository
                .createQueryBuilder()
                .where({ id: "user-1" })
                .relations({ products: true })
                .getOneResultOrThrow();

            expect(fakeAdapter.findOneOrThrow).toHaveBeenCalledWith(
                { id: "user-1" },
                { relations: { products: true }, db: dbClient },
            );
            expect(fakeAdapter.findOne).not.toHaveBeenCalled();
            expect(result).toBe(user);
        });

        it("propaga o erro do adapter quando nada é encontrado", async () => {
            fakeAdapter.findOneOrThrow.mockRejectedValueOnce(new Error("not found"));

            await expect(userRepository.createQueryBuilder().where({ id: "x" }).getOneResultOrThrow()).rejects.toThrow(
                "not found",
            );
        });
    });

    describe("getCount()", () => {
        it("chama 'adapter.count' repassando apenas 'where', 'order', 'pagination' e 'db'", async () => {
            fakeAdapter.count.mockResolvedValueOnce(42);

            const result = await userRepository
                .createQueryBuilder()
                .where({ active: true })
                .select({ id: true })
                .relations({ address: true })
                .orderBy({ name: "asc" })
                .limit(5)
                .offset(10)
                .distinctOn("name")
                .getCount();

            expect(fakeAdapter.count).toHaveBeenCalledTimes(1);
            const [where, options] = fakeAdapter.count.mock.calls[0]!;
            expect(where).toEqual({ active: true });
            expect(options).toEqual({
                order: { name: "asc" },
                pagination: { limit: 5, offset: 10 },
                db: dbClient,
            });
            expect(options).not.toHaveProperty("select");
            expect(options).not.toHaveProperty("relations");
            expect(options).not.toHaveProperty("distinct");
            expect(result).toBe(42);
        });
    });

    describe("getExistence()", () => {
        it("chama 'adapter.exists' repassando apenas 'where' e 'db'", async () => {
            fakeAdapter.exists.mockResolvedValueOnce(true);

            const result = await userRepository
                .createQueryBuilder()
                .where({ email: "joao@email.com" })
                .orderBy({ name: "asc" })
                .limit(1)
                .getExistence();

            expect(fakeAdapter.exists).toHaveBeenCalledWith({ email: "joao@email.com" }, { db: dbClient });
            expect(result).toBe(true);
        });

        it("retorna 'false' quando o adapter diz que não existe", async () => {
            fakeAdapter.exists.mockResolvedValueOnce(false);

            await expect(userRepository.createQueryBuilder().getExistence()).resolves.toBe(false);
        });
    });

    describe("getResultAndCount()", () => {
        it("busca os registros com todas as options e conta o total ignorando 'order'/'pagination'", async () => {
            const users = [buildUser()];
            fakeAdapter.findMany.mockResolvedValueOnce(users);
            fakeAdapter.count.mockResolvedValueOnce(57);

            const output = await userRepository
                .createQueryBuilder()
                .where({ active: true })
                .select({ id: true })
                .orderBy({ createdAt: "desc" })
                .limit(10)
                .offset(20)
                .getResultAndCount();

            expect(fakeAdapter.findMany).toHaveBeenCalledWith(
                { active: true },
                {
                    select: { id: true },
                    order: { createdAt: "desc" },
                    pagination: { limit: 10, offset: 20 },
                    db: dbClient,
                },
            );
            // O total é o de TODOS os registros que batem com o 'where' (é para paginação),
            // por isso 'order' e 'pagination' não são repassados ao 'count'
            const [countWhere, countOptions] = fakeAdapter.count.mock.calls[0]!;
            expect(countWhere).toEqual({ active: true });
            expect(countOptions).toEqual({ db: dbClient });
            expect(output).toEqual({ result: users, count: 57 });
        });

        it("não repassa 'distinct' para nenhuma das duas chamadas", async () => {
            fakeAdapter.findMany.mockResolvedValueOnce([]);
            fakeAdapter.count.mockResolvedValueOnce(0);

            await userRepository.createQueryBuilder().distinctOn("name").getResultAndCount();

            expect(fakeAdapter.findMany.mock.calls[0]![1]).not.toHaveProperty("distinct");
            expect(fakeAdapter.count.mock.calls[0]![1]).not.toHaveProperty("distinct");
        });

        it("dispara 'findMany' e 'count' em paralelo, sem esperar um terminar para iniciar o outro", async () => {
            let releaseFindMany!: (users: User[]) => void;
            fakeAdapter.findMany.mockReturnValueOnce(new Promise<User[]>(resolve => (releaseFindMany = resolve)));
            fakeAdapter.count.mockResolvedValueOnce(1);

            const promise = userRepository.createQueryBuilder().getResultAndCount();

            // 'findMany' ainda está pendente, mas 'count' já foi chamado
            expect(fakeAdapter.findMany).toHaveBeenCalledTimes(1);
            expect(fakeAdapter.count).toHaveBeenCalledTimes(1);

            releaseFindMany([buildUser()]);
            await expect(promise).resolves.toEqual({ result: [buildUser()], count: 1 });
        });

        it("rejeita se qualquer uma das duas chamadas falhar", async () => {
            fakeAdapter.findMany.mockResolvedValueOnce([]);
            fakeAdapter.count.mockRejectedValueOnce(new Error("count failed"));

            await expect(userRepository.createQueryBuilder().getResultAndCount()).rejects.toThrow("count failed");
        });
    });
});

describe("métodos de encadeamento", () => {
    it("todos retornam o próprio builder (fluent API)", () => {
        const qb = userRepository.createQueryBuilder();

        expect(qb.select({ id: true })).toBe(qb);
        expect(qb.relations({ address: true })).toBe(qb);
        expect(qb.where({ active: true })).toBe(qb);
        expect(qb.orderBy({ name: "asc" })).toBe(qb);
        expect(qb.limit(1)).toBe(qb);
        expect(qb.offset(1)).toBe(qb);
        expect(qb.distinctOn("name")).toBe(qb);
        expect(qb.see("all")).toBe(qb);
    });

    describe("where", () => {
        beforeEach(() => {
            fakeAdapter.findMany.mockResolvedValue([]);
        });

        const whereSentToAdapter = () => fakeAdapter.findMany.mock.calls[0]![0];

        it("repassa o filtro para o adapter", async () => {
            await userRepository
                .createQueryBuilder()
                .where({ active: true, balance: { gte: 100 }, name: { contains: "Jo", ignoreCase: true } })
                .getResult();

            expect(whereSentToAdapter()).toEqual({
                active: true,
                balance: { gte: 100 },
                name: { contains: "Jo", ignoreCase: true },
            });
        });

        it("aceita os operadores lógicos 'AND', 'OR' e 'NOT'", async () => {
            const where = {
                active: true,
                AND: [{ balance: { gte: 100 } }],
                OR: [{ name: "Maria" }, { email: "maria@email.com" }],
                NOT: { userType: UserType.ADMIN },
            };

            await userRepository.createQueryBuilder().where(where).getResult();

            expect(whereSentToAdapter()).toEqual(where);
        });

        it("aceita filtros de relação", async () => {
            const where = {
                products: { _some: { name: "Notebook" } },
                address: { _with: { city: "Aracaju" } },
            };

            await userRepository.createQueryBuilder().where(where).getResult();

            expect(whereSentToAdapter()).toEqual(where);
        });

        it("chamar 'where' de novo substitui o filtro anterior", async () => {
            await userRepository
                .createQueryBuilder()
                .where({ name: "João", OR: [{ active: true }] })
                .where({ email: "joao@email.com" })
                .getResult();

            expect(whereSentToAdapter()).toEqual({ email: "joao@email.com" });
        });

        it("sem 'where' o filtro enviado ao adapter é vazio", async () => {
            await userRepository.createQueryBuilder().getResult();

            expect(whereSentToAdapter()).toEqual({});
        });

        it("não altera o objeto recebido", async () => {
            const where = { active: true, OR: [{ name: "Maria" }] };

            await softDeletableRepository.createQueryBuilder().where(where).getResult();

            expect(where).toEqual({ active: true, OR: [{ name: "Maria" }] });
        });
    });

    describe("select / relations / orderBy", () => {
        beforeEach(() => {
            fakeAdapter.findMany.mockResolvedValue([]);
        });

        it("'select' aceita seleção aninhada e 'false' explícito", async () => {
            const select = { id: true, password: false, address: { city: true } };

            await userRepository.createQueryBuilder().select(select).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.select).toEqual(select);
        });

        it("'relations' aceita relações aninhadas", async () => {
            const relations = { products: true, address: { user: true } } as any;

            await userRepository.createQueryBuilder().relations(relations).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.relations).toEqual(relations);
        });

        it("chamar 'select', 'relations' ou 'orderBy' de novo substitui o valor anterior", async () => {
            await userRepository
                .createQueryBuilder()
                .select({ id: true })
                .select({ name: true })
                .relations({ address: true })
                .relations({ products: true })
                .orderBy({ name: "asc" })
                .orderBy({ createdAt: "desc" })
                .getResult();

            const options = fakeAdapter.findMany.mock.calls[0]![1]!;
            expect(options.select).toEqual({ name: true });
            expect(options.relations).toEqual({ products: true });
            expect(options.order).toEqual({ createdAt: "desc" });
        });

        it("'orderBy' aceita um objeto e um array de objetos, em maiúsculo ou minúsculo", async () => {
            await userRepository.createQueryBuilder().orderBy({ name: "ASC" }).getResult();
            await userRepository
                .createQueryBuilder()
                .orderBy([{ userType: "desc" }, { createdAt: "DESC" }])
                .getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.order).toEqual({ name: "ASC" });
            expect(fakeAdapter.findMany.mock.calls[1]![1]!.order).toEqual([
                { userType: "desc" },
                { createdAt: "DESC" },
            ]);
        });
    });

    describe("limit / offset / distinctOn", () => {
        beforeEach(() => {
            fakeAdapter.findMany.mockResolvedValue([]);
        });

        it("'limit' e 'offset' se combinam no mesmo objeto de paginação", async () => {
            await userRepository.createQueryBuilder().limit(10).offset(30).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.pagination).toEqual({ limit: 10, offset: 30 });
        });

        it("'limit' sozinho e 'offset' sozinho não criam a outra chave", async () => {
            await userRepository.createQueryBuilder().limit(10).getResult();
            await userRepository.createQueryBuilder().offset(5).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.pagination).toEqual({ limit: 10 });
            expect(fakeAdapter.findMany.mock.calls[1]![1]!.pagination).toEqual({ offset: 5 });
        });

        it("aceita 0 em 'limit' e 'offset', e chamar de novo substitui o valor", async () => {
            await userRepository.createQueryBuilder().limit(5).limit(0).offset(9).offset(0).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.pagination).toEqual({ limit: 0, offset: 0 });
        });

        it("'distinctOn' aceita um campo único (vira array) ou um array de campos", async () => {
            await userRepository.createQueryBuilder().distinctOn("name").getResult();
            await userRepository.createQueryBuilder().distinctOn(["name", "userType"]).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.distinct).toEqual(["name"]);
            expect(fakeAdapter.findMany.mock.calls[1]![1]!.distinct).toEqual(["name", "userType"]);
        });

        it("'distinctOn' de novo substitui os campos anteriores", async () => {
            await userRepository.createQueryBuilder().distinctOn("name").distinctOn("email").getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![1]!.distinct).toEqual(["email"]);
        });
    });
});

describe("validação dos argumentos", () => {
    // Os erros de validação também são logados em ERROR; silencia para não poluir a saída dos testes
    beforeEach(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it.each<[string, string, (qb: VSQueryBuilder<User>) => unknown]>([
        ["select", "select", qb => qb.select("id" as any)],
        ["select (valor inválido em campo)", "name", qb => qb.select({ name: "yes" } as any)],
        ["select (valor inválido em campo aninhado)", "address", qb => qb.select({ address: { city: 1 } } as any)],
        ["relations", "relations", qb => qb.relations(true as any)],
        ["relations (valor inválido em campo)", "products", qb => qb.relations({ products: "yes" } as any)],
        ["where", "where", qb => qb.where("id = 1" as any)],
        ["where (null)", "where", qb => qb.where(null as any)],
        ["where (AND inválido)", "AND", qb => qb.where({ AND: "x" } as any)],
        ["where (OR inválido)", "OR", qb => qb.where({ OR: "x" } as any)],
        ["where (NOT inválido)", "NOT", qb => qb.where({ NOT: 5 } as any)],
        ["orderBy", "order", qb => qb.orderBy("name" as any)],
        ["orderBy (direção inválida)", "order", qb => qb.orderBy({ name: "up" } as any)],
        ["orderBy (elemento do array inválido)", "order", qb => qb.orderBy([{ name: "asc" }, { name: "up" }] as any)],
        ["limit (string)", "limit", qb => qb.limit("10" as any)],
        ["limit (negativo)", "limit", qb => qb.limit(-1)],
        ["limit (decimal)", "limit", qb => qb.limit(1.5)],
        ["limit (NaN)", "limit", qb => qb.limit(NaN)],
        ["limit (undefined)", "limit", qb => qb.limit(undefined as any)],
        ["offset (string)", "offset", qb => qb.offset("10" as any)],
        ["offset (negativo)", "offset", qb => qb.offset(-5)],
        ["offset (decimal)", "offset", qb => qb.offset(0.5)],
        ["distinctOn (número)", "fields", qb => qb.distinctOn(1 as any)],
        ["distinctOn (array com número)", "fields", qb => qb.distinctOn([1] as any)],
        ["see", "seeMode", qb => qb.see("deleted" as any)],
    ])("'%s' inválido lança 'VSRepoError' do tipo QUERY_BUILDER apontando para '%s'", (_name, path, call) => {
        const qb = userRepository.createQueryBuilder();

        const error = catchError(() => call(qb));

        expect(error).toBeInstanceOf(VSRepoError);
        expect(error.type).toBe(VSRepoErrorType.QUERY_BUILDER);
        expect(error.message).toContain(`${path}:`);
    });

    it("um argumento inválido não altera o estado do builder", async () => {
        const qb = userRepository.createQueryBuilder().where({ active: true }).limit(10);
        fakeAdapter.findMany.mockResolvedValueOnce([]);

        catchError(() => qb.limit(-1));
        catchError(() => qb.offset(1.5));
        catchError(() => qb.select("id" as any));
        catchError(() => qb.where("x" as any));
        catchError(() => qb.see("nope" as any));
        await qb.getResult();

        expect(fakeAdapter.findMany).toHaveBeenCalledWith(
            { active: true },
            { pagination: { limit: 10 }, db: dbClient },
        );
    });

    it("o erro de validação não chega ao adapter", () => {
        catchError(() => userRepository.createQueryBuilder().limit(-1));

        expect(fakeAdapter.findMany).not.toHaveBeenCalled();
    });
});

describe("soft-delete (see)", () => {
    const terminals: [string, (qb: VSQueryBuilder<User>) => Promise<unknown>, () => jest.Mock[]][] = [
        ["getResult", qb => qb.getResult(), () => [fakeAdapter.findMany as jest.Mock]],
        ["getOneResult", qb => qb.getOneResult(), () => [fakeAdapter.findOne as jest.Mock]],
        ["getOneResultOrThrow", qb => qb.getOneResultOrThrow(), () => [fakeAdapter.findOneOrThrow as jest.Mock]],
        ["getCount", qb => qb.getCount(), () => [fakeAdapter.count as jest.Mock]],
        ["getExistence", qb => qb.getExistence(), () => [fakeAdapter.exists as jest.Mock]],
        [
            "getResultAndCount",
            qb => qb.getResultAndCount(),
            () => [fakeAdapter.findMany as jest.Mock, fakeAdapter.count as jest.Mock],
        ],
    ];

    beforeEach(() => {
        fakeAdapter.findMany.mockResolvedValue([]);
        fakeAdapter.findOne.mockResolvedValue(null);
        fakeAdapter.findOneOrThrow.mockResolvedValue(buildUser());
        fakeAdapter.count.mockResolvedValue(0);
        fakeAdapter.exists.mockResolvedValue(false);
    });

    describe("em um repository com 'softRemoveKey'", () => {
        it.each(terminals)("'%s' só enxerga registros ativos por padrão", async (_name, run, adapterMocks) => {
            await run(softDeletableRepository.createQueryBuilder().where({ active: true }));

            for (const mock of adapterMocks()) {
                expect(mock.mock.calls[0]![0]).toEqual({ active: true, deletedAt: null });
            }
        });

        it.each(terminals)("'%s' com see('removed') só enxerga os removidos", async (_name, run, adapterMocks) => {
            await run(softDeletableRepository.createQueryBuilder().where({ active: true }).see("removed"));

            for (const mock of adapterMocks()) {
                expect(mock.mock.calls[0]![0]).toEqual({ active: true, deletedAt: { not: null } });
            }
        });

        it.each(terminals)("'%s' com see('all') não aplica filtro de soft-delete", async (_name, run, adapterMocks) => {
            await run(softDeletableRepository.createQueryBuilder().where({ active: true }).see("all"));

            for (const mock of adapterMocks()) {
                expect(mock.mock.calls[0]![0]).toEqual({ active: true });
            }
        });

        it("sem 'where' o filtro de soft-delete é o único critério", async () => {
            await softDeletableRepository.createQueryBuilder().getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![0]).toEqual({ deletedAt: null });
        });

        it("o filtro de soft-delete é aplicado por fora do 'OR' do filtro do usuário", async () => {
            await softDeletableRepository
                .createQueryBuilder()
                .where({ active: true, OR: [{ userType: UserType.ADMIN }, { name: "Maria" }] })
                .getResult();

            // active AND (userType = ADMIN OR name = "Maria") AND deletedAt IS NULL
            expect(fakeAdapter.findMany.mock.calls[0]![0]).toEqual({
                active: true,
                OR: [{ userType: UserType.ADMIN }, { name: "Maria" }],
                deletedAt: null,
            });
        });

        it.each(terminals)(
            "'%s' recebe o mesmo filtro (com 'OR' e soft-delete) em todas as chamadas ao adapter",
            async (_name, run, adapterMocks) => {
                await run(
                    softDeletableRepository
                        .createQueryBuilder()
                        .where({ active: true, OR: [{ name: "João" }, { name: "Maria" }] })
                        .see("removed"),
                );

                for (const mock of adapterMocks()) {
                    expect(mock.mock.calls[0]![0]).toEqual({
                        active: true,
                        OR: [{ name: "João" }, { name: "Maria" }],
                        deletedAt: { not: null },
                    });
                }
            },
        );

        it("chamar 'see' de novo substitui o modo anterior", async () => {
            await softDeletableRepository.createQueryBuilder().see("all").see("removed").getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![0]).toEqual({ deletedAt: { not: null } });
        });

        it("não altera o objeto passado para 'where'", async () => {
            const where = { active: true };

            await softDeletableRepository.createQueryBuilder().where(where).getResult();

            expect(where).toEqual({ active: true });
        });
    });

    describe("em um repository sem 'softRemoveKey'", () => {
        it.each(["active", "removed", "all"] as const)("see('%s') não adiciona nenhum filtro", async see => {
            await userRepository.createQueryBuilder().where({ active: true }).see(see).getResult();

            expect(fakeAdapter.findMany.mock.calls[0]![0]).toEqual({ active: true });
        });
    });
});

describe("setDb()", () => {
    it("troca o 'db' de forma lazy: o builder criado antes da transação roda dentro dela", async () => {
        const qb = userRepository.createQueryBuilder().where({ active: true });
        fakeAdapter.runInTransaction.mockImplementationOnce((fn: any) => fn(tx));
        fakeAdapter.findMany.mockResolvedValue([]);

        await userRepository.transaction(async transaction => {
            qb.setDb(transaction);
            await qb.getResult();
        });

        expect(fakeAdapter.findMany.mock.calls[0]![1]!.db).toBe(tx);
    });

    it.each([
        ["getResult", "findMany", (qb: VSQueryBuilder<User>) => qb.getResult()],
        ["getOneResult", "findOne", (qb: VSQueryBuilder<User>) => qb.getOneResult()],
        ["getOneResultOrThrow", "findOneOrThrow", (qb: VSQueryBuilder<User>) => qb.getOneResultOrThrow()],
        ["getCount", "count", (qb: VSQueryBuilder<User>) => qb.getCount()],
        ["getExistence", "exists", (qb: VSQueryBuilder<User>) => qb.getExistence()],
    ] as const)("o novo 'db' é usado por '%s'", async (_name, adapterMethod, run) => {
        (fakeAdapter[adapterMethod] as jest.Mock).mockResolvedValue(adapterMethod === "count" ? 0 : null);
        const qb = userRepository.createQueryBuilder();

        qb.setDb(tx);
        await run(qb);

        expect((fakeAdapter[adapterMethod] as jest.Mock).mock.calls[0]![1].db).toBe(tx);
    });

    it("o novo 'db' é usado nas duas chamadas de 'getResultAndCount'", async () => {
        fakeAdapter.findMany.mockResolvedValueOnce([]);
        fakeAdapter.count.mockResolvedValueOnce(0);
        const qb = userRepository.createQueryBuilder();

        qb.setDb(tx);
        await qb.getResultAndCount();

        expect(fakeAdapter.findMany.mock.calls[0]![1]!.db).toBe(tx);
        expect(fakeAdapter.count.mock.calls[0]![1]!.db).toBe(tx);
    });

    it("pode ser chamado várias vezes: vale sempre o último 'db'", async () => {
        fakeAdapter.findMany.mockResolvedValue([]);
        const qb = userRepository.createQueryBuilder();

        await qb.getResult();
        qb.setDb(tx);
        await qb.getResult();
        qb.setDb(dbClient);
        await qb.getResult();

        const dbs = fakeAdapter.findMany.mock.calls.map(([, options]) => options!.db);
        expect(dbs[0]).toBe(dbClient);
        expect(dbs[1]).toBe(tx);
        expect(dbs[2]).toBe(dbClient);
    });
});

describe("clone()", () => {
    beforeEach(() => {
        fakeAdapter.findMany.mockResolvedValue([]);
    });

    it("retorna um builder novo, com o mesmo estado do original", async () => {
        const original = userRepository
            .createQueryBuilder()
            .where({ active: true })
            .select({ id: true })
            .relations({ address: true })
            .orderBy({ name: "asc" })
            .limit(10)
            .offset(5)
            .distinctOn("name");

        const clone = original.clone();
        await clone.getResult();

        expect(clone).not.toBe(original);
        expect(clone).toBeInstanceOf(VSQueryBuilder);
        expect(fakeAdapter.findMany).toHaveBeenCalledWith(
            { active: true },
            {
                select: { id: true },
                relations: { address: true },
                order: { name: "asc" },
                pagination: { limit: 10, offset: 5 },
                distinct: ["name"],
                db: dbClient,
            },
        );
    });

    it("preserva o filtro do original, inclusive com 'OR'", async () => {
        const original = userRepository
            .createQueryBuilder()
            .where({ active: true, OR: [{ name: "João" }, { name: "Maria" }] });

        await original.clone().getResult();

        expect(fakeAdapter.findMany.mock.calls[0]![0]).toEqual({
            active: true,
            OR: [{ name: "João" }, { name: "Maria" }],
        });
    });

    it("alterar o clone não afeta o original", async () => {
        const original = userRepository
            .createQueryBuilder()
            .where({ active: true })
            .select({ id: true, address: { city: true } })
            .limit(10)
            .distinctOn("name");

        original
            .clone()
            .where({ balance: { gt: 1 } })
            .select({ email: true })
            .limit(99)
            .offset(1)
            .distinctOn("email")
            .see("all");
        await original.getResult();

        expect(fakeAdapter.findMany).toHaveBeenCalledWith(
            { active: true },
            {
                select: { id: true, address: { city: true } },
                pagination: { limit: 10 },
                distinct: ["name"],
                db: dbClient,
            },
        );
    });

    it("alterar o original depois de clonar não afeta o clone", async () => {
        const original = userRepository.createQueryBuilder().where({ active: true }).select({ id: true });
        const clone = original.clone();

        original
            .where({ balance: { gt: 1 } })
            .select({ name: true })
            .limit(1);
        await clone.getResult();

        expect(fakeAdapter.findMany).toHaveBeenCalledWith({ active: true }, { select: { id: true }, db: dbClient });
    });

    it("preserva valores como 'Date' no filtro do clone", async () => {
        const since = new Date("2026-01-01T00:00:00.000Z");
        const original = userRepository.createQueryBuilder().where({ createdAt: { gte: since } });

        await original.clone().getResult();

        const [where] = fakeAdapter.findMany.mock.calls[0]!;
        const gte = (where as any).createdAt.gte;
        // 'types.isDate' em vez de 'instanceof': a mesclagem/clonagem pode devolver uma 'Date' de outro realm
        // do Node, diferente da 'Date' do sandbox do Jest, então 'toBeInstanceOf(Date)' não é confiável
        expect(types.isDate(gte)).toBe(true);
        expect(gte.getTime()).toBe(since.getTime());
    });

    it("preserva o modo do 'see'", async () => {
        const clone = softDeletableRepository.createQueryBuilder().see("removed").clone();

        await clone.getResult();

        expect(fakeAdapter.findMany.mock.calls[0]![0]).toEqual({ deletedAt: { not: null } });
    });

    it("preserva o 'db' e permite trocar o 'db' só do clone", async () => {
        const original = userRepository.createQueryBuilder(tx);
        const clone = original.clone();

        await clone.getResult();
        clone.setDb(dbClient);
        await clone.getResult();
        await original.getResult();

        const dbs = fakeAdapter.findMany.mock.calls.map(([, options]) => options!.db);
        expect(dbs[0]).toBe(tx);
        expect(dbs[1]).toBe(dbClient);
        expect(dbs[2]).toBe(tx);
    });

    it("de um builder vazio, gera um clone vazio (sem 'where', 'options' ou 'distinct')", async () => {
        await userRepository.createQueryBuilder().clone().getResult();

        expect(fakeAdapter.findMany).toHaveBeenCalledWith({}, { db: dbClient });
    });

    it("permite reaproveitar uma base e derivar consultas diferentes dela", async () => {
        fakeAdapter.count.mockResolvedValue(7);
        const base = userRepository.createQueryBuilder().where({ active: true });

        const total = await base.clone().getCount();
        await base.clone().orderBy({ name: "asc" }).limit(5).getResult();

        expect(total).toBe(7);
        expect(fakeAdapter.count.mock.calls[0]![0]).toEqual({ active: true });
        expect(fakeAdapter.findMany).toHaveBeenCalledWith(
            { active: true },
            { order: { name: "asc" }, pagination: { limit: 5 }, db: dbClient },
        );
    });
});

describe("logs", () => {
    // Logger falso injetado direto no builder, para verificar exatamente o que é logado
    function createFakeLogger() {
        return {
            logDebug: jest.fn(),
            logError: jest.fn(),
            startPerformLog: jest.fn((operation: string) => ({ operation, start: 0 })),
            endPerformLog: jest.fn(),
        };
    }

    function createBuilder(logger?: ReturnType<typeof createFakeLogger>) {
        return new VSQueryBuilder<User>(
            dbClient,
            fakeAdapter,
            new MergeWheresResolver<User>("deletedAt"),
            logger as unknown as VSLogger | undefined,
        );
    }

    const debugMessages = (logger: ReturnType<typeof createFakeLogger>) =>
        logger.logDebug.mock.calls.map(([message]) => message);

    describe("logs de performance dos métodos terminais", () => {
        beforeEach(() => {
            fakeAdapter.findMany.mockResolvedValue([]);
            fakeAdapter.findOne.mockResolvedValue(null);
            fakeAdapter.findOneOrThrow.mockResolvedValue(buildUser());
            fakeAdapter.count.mockResolvedValue(0);
            fakeAdapter.exists.mockResolvedValue(false);
        });

        it.each([
            ["getResult", (qb: VSQueryBuilder<User>) => qb.getResult()],
            ["getOneResult", (qb: VSQueryBuilder<User>) => qb.getOneResult()],
            ["getOneResultOrThrow", (qb: VSQueryBuilder<User>) => qb.getOneResultOrThrow()],
            ["getCount", (qb: VSQueryBuilder<User>) => qb.getCount()],
            ["getExistence", (qb: VSQueryBuilder<User>) => qb.getExistence()],
            ["getResultAndCount", (qb: VSQueryBuilder<User>) => qb.getResultAndCount()],
        ])("'%s' inicia e encerra o log de performance, uma única vez", async (name, run) => {
            const logger = createFakeLogger();

            await run(createBuilder(logger));

            expect(logger.startPerformLog).toHaveBeenCalledTimes(1);
            expect(logger.startPerformLog).toHaveBeenCalledWith(`run query builder ${name}`);
            expect(logger.endPerformLog).toHaveBeenCalledTimes(1);
            expect(logger.endPerformLog).toHaveBeenCalledWith({ operation: `run query builder ${name}`, start: 0 });
        });

        it("encerra o log de performance mesmo quando o adapter lança erro", async () => {
            const logger = createFakeLogger();
            fakeAdapter.findMany.mockRejectedValueOnce(new Error("db down"));

            await expect(createBuilder(logger).getResult()).rejects.toThrow("db down");

            expect(logger.startPerformLog).toHaveBeenCalledTimes(1);
            expect(logger.endPerformLog).toHaveBeenCalledTimes(1);
        });

        it("loga em DEBUG a query já resolvida (com o filtro de soft-delete e as options)", async () => {
            const logger = createFakeLogger();

            await createBuilder(logger)
                .where({ active: true })
                .select({ id: true })
                .orderBy({ name: "asc" })
                .limit(10)
                .distinctOn("name")
                .getResult();

            expect(logger.logDebug).toHaveBeenCalledWith("VSQueryBuilder: getResult", {
                see: "active",
                where: { active: true, deletedAt: null },
                options: {
                    select: { id: true },
                    order: { name: "asc" },
                    pagination: { limit: 10 },
                    distinct: ["name"],
                },
            });
        });

        it("loga o modo 'see' escolhido", async () => {
            const logger = createFakeLogger();

            await createBuilder(logger).see("removed").getExistence();

            expect(logger.logDebug).toHaveBeenCalledWith("VSQueryBuilder: getExistence", {
                see: "removed",
                where: { deletedAt: { not: null } },
            });
        });

        it("loga o 'where' final, já com o filtro de soft-delete por fora do 'OR' do usuário", async () => {
            const logger = createFakeLogger();

            await createBuilder(logger)
                .where({ active: true, OR: [{ name: "João" }, { name: "Maria" }] })
                .getCount();

            expect(logger.logDebug).toHaveBeenCalledWith("VSQueryBuilder: getCount", {
                see: "active",
                where: { active: true, OR: [{ name: "João" }, { name: "Maria" }], deletedAt: null },
                options: {},
            });
        });

        it("nunca inclui o 'db' (client/transação do ORM) no que é logado", async () => {
            const logger = createFakeLogger();
            const qb = createBuilder(logger);
            qb.setDb(tx);

            await qb.getResult();
            await qb.getOneResult();
            await qb.getCount();
            await qb.getExistence();
            await qb.getResultAndCount();

            const serialized = JSON.stringify(logger.logDebug.mock.calls);
            expect(serialized).not.toContain("db-client");
            expect(serialized).not.toContain("transaction");
            for (const [, payload] of logger.logDebug.mock.calls) {
                expect(payload ?? {}).not.toHaveProperty("db");
                expect(payload?.options ?? {}).not.toHaveProperty("db");
            }
        });
    });

    describe("logs de debug dos métodos de encadeamento", () => {
        it("cada método loga em DEBUG o valor recebido", () => {
            const logger = createFakeLogger();
            const qb = createBuilder(logger);

            qb.select({ id: true })
                .relations({ address: true })
                .where({ active: true })
                .orderBy({ name: "asc" })
                .limit(10)
                .offset(5)
                .distinctOn("name")
                .see("all");

            expect(logger.logDebug.mock.calls).toEqual([
                ["VSQueryBuilder: select", { id: true }],
                ["VSQueryBuilder: relations", { address: true }],
                ["VSQueryBuilder: where", { active: true }],
                ["VSQueryBuilder: orderBy", { name: "asc" }],
                ["VSQueryBuilder: limit 10", undefined],
                ["VSQueryBuilder: offset 5", undefined],
                ["VSQueryBuilder: distinctOn", ["name"]],
                ["VSQueryBuilder: see 'all'", undefined],
            ]);
        });

        it("'setDb' e 'clone' são logados, sem expor o 'db'", () => {
            const logger = createFakeLogger();
            const qb = createBuilder(logger);

            qb.setDb(tx);
            qb.clone();

            expect(debugMessages(logger)).toEqual(["VSQueryBuilder: db replaced", "VSQueryBuilder: clone"]);
            expect(JSON.stringify(logger.logDebug.mock.calls)).not.toContain("transaction");
        });

        it("um argumento inválido não é logado como se tivesse sido aplicado", () => {
            const logger = createFakeLogger();
            const qb = createBuilder(logger);

            catchError(() => qb.limit(-1));

            expect(debugMessages(logger)).not.toContain("VSQueryBuilder: limit -1");
        });
    });

    describe("log de erro de validação", () => {
        it("loga em ERROR o motivo da falha antes de lançar", () => {
            const logger = createFakeLogger();

            const error = catchError(() => createBuilder(logger).limit(-1));

            expect(logger.logError).toHaveBeenCalledTimes(1);
            const [message] = logger.logError.mock.calls[0]!;
            expect(message).toContain(`Validation failed (${VSRepoErrorType.QUERY_BUILDER})`);
            expect(message).toContain("limit:");
            expect(error.type).toBe(VSRepoErrorType.QUERY_BUILDER);
        });
    });

    describe("sem logger", () => {
        it("funciona normalmente, sem lançar erro", async () => {
            const qb = createBuilder();
            fakeAdapter.findMany.mockResolvedValueOnce([]);

            const result = await qb.where({ active: true }).limit(1).clone().see("all").getResult();

            expect(result).toEqual([]);
        });

        it("continua lançando 'VSRepoError' na validação", () => {
            const error = catchError(() => createBuilder().limit(-1));

            expect(error).toBeInstanceOf(VSRepoError);
            expect(error.type).toBe(VSRepoErrorType.QUERY_BUILDER);
        });
    });

    // Integração com o `VSLogger` real (o mesmo usado pelo `VSRepository`)
    describe("com o logger do repository", () => {
        let logSpy: jest.SpyInstance;
        let warnSpy: jest.SpyInstance;
        let errorSpy: jest.SpyInstance;

        const output = (spy: jest.SpyInstance) => spy.mock.calls.map(args => args.join("")).join("\n");

        class LoggedUserRepository extends VSRepository<User, string> {
            constructor(adapter: VSRepoAdapter<User>, logLevel: VSLogLevel, logSlowThresholdMs?: number | boolean) {
                super({ adapter, pkName: "id", softRemoveKey: "deletedAt", logLevel, logSlowThresholdMs });
            }
        }

        beforeEach(() => {
            logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
            warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
            errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
            fakeAdapter.findMany.mockResolvedValue([]);
            fakeAdapter.count.mockResolvedValue(0);
        });

        afterEach(() => {
            logSpy.mockRestore();
            warnSpy.mockRestore();
            errorSpy.mockRestore();
        });

        it("em DEBUG escreve a query resolvida e o tempo que a operação levou", async () => {
            const repository = new LoggedUserRepository(fakeAdapter, VSLogLevel.DEBUG, false);

            await repository.createQueryBuilder().where({ active: true }).limit(3).getResult();

            const logged = output(logSpy);
            expect(logged).toContain("[DEBUG]");
            expect(logged).toContain("VSQueryBuilder: where");
            expect(logged).toContain("VSQueryBuilder: getResult");
            expect(logged).toContain('"deletedAt": null');
            expect(logged).toContain("Starting to run query builder getResult...");
            expect(logged).toMatch(/Took \d+\.\d{2}ms to run query builder getResult/);
        });

        it("em DEBUG usa o nome do logger do próprio repository", async () => {
            const repository = new LoggedUserRepository(fakeAdapter, VSLogLevel.DEBUG, false);

            await repository.createQueryBuilder().getCount();

            expect(output(logSpy)).toContain("[LoggedUserRepositoryLogger]");
        });

        it("acima de DEBUG (INFO, WARN, ERROR) não escreve nenhum log do builder", async () => {
            for (const level of [VSLogLevel.INFO, VSLogLevel.WARN, VSLogLevel.ERROR]) {
                logSpy.mockClear();
                const repository = new LoggedUserRepository(fakeAdapter, level);
                logSpy.mockClear(); // descarta os logs de inicialização do repository

                await repository.createQueryBuilder().where({ active: true }).limit(3).getResultAndCount();

                expect(output(logSpy)).not.toContain("VSQueryBuilder");
                expect(output(logSpy)).not.toContain("run query builder");
            }
        });

        it("emite WARN quando a operação passa do 'logSlowThresholdMs'", async () => {
            // O menor limite válido (precisa ser > 0), para qualquer duração já contar como "lenta"
            const repository = new LoggedUserRepository(fakeAdapter, VSLogLevel.WARN, Number.MIN_VALUE);

            await repository.createQueryBuilder().getCount();

            expect(output(warnSpy)).toMatch(
                /Took \d+\.\d{2}ms to run query builder getCount \(slower than the .*ms threshold\)/,
            );
        });

        it("não emite WARN de operação lenta quando 'logSlowThresholdMs' é 'false'", async () => {
            const repository = new LoggedUserRepository(fakeAdapter, VSLogLevel.WARN, false);

            await repository.createQueryBuilder().getCount();

            expect(warnSpy).not.toHaveBeenCalled();
        });

        it("um argumento inválido é logado em ERROR mesmo no nível padrão de log", () => {
            const repository = new LoggedUserRepository(fakeAdapter, VSLogLevel.WARN);

            catchError(() => repository.createQueryBuilder().limit(-1));

            expect(output(errorSpy)).toContain("Validation failed (QUERY_BUILDER)");
            expect(output(errorSpy)).toContain("limit:");
        });
    });
});
