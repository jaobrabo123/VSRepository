// Testes dedicados ao PARSER de métodos dinâmicos (`DynamicMethodsResolver`).
//
// `dynamic-methods.test.ts` cobre o uso "do dia a dia" de forma realista.
// Este arquivo é mais implacável: existe uma variante para cada
// sufixo/prefixo/operador que o parser suporta, cada uma isolada num
// `it()` próprio, comparando o `where`/args resolvido contra o valor exato
// esperado. O objetivo é travar (e documentar, via nome do teste) o
// comportamento real do parser — inclusive detalhes não óbvios só visíveis
// lendo o código-fonte do resolver, como:
//
//   - `Between`/`NotBetween` viram `{ between: [min, max] }` (não `gte`/`lte`);
//   - `IsNull`/`IsNotNull` resolvem pra `null` / `{ not: null }` puro, sem
//     objeto "operator" (ex.: NÃO é `{ equals: null }`);
//   - `IgnoreCase` em um filtro de relação (`With...IgnoreCase`) fica como
//     irmão de `_with` dentro do objeto da relação, não aninhado dentro do
//     filtro do campo relacionado;
//   - blocos `AND`/`Or` combinados (`campoOrCampoANDcampoAndCampo...`) geram
//     as chaves `OR`/`AND` do Prisma-like where, cada uma com um array de
//     sub-where's mesclados.
//
// Tudo isso foi conferido rodando o parser de verdade (não é uma suposição
// de como "deveria" funcionar) antes de virar asserção fixa aqui.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { ParserRepository } from "../helpers/parser-repository";

let fakeAdapter: jest.Mocked<VSRepoAdapter<any>>;
let repo: ParserRepository;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<any>();
    repo = new ParserRepository(fakeAdapter);
    // Retorno padrão pra métodos que este arquivo não configura caso a caso.
    fakeAdapter.findMany.mockResolvedValue([]);
    fakeAdapter.findOne.mockResolvedValue(null);
    fakeAdapter.findOneOrThrow.mockResolvedValue({});
});

function where(): unknown {
    return fakeAdapter.findMany.mock.calls[0]?.[0];
}

// =============================================================================
// Filtros de campo (sufixos)
// =============================================================================

describe("filtros de campo — sem operador (igualdade)", () => {
    it("'findByName' -> { name: <valor> }", async () => {
        await repo.findByName("João");
        expect(where()).toEqual({ name: "João" });
    });

    it("'findByNameOptional' -> sufixo 'Optional' não muda a resolução, só o nome do campo", async () => {
        await repo.findByNameOptional("João");
        expect(where()).toEqual({ name: "João" });
    });
});

describe("filtros de campo — negação e conjuntos", () => {
    it("'findByNameNot' -> { name: { not: <valor> } }", async () => {
        await repo.findByNameNot("João");
        expect(where()).toEqual({ name: { not: "João" } });
    });

    it("'findByUserTypeIn' -> { userType: { in: [...] } }", async () => {
        await repo.findByUserTypeIn(["ADMIN", "COMMON"]);
        expect(where()).toEqual({ userType: { in: ["ADMIN", "COMMON"] } });
    });

    it("'findByUserTypeNotIn' -> { userType: { notIn: [...] } }", async () => {
        await repo.findByUserTypeNotIn(["ADMIN"]);
        expect(where()).toEqual({ userType: { notIn: ["ADMIN"] } });
    });
});

