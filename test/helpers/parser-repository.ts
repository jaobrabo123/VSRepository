// Repository "canhão de prova" usado só pelos testes do parser de métodos
// dinâmicos (`dynamic-methods-parser.test.ts`). Reúne, num único lugar,
// uma variante `declare` para cada sufixo/prefixo/operador suportado por
// `DynamicMethodsResolver`, para que os testes fiquem simples de ler: cada
// `it()` chama um método e verifica o `where`/args resolvido.
//
// Os métodos são tipados de forma solta (`(...args: any[]) => Promise<any>`)
// de propósito — o parser resolve tudo a partir do NOME do campo em runtime,
// então não precisamos (nem queremos) que os nomes de campo usados aqui
// correspondam 1:1 às chaves reais de `User` só para exercitar o parser.

import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { DynamicMethod } from "../../src/decorators/dynamic-method.decorator";

export class ParserRepository extends VSRepository<any, string> {
    constructor(adapter: VSRepoAdapter<any>) {
        super({ adapter, pkName: "id" });
    }

    // ---- Filtros de campo (sufixos) ----
    @DynamicMethod() declare findByName: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameNot: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByUserTypeIn: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByUserTypeNotIn: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameContains: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameNotContains: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameStartsWith: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameNotStartsWith: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameEndsWith: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameNotEndsWith: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByCreatedAtGreaterThan: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByCreatedAtGreaterThanEqual: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByCreatedAtLessThan: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByCreatedAtLessThanEqual: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByCreatedAtBetween: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByCreatedAtNotBetween: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByEmailIsNull: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByEmailIsNotNull: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveIsTrue: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveIsFalse: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameContainsIgnoreCase: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameOptional: (...args: any[]) => Promise<any>;

    // ---- Operadores lógicos ----
    @DynamicMethod() declare findOneByIdAndEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByNameOrEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByEmailOrNameANDActiveStatusAndAgeGreaterThan: (
        ...args: any[]
    ) => Promise<any>;

    // ---- Filtros de relação ----
    @DynamicMethod() declare findByProductsSome: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByProductsSomeNameContains: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByProductsEveryActiveIsTrue: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByProductsNone: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByAddressWith: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByAddressWithCityStartsWithIgnoreCase: (
        ...args: any[]
    ) => Promise<any>;
    @DynamicMethod() declare findByAddressWithout: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByAddressWithoutCity: (...args: any[]) => Promise<any>;

    // ---- Prefixos -> método do adapter ----
    @DynamicMethod() declare findByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findOneByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findOneOrThrowByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findOneOrThrowWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findOneOrThrow: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findOneWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare countByActive: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare countWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare count: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare existsByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare existsWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare create: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare createMany: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare createManyIgnoreConflicts: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare updateByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare updateWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare updateManyByActive: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare updateManyWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare updateManyReturningByActive: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare updateManyReturningWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare upsertByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare upsertWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare deleteByEmail: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare deleteWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare deleteManyByActive: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare deleteManyWhere: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare deleteManyReturningByActive: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare deleteManyReturningWhere: (...args: any[]) => Promise<any>;

    // ---- Ordenação, paginação e distinct ----
    @DynamicMethod() declare findByActivePaginated: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveOrdered: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveOrderedAndPaginated: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActivePaginatedAndOrdered: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveOrderByCreatedAtDesc: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveOrderByCreatedAtAscAndNameDesc: (
        ...args: any[]
    ) => Promise<any>;
    @DynamicMethod() declare findByActiveDistinctName: (...args: any[]) => Promise<any>;
    @DynamicMethod() declare findByActiveDistinctNameOrderByCreatedAtDesc: (
        ...args: any[]
    ) => Promise<any>;

    // ---- Options do decorator (`proxyTo` / `injectOrdering`) ----
    @DynamicMethod({ proxyTo: "findByEmail" })
    declare buscarPorEmail: (...args: any[]) => Promise<any>;

    @DynamicMethod<any>({ injectOrdering: { createdAt: "desc" } })
    declare findByLikesVSRepo: (...args: any[]) => Promise<any>;
}