describe("filtros de campo — texto (Contains/StartsWith/EndsWith) e suas negações", () => {
    it("'findByNameContains' -> { name: { contains: <valor> } }", async () => {
        await repo.findByNameContains("oã");
        expect(where()).toEqual({ name: { contains: "oã" } });
    });

    it("'findByNameNotContains' -> { name: { not: { contains: <valor> } } }", async () => {
        await repo.findByNameNotContains("oã");
        expect(where()).toEqual({ name: { not: { contains: "oã" } } });
    });

    it("'findByNameStartsWith' -> { name: { startsWith: <valor> } }", async () => {
        await repo.findByNameStartsWith("Jo");
        expect(where()).toEqual({ name: { startsWith: "Jo" } });
    });

    it("'findByNameNotStartsWith' -> { name: { not: { startsWith: <valor> } } }", async () => {
        await repo.findByNameNotStartsWith("Jo");
        expect(where()).toEqual({ name: { not: { startsWith: "Jo" } } });
    });

    it("'findByNameEndsWith' -> { name: { endsWith: <valor> } }", async () => {
        await repo.findByNameEndsWith("ão");
        expect(where()).toEqual({ name: { endsWith: "ão" } });
    });

    it("'findByNameNotEndsWith' -> { name: { not: { endsWith: <valor> } } }", async () => {
        await repo.findByNameNotEndsWith("ão");
        expect(where()).toEqual({ name: { not: { endsWith: "ão" } } });
    });

    it("'findByNameContainsIgnoreCase' -> 'ignoreCase: true' fica dentro do MESMO objeto do operador de texto", async () => {
        await repo.findByNameContainsIgnoreCase("jo");
        expect(where()).toEqual({ name: { contains: "jo", ignoreCase: true } });
    });
});

describe("filtros de campo — comparação numérica/data", () => {
    const d = new Date("2026-01-01T00:00:00.000Z");

    it("'findByCreatedAtGreaterThan' -> { createdAt: { gt: <valor> } }", async () => {
        await repo.findByCreatedAtGreaterThan(d);
        expect(where()).toEqual({ createdAt: { gt: d } });
    });

    it("'findByCreatedAtGreaterThanEqual' -> { createdAt: { gte: <valor> } }", async () => {
        await repo.findByCreatedAtGreaterThanEqual(d);
        expect(where()).toEqual({ createdAt: { gte: d } });
    });

    it("'findByCreatedAtLessThan' -> { createdAt: { lt: <valor> } }", async () => {
        await repo.findByCreatedAtLessThan(d);
        expect(where()).toEqual({ createdAt: { lt: d } });
    });

    it("'findByCreatedAtLessThanEqual' -> { createdAt: { lte: <valor> } }", async () => {
        await repo.findByCreatedAtLessThanEqual(d);
        expect(where()).toEqual({ createdAt: { lte: d } });
    });

    it("'findByCreatedAtBetween' -> { createdAt: { between: [min, max] } } (NÃO vira gte/lte)", async () => {
        const range = [new Date("2026-01-01"), new Date("2026-02-01")];
        await repo.findByCreatedAtBetween(range);
        expect(where()).toEqual({ createdAt: { between: range } });
    });

    it("'findByCreatedAtNotBetween' -> { createdAt: { not: { between: [min, max] } } }", async () => {
        const range = [new Date("2026-01-01"), new Date("2026-02-01")];
        await repo.findByCreatedAtNotBetween(range);
        expect(where()).toEqual({ createdAt: { not: { between: range } } });
    });
});

describe("filtros de campo — nulidade e boolean (IsNull/IsNotNull/IsTrue/IsFalse)", () => {
    it("'findByEmailIsNull' -> { email: null } (valor puro, sem args e sem objeto operador)", async () => {
        await repo.findByEmailIsNull();
        expect(where()).toEqual({ email: null });
    });

    it("'findByEmailIsNotNull' -> { email: { not: null } } (sem args)", async () => {
        await repo.findByEmailIsNotNull();
        expect(where()).toEqual({ email: { not: null } });
    });

    it("'findByActiveIsTrue' -> { active: true } (sem args)", async () => {
        await repo.findByActiveIsTrue();
        expect(where()).toEqual({ active: true });
    });

    it("'findByActiveIsFalse' -> { active: false } (sem args)", async () => {
        await repo.findByActiveIsFalse();
        expect(where()).toEqual({ active: false });
    });
});

// =============================================================================
// Operadores lógicos
// =============================================================================

describe("operador 'And' entre dois campos simples", () => {
    it("'findOneByIdAndEmail' combina os dois campos no mesmo objeto 'where' (sem 'AND' aninhado)", async () => {
        fakeAdapter.findOne.mockResolvedValueOnce({});

        await repo.findOneByIdAndEmail("user-1", "joao@email.com");

        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({
            id: "user-1",
            email: "joao@email.com",
        });
    });
});

describe("operador 'Or' entre dois campos simples", () => {
    it("'findByNameOrEmail' gera 'where.OR' com um sub-where por campo", async () => {
        await repo.findByNameOrEmail("Nome", "e@x.com");
        expect(where()).toEqual({ OR: [{ name: "Nome" }, { email: "e@x.com" }] });
    });
});

describe("bloco composto 'campoOrCampoANDcampoAndCampoOperador' (OR + AND)", () => {
    it("separa em 'OR' (antes do 'AND' maiúsculo) e 'AND' (depois), cada bloco com seu próprio 'And' interno", async () => {
        // findByEmailOrNameANDActiveStatusAndAgeGreaterThan(email, name, activeStatus, age)
        //   -> "EmailOrName"                antes do "AND" -> vira o array OR: email OR name
        //   -> "ActiveStatusAndAgeGreaterThan" depois do "AND" -> vira o array AND: activeStatus E age > x
        await repo.findByEmailOrNameANDActiveStatusAndAgeGreaterThan(
            "e@x.com",
            "Nome",
            true,
            18,
        );

        expect(where()).toEqual({
            OR: [{ email: "e@x.com" }, { name: "Nome" }],
            AND: [{ activeStatus: true, age: { gt: 18 } }],
        });
    });
});

// =============================================================================
// Filtros de relação (_some / _every / _none / _with / _without)
// =============================================================================

describe("filtros de relação — coleção (Some/Every/None)", () => {
    it("'findByProductsSome' sem sub-filtro -> { products: { _some: {} } }", async () => {
        await repo.findByProductsSome();
        expect(where()).toEqual({ products: { _some: {} } });
    });

    it("'findByProductsSomeNameContains' -> sub-filtro do campo relacionado dentro de '_some'", async () => {
        await repo.findByProductsSomeNameContains("Camiseta");
        expect(where()).toEqual({ products: { _some: { name: { contains: "Camiseta" } } } });
    });

    it("'findByProductsEveryActiveIsTrue' -> sub-filtro booleano dentro de '_every'", async () => {
        await repo.findByProductsEveryActiveIsTrue();
        expect(where()).toEqual({ products: { _every: { active: true } } });
    });

    it("'findByProductsNone' sem sub-filtro -> { products: { _none: {} } }", async () => {
        await repo.findByProductsNone();
        expect(where()).toEqual({ products: { _none: {} } });
    });
});

describe("filtros de relação — um-para-um/opcional (With/Without)", () => {
    it("'findByAddressWith' sem sub-filtro -> { address: { _with: {} } }", async () => {
        await repo.findByAddressWith();
        expect(where()).toEqual({ address: { _with: {} } });
    });

    it("'findByAddressWithout' sem sub-filtro -> { address: { _without: {} } }", async () => {
        await repo.findByAddressWithout();
        expect(where()).toEqual({ address: { _without: {} } });
    });

    it("'findByAddressWithoutCity' -> sub-filtro (igualdade) dentro de '_without'", async () => {
        await repo.findByAddressWithoutCity("Rio de Janeiro");
        expect(where()).toEqual({ address: { _without: { city: "Rio de Janeiro" } } });
    });

    it("'findByAddressWithCityStartsWithIgnoreCase' -> 'ignoreCase' fica IRMÃO de '_with', não dentro de 'city'", async () => {
        await repo.findByAddressWithCityStartsWithIgnoreCase("Rio");

        // Repare que "ignoreCase: true" está no mesmo nível de "_with", e NÃO
        // dentro de "{ startsWith: 'Rio', ignoreCase: true }" — esse é
        // exatamente o tipo de detalhe não óbvio que este arquivo existe pra
        // travar.
        expect(where()).toEqual({
            address: {
                _with: { city: { startsWith: "Rio" } },
                ignoreCase: true,
            },
        });
    });
});

// =============================================================================
// Prefixos -> método do VSRepoAdapter chamado
// =============================================================================

describe("prefixos de leitura", () => {
    it("'findByEmail' chama 'adapter.findMany'", async () => {
        await repo.findByEmail("e@x.com");
        expect(fakeAdapter.findMany).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.findOne).not.toHaveBeenCalled();
    });

    it("'findOneByEmail' chama 'adapter.findOne'", async () => {
        await repo.findOneByEmail("e@x.com");
        expect(fakeAdapter.findOne).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.findMany).not.toHaveBeenCalled();
    });

    it("'findOneOrThrowByEmail' chama 'adapter.findOneOrThrow' com o 'where' resolvido do nome", async () => {
        await repo.findOneOrThrowByEmail("e@x.com");
        expect(fakeAdapter.findOneOrThrow.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
    });

    it("'findOneOrThrowWhere' chama 'adapter.findOneOrThrow' com o 'where' passado explicitamente", async () => {
        await repo.findOneOrThrowWhere({ email: "e@x.com" });
        expect(fakeAdapter.findOneOrThrow.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
    });

    it("'findOneOrThrow' (sem sufixo) chama 'adapter.findOneOrThrow' sem nenhum filtro", async () => {
        await repo.findOneOrThrow();
        expect(fakeAdapter.findOneOrThrow.mock.calls[0]?.[0]).toEqual({});
    });

    it("'findWhere' chama 'adapter.findMany' com o 'where' passado explicitamente (sem parsear o nome)", async () => {
        await repo.findWhere({ active: true });
        expect(fakeAdapter.findMany.mock.calls[0]?.[0]).toEqual({ active: true });
    });

    it("'findOneWhere' chama 'adapter.findOne' com o 'where' passado explicitamente", async () => {
        await repo.findOneWhere({ active: true });
        expect(fakeAdapter.findOne.mock.calls[0]?.[0]).toEqual({ active: true });
    });
});

describe("prefixos de agregação/existência", () => {
    it("'countByActive' chama 'adapter.count' com o 'where' resolvido do nome", async () => {
        fakeAdapter.count.mockResolvedValueOnce(3);
        await repo.countByActive(true);
        expect(fakeAdapter.count.mock.calls[0]?.[0]).toEqual({ active: true });
    });

    it("'countWhere' chama 'adapter.count' com o 'where' passado explicitamente", async () => {
        fakeAdapter.count.mockResolvedValueOnce(3);
        await repo.countWhere({ active: true });
        expect(fakeAdapter.count.mock.calls[0]?.[0]).toEqual({ active: true });
    });

    it("'count' (sem sufixo) chama 'adapter.count' sem nenhum filtro", async () => {
        fakeAdapter.count.mockResolvedValueOnce(10);
        await repo.count();
        expect(fakeAdapter.count.mock.calls[0]?.[0]).toEqual({});
    });

    it("'existsByEmail' chama 'adapter.exists' com o 'where' resolvido do nome", async () => {
        fakeAdapter.exists.mockResolvedValueOnce(true);
        await repo.existsByEmail("e@x.com");
        expect(fakeAdapter.exists.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
    });

    it("'existsWhere' chama 'adapter.exists' com o 'where' passado explicitamente", async () => {
        fakeAdapter.exists.mockResolvedValueOnce(false);
        await repo.existsWhere({ email: "e@x.com" });
        expect(fakeAdapter.exists.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
    });
});

describe("prefixos de escrita — create", () => {
    it("'create' chama 'adapter.create' com o objeto recebido", async () => {
        const payload = { name: "novo" };
        fakeAdapter.create.mockResolvedValueOnce(payload);

        await repo.create(payload);

        expect(fakeAdapter.create.mock.calls[0]?.[0]).toBe(payload);
    });

    it("'createMany' chama 'adapter.createMany' com a lista recebida", async () => {
        const payload = [{ name: "a" }, { name: "b" }];
        fakeAdapter.createMany.mockResolvedValueOnce({ count: 2 });

        await repo.createMany(payload);

        expect(fakeAdapter.createMany.mock.calls[0]?.[0]).toBe(payload);
    });

    it("'createManyIgnoreConflicts' passa 'ignoreConflicts: true' nas options do adapter", async () => {
        const payload = [{ name: "a" }];
        fakeAdapter.createMany.mockResolvedValueOnce({ count: 1 });

        await repo.createManyIgnoreConflicts(payload);

        expect(fakeAdapter.createMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ ignoreConflicts: true }),
        );
    });
});

describe("prefixos de escrita — update/updateMany/updateManyReturning", () => {
    it("'updateByEmail' chama 'adapter.update' com (where resolvido, data)", async () => {
        const data = { name: "novo" };
        fakeAdapter.update.mockResolvedValueOnce({});

        await repo.updateByEmail("e@x.com", data);

        expect(fakeAdapter.update.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
        expect(fakeAdapter.update.mock.calls[0]?.[1]).toBe(data);
    });

    it("'updateWhere' chama 'adapter.update' com (where explícito, data)", async () => {
        const data = { name: "novo" };
        fakeAdapter.update.mockResolvedValueOnce({});

        await repo.updateWhere({ id: "1" }, data);

        expect(fakeAdapter.update.mock.calls[0]?.[0]).toEqual({ id: "1" });
        expect(fakeAdapter.update.mock.calls[0]?.[1]).toBe(data);
    });

    it("'updateManyByActive' chama 'adapter.updateMany' com (where resolvido, data)", async () => {
        fakeAdapter.updateMany.mockResolvedValueOnce({ count: 2 });

        await repo.updateManyByActive(true, { active: false });

        expect(fakeAdapter.updateMany.mock.calls[0]?.[0]).toEqual({ active: true });
        expect(fakeAdapter.updateMany.mock.calls[0]?.[1]).toEqual({ active: false });
    });

    it("'updateManyWhere' chama 'adapter.updateMany' com (where explícito, data)", async () => {
        fakeAdapter.updateMany.mockResolvedValueOnce({ count: 2 });

        await repo.updateManyWhere({ active: true }, { active: false });

        expect(fakeAdapter.updateMany.mock.calls[0]?.[0]).toEqual({ active: true });
        expect(fakeAdapter.updateMany.mock.calls[0]?.[1]).toEqual({ active: false });
    });

    it("'updateManyReturningByActive' chama 'adapter.updateManyReturning' (não 'updateMany')", async () => {
        fakeAdapter.updateManyReturning.mockResolvedValueOnce([]);

        await repo.updateManyReturningByActive(true, { active: false });

        expect(fakeAdapter.updateManyReturning).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.updateMany).not.toHaveBeenCalled();
        expect(fakeAdapter.updateManyReturning.mock.calls[0]?.[0]).toEqual({ active: true });
    });

    it("'updateManyReturningWhere' chama 'adapter.updateManyReturning' com where explícito", async () => {
        fakeAdapter.updateManyReturning.mockResolvedValueOnce([]);

        await repo.updateManyReturningWhere({ active: true }, { active: false });

        expect(fakeAdapter.updateManyReturning.mock.calls[0]?.[0]).toEqual({ active: true });
    });
});

describe("prefixos de escrita — upsert", () => {
    it("'upsertByEmail' chama 'adapter.upsert' com (where resolvido, create, update)", async () => {
        const createData = { email: "e@x.com" };
        const updateData = { name: "novo" };
        fakeAdapter.upsert.mockResolvedValueOnce({});

        await repo.upsertByEmail("e@x.com", createData, updateData);

        expect(fakeAdapter.upsert.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
        expect(fakeAdapter.upsert.mock.calls[0]?.[1]).toBe(createData);
        expect(fakeAdapter.upsert.mock.calls[0]?.[2]).toBe(updateData);
    });

    it("'upsertWhere' chama 'adapter.upsert' com (where explícito, create, update)", async () => {
        const whereArg = { email: "e@x.com" };
        const createData = { email: "e@x.com" };
        const updateData = { name: "novo" };
        fakeAdapter.upsert.mockResolvedValueOnce({});

        await repo.upsertWhere(whereArg, createData, updateData);

        expect(fakeAdapter.upsert.mock.calls[0]?.[0]).toEqual(whereArg);
        expect(fakeAdapter.upsert.mock.calls[0]?.[1]).toBe(createData);
        expect(fakeAdapter.upsert.mock.calls[0]?.[2]).toBe(updateData);
    });
});

describe("prefixos de escrita — delete/deleteMany/deleteManyReturning", () => {
    it("'deleteByEmail' chama 'adapter.delete' com o 'where' resolvido do nome", async () => {
        fakeAdapter.delete.mockResolvedValueOnce({});
        await repo.deleteByEmail("e@x.com");
        expect(fakeAdapter.delete.mock.calls[0]?.[0]).toEqual({ email: "e@x.com" });
    });

    it("'deleteWhere' chama 'adapter.delete' com o 'where' passado explicitamente", async () => {
        fakeAdapter.delete.mockResolvedValueOnce({});
        await repo.deleteWhere({ id: "1" });
        expect(fakeAdapter.delete.mock.calls[0]?.[0]).toEqual({ id: "1" });
    });

    it("'deleteManyByActive' chama 'adapter.deleteMany'", async () => {
        fakeAdapter.deleteMany.mockResolvedValueOnce({ count: 1 });
        await repo.deleteManyByActive(false);
        expect(fakeAdapter.deleteMany.mock.calls[0]?.[0]).toEqual({ active: false });
    });

    it("'deleteManyWhere' chama 'adapter.deleteMany' com where explícito", async () => {
        fakeAdapter.deleteMany.mockResolvedValueOnce({ count: 1 });
        await repo.deleteManyWhere({ active: false });
        expect(fakeAdapter.deleteMany.mock.calls[0]?.[0]).toEqual({ active: false });
    });

    it("'deleteManyReturningByActive' chama 'adapter.deleteManyReturning' (não 'deleteMany')", async () => {
        fakeAdapter.deleteManyReturning.mockResolvedValueOnce([]);
        await repo.deleteManyReturningByActive(false);
        expect(fakeAdapter.deleteManyReturning).toHaveBeenCalledTimes(1);
        expect(fakeAdapter.deleteMany).not.toHaveBeenCalled();
    });

    it("'deleteManyReturningWhere' chama 'adapter.deleteManyReturning' com where explícito", async () => {
        fakeAdapter.deleteManyReturning.mockResolvedValueOnce([]);
        await repo.deleteManyReturningWhere({ active: false });
        expect(fakeAdapter.deleteManyReturning.mock.calls[0]?.[0]).toEqual({ active: false });
    });
});

// =============================================================================
// Ordenação, paginação e distinct
// =============================================================================

describe("sufixos 'Paginated' / 'Ordered' e a ordem dos argumentos extras", () => {
    it("'findByActivePaginated' espera '(filtro, pagination)' e propaga em 'options.pagination'", async () => {
        await repo.findByActivePaginated(true, { limit: 10, offset: 0 });

        expect(where()).toEqual({ active: true });
        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ pagination: { limit: 10, offset: 0 } }),
        );
    });

    it("'findByActiveOrdered' espera '(filtro, order)' e propaga em 'options.order'", async () => {
        await repo.findByActiveOrdered(true, { createdAt: "desc" });

        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ order: { createdAt: "desc" } }),
        );
    });

    it("'findByActiveOrderedAndPaginated' espera '(filtro, order, pagination)' nessa ordem", async () => {
        await repo.findByActiveOrderedAndPaginated(
            true,
            { createdAt: "desc" },
            { limit: 10, offset: 0 },
        );

        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({
                order: { createdAt: "desc" },
                pagination: { limit: 10, offset: 0 },
            }),
        );
    });

    it("'findByActivePaginatedAndOrdered' espera '(filtro, pagination, order)' — ordem invertida no nome, mesmo resultado final", async () => {
        await repo.findByActivePaginatedAndOrdered(
            true,
            { limit: 10, offset: 0 },
            { createdAt: "desc" },
        );

        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({
                order: { createdAt: "desc" },
                pagination: { limit: 10, offset: 0 },
            }),
        );
    });
});

describe("sufixo 'OrderBy<Campo>[Asc|Desc]' — ordenação FIXA embutida no nome (sem argumento extra)", () => {
    it("'findByActiveOrderByCreatedAtDesc' só recebe o argumento do filtro; a ordenação vem fixa do nome", async () => {
        await repo.findByActiveOrderByCreatedAtDesc(true);

        expect(where()).toEqual({ active: true });
        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ order: [{ createdAt: "DESC" }] }),
        );
    });

    it("'findByActiveOrderByCreatedAtAscAndNameDesc' encadeia múltiplos campos de ordenação via 'And'", async () => {
        await repo.findByActiveOrderByCreatedAtAscAndNameDesc(true);

        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({
                order: [{ createdAt: "ASC" }, { name: "DESC" }],
            }),
        );
    });
});

describe("sufixo 'Distinct<Campo>'", () => {
    it("'findByActiveDistinctName' propaga 'options.distinct' com o(s) campo(s) do nome", async () => {
        await repo.findByActiveDistinctName(true);

        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ distinct: ["name"] }),
        );
    });

    it("'findByActiveDistinctNameOrderByCreatedAtDesc' combina 'distinct' com ordenação fixa no mesmo nome", async () => {
        await repo.findByActiveDistinctNameOrderByCreatedAtDesc(true);

        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({
                distinct: ["name"],
                order: [{ createdAt: "DESC" }],
            }),
        );
    });
});

// =============================================================================
// Options do decorator: 'proxyTo' e 'injectOrdering'
// =============================================================================

describe("option 'proxyTo' do decorator", () => {
    it("um nome de método fora do padrão (em português) resolve como se fosse o padrão apontado em 'proxyTo'", async () => {
        await repo.buscarPorEmail("e@x.com");

        expect(fakeAdapter.findMany).toHaveBeenCalledTimes(1);
        expect(where()).toEqual({ email: "e@x.com" });
    });
});

describe("option 'injectOrdering' do decorator", () => {
    it("injeta 'order' fixo sem precisar do sufixo 'OrderBy...' no nome nem de argumento extra", async () => {
        await repo.findByLikesVSRepo(true);

        expect(where()).toEqual({ likesVSRepo: true });
        expect(fakeAdapter.findMany.mock.calls[0]?.[1]).toEqual(
            expect.objectContaining({ order: { createdAt: "desc" } }),
        );
    });
});

// =============================================================================
// Contagem de argumentos — o parser calcula quantos parâmetros cada método
// dinâmico exige a partir do nome, e valida isso em runtime antes de montar
// o 'where'.
// =============================================================================

describe("validação de quantidade de argumentos", () => {
    it("rejeita quando faltam argumentos, citando o nome do campo que ficou sem valor", async () => {
        await expect((repo as any).findByName()).rejects.toThrow(/name/i);
    });

    it("rejeita quando faltam argumentos em um método com múltiplos campos (And)", async () => {
        await expect((repo as any).findOneByIdAndEmail("user-1")).rejects.toThrow(/email/i);
    });

    it("não rejeita métodos cujo sufixo dispensa argumento (IsNull/IsTrue/etc)", async () => {
        await expect(repo.findByEmailIsNull()).resolves.not.toThrow();
    });
});
