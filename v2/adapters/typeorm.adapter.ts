import {
    And,
    Between,
    Equal,
    FindOperator,
    FindOptionsWhere,
    ILike,
    In,
    IsNull,
    LessThan,
    LessThanOrEqual,
    Like,
    MoreThan,
    MoreThanOrEqual,
    Not,
} from "typeorm";

import { VSRepoWhere } from "../types/vsrepo/vsrepo-where.type";
import { UserGetPayload } from "../../generated/prisma/models";

/**
 * Parser que converte um `VSRepoWhere<T>` em um `where` válido para o TypeORM
 * (`FindOptionsWhere<T> | FindOptionsWhere<T>[]`).
 *
 * A tipagem atual já reflete a limitação do TypeORM: `AND`/`OR`/`NOT` só
 * existem em `VSRepoWhere<T>` (nível raiz). Dentro de relações
 * (`_some`/`_every`/`_none`/`_with`/`_without`) o tipo usado é
 * `VSRepoWherePlain<U>`, que NÃO tem operadores lógicos — por isso a
 * recursão para relações usa `parseNestedWhere` (só campos), e não a
 * resolução DNF de `AND`/`OR`/`NOT` usada na raiz.
 *
 * IMPORTANTE — limitações reais do TypeORM (diferente do Prisma):
 *
 *  1. `OR` só existe nativamente como ARRAY no nível raiz do `where` passado
 *     para `repository.find()`. Por isso `VSRepoWherePlain` (usado dentro de
 *     relações) não tem `OR` — não haveria como expressar isso de forma
 *     declarativa lá.
 *  2. `NOT` só existe como operador de campo (`Not(valor)`), não como
 *     combinador de um objeto inteiro. No nível raiz, esse parser converte
 *     tudo para "forma normal disjuntiva" (DNF): qualquer combinação de
 *     AND/OR/NOT no topo é resolvida corretamente, distribuindo os NOTs por
 *     De Morgan e as ANDs por Not()/And() por campo.
 *  3. `_every` / `_none` NÃO têm equivalente declarativo no TypeORM (exigem
 *     subquery / NOT EXISTS). O parser lança um erro explícito nesses casos,
 *     recomendando QueryBuilder.
 *  4. `_without` é uma APROXIMAÇÃO: nega campo a campo a condição interna
 *     (`Not(...)` em cada campo). Isso não é logicamente idêntico a um
 *     "NOT EXISTS" (não cobre o caso de a relação simplesmente não existir).
 *     Para semântica exata de "sem relacionamento correspondente", use
 *     QueryBuilder com `NOT EXISTS`/`leftJoin + IS NULL`.
 */

type PlainObject = Record<string, any>;

const FIELD_OPERATOR_KEYS = new Set([
    "equals",
    "not",
    "in",
    "notIn",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "contains",
    "startsWith",
    "endsWith",
    "ignoreCase",
]);

const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);

function isPlainObject(value: unknown): value is PlainObject {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof FindOperator)
    );
}

function isFieldOperatorObject(value: PlainObject): boolean {
    return Object.keys(value).some(key => FIELD_OPERATOR_KEYS.has(key));
}

function isArrayRelationFilter(value: PlainObject): boolean {
    return "_some" in value || "_every" in value || "_none" in value;
}

function isObjectRelationFilter(value: PlainObject): boolean {
    return "_with" in value || "_without" in value;
}

/** Garante que o valor seja um FindOperator (envolve valores crus em Equal()) */
function toOperator(value: any): any {
    return value instanceof FindOperator ? value : Equal(value);
}

function likeOperator(pattern: string, ignoreCase: boolean) {
    return ignoreCase ? ILike(pattern) : Like(pattern);
}

/** Converte um VSRepoFieldOperators<V> em um FindOperator do TypeORM */
function parseFieldOperators(value: PlainObject): any {
    const ignoreCase = value.ignoreCase === true;
    const operators: any[] = [];

    for (const [key, val] of Object.entries(value)) {
        if (val === undefined || key === "ignoreCase") continue;

        switch (key) {
            case "equals":
                operators.push(val === null ? IsNull() : Equal(val));
                break;

            case "not": {
                const inner =
                    val === null
                        ? IsNull()
                        : isPlainObject(val) && isFieldOperatorObject(val)
                          ? parseFieldOperators(val)
                          : val;
                operators.push(Not(inner));
                break;
            }

            case "in":
                operators.push(In(val as any[]));
                break;

            case "notIn":
                operators.push(Not(In(val as any[])));
                break;

            case "gt":
                operators.push(MoreThan(val));
                break;

            case "gte":
                operators.push(MoreThanOrEqual(val));
                break;

            case "lt":
                operators.push(LessThan(val));
                break;

            case "lte":
                operators.push(LessThanOrEqual(val));
                break;

            case "between": {
                const [min, max] = val as [any, any];
                operators.push(Between(min, max));
                break;
            }

            case "contains":
                operators.push(likeOperator(`%${val}%`, ignoreCase));
                break;

            case "startsWith":
                operators.push(likeOperator(`${val}%`, ignoreCase));
                break;

            case "endsWith":
                operators.push(likeOperator(`%${val}`, ignoreCase));
                break;
        }
    }

    if (operators.length === 0) return undefined;
    if (operators.length === 1) return operators[0];
    return And(...operators);
}

/** Nega campo a campo um objeto de condições já resolvido: NOT(f1 AND f2) = OR(NOT f1, NOT f2) */
function negateFields(obj: PlainObject): PlainObject {
    const result: PlainObject = {};
    for (const [key, val] of Object.entries(obj)) {
        result[key] = Not(toOperator(val));
    }
    return result;
}

/** Merge de dois objetos como AND: campos em comum viram And(op1, op2) */
function mergeAnd(a: PlainObject, b: PlainObject): PlainObject {
    const result: PlainObject = { ...a };
    for (const [key, val] of Object.entries(b)) {
        result[key] = key in result ? And(toOperator(result[key]), toOperator(val)) : val;
    }
    return result;
}

/**
 * Resolve o valor de UM campo (não-lógico): valor cru, operadores de campo,
 * ou filtro de relação (_some/_every/_none/_with/_without).
 */
function resolveFieldValue(value: unknown): unknown {
    if (value === null) return IsNull();
    if (value === undefined) return undefined;
    if (value instanceof Date || typeof value !== "object") return value; // valor cru = equals
    if (Array.isArray(value)) return value; // array cru (coluna array); para "IN" use o operador `in`

    const obj = value as PlainObject;

    if (isArrayRelationFilter(obj)) {
        if (obj._some !== undefined) return parseNestedWhere(obj._some);
        throw new Error(
            "`_every`/`_none` não têm equivalente declarativo no TypeORM. " +
                "Use QueryBuilder com subquery (ex.: NOT EXISTS / COUNT) para esse filtro.",
        );
    }

    if (isObjectRelationFilter(obj)) {
        if (obj._with !== undefined) return parseNestedWhere(obj._with);
        if (obj._without !== undefined) {
            // aproximação: nega campo a campo (não é um NOT EXISTS real)
            return negateFields(parseNestedWhere(obj._without));
        }
    }

    if (isFieldOperatorObject(obj)) {
        return parseFieldOperators(obj);
    }

    return parseNestedWhere(obj);
}

/**
 * Parser para condições ANINHADAS (dentro de uma relação: _with/_some),
 * correspondente a `VSRepoWherePlain<U>` — só campos, sem AND/OR/NOT.
 *
 * O tipo já impede `AND`/`OR`/`NOT` nesse nível em compile-time; o guard
 * abaixo é só defensivo, para o caso de o objeto ser montado dinamicamente
 * (sem passar pelo type-checker) e acabar incluindo uma dessas chaves.
 */
function parseNestedWhere(where: PlainObject | undefined | null): PlainObject {
    if (!where) return {};

    let result: PlainObject = {};

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined) continue;

        if (LOGICAL_KEYS.has(key)) {
            throw new Error(
                `\`${key}\` não é suportado dentro de condições de relação (_with/_some) no TypeORM — ` +
                    "só é suportado no nível raiz do `where`. Use QueryBuilder para esse caso.",
            );
        }

        result = mergeAnd(result, { [key]: resolveFieldValue(value) });
    }

    return result;
}

/** AND cruzado entre duas listas de branches (produto cartesiano) */
function crossAnd(a: PlainObject[], b: PlainObject[]): PlainObject[] {
    const result: PlainObject[] = [];
    for (const x of a) {
        for (const y of b) {
            result.push(mergeAnd(x, y));
        }
    }
    return result;
}

/** NOT(f1 AND f2 AND ...) = OR(NOT f1, NOT f2, ...), como lista de branches (OR) */
function negateBranch(branch: PlainObject): PlainObject[] {
    const keys = Object.keys(branch);
    if (keys.length === 0) return [{}];
    return keys.map(key => ({ [key]: Not(toOperator(branch[key])) }));
}

/**
 * Parser do nível RAIZ (`VSRepoWhere<T>`): resolve AND/OR/NOT (objeto ou
 * array) convertendo para forma normal disjuntiva (lista de branches, cada
 * branch é um AND). 1 branch = objeto único; 2+ = array (OR nativo do
 * TypeORM).
 */
function parseWhereDNF(where: PlainObject | undefined | null): PlainObject[] {
    if (!where) return [{}];

    let branches: PlainObject[] = [{}];

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined) continue;

        if (key === "AND") {
            const list = Array.isArray(value) ? value : [value];
            for (const sub of list) {
                branches = crossAnd(branches, parseWhereDNF(sub));
            }
            continue;
        }

        if (key === "OR") {
            const list = Array.isArray(value) ? value : [value];
            let orBranches: PlainObject[] = [];
            for (const sub of list) {
                orBranches.push(...parseWhereDNF(sub));
            }
            branches = crossAnd(branches, orBranches);
            continue;
        }

        if (key === "NOT") {
            const list = Array.isArray(value) ? value : [value];
            let notAccumulator: PlainObject[] = [{}];
            for (const sub of list) {
                const subBranches = parseWhereDNF(sub); // OR-list do sub
                // NOT(OR(b1, b2, ...)) = AND(NOT b1, NOT b2, ...)
                let andOfNegations: PlainObject[] = [{}];
                for (const branch of subBranches) {
                    andOfNegations = crossAnd(andOfNegations, negateBranch(branch));
                }
                notAccumulator = crossAnd(notAccumulator, andOfNegations);
            }
            branches = crossAnd(branches, notAccumulator);
            continue;
        }

        const resolved = resolveFieldValue(value);
        branches = branches.map(b => mergeAnd(b, { [key]: resolved }));
    }

    return branches;
}

/**
 * API pública. Use os generics para tipar entrada e saída, ex:
 *
 *   const where = parseVSRepoWhere<User>(vsWhere);
 *   await userRepository.find({ where });
 */
export function parseVSRepoWhere<T>(
    where: VSRepoWhere<T> | undefined | null,
): FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined {
    if (!where) return undefined;

    const branches = parseWhereDNF(where as PlainObject);

    if (branches.length === 0) return undefined;
    return (branches.length === 1 ? branches[0] : branches) as any;
}

// type User = UserGetPayload<{ include: { address: true; products: true } }>;

// const where = parseVSRepoWhere<User>({
//     id: crypto.randomUUID(),
//     active: true,
//     createdAt: { between: [new Date(), new Date()] },
//     address: {
//         _with: {
//             city: {
//                 startsWith: "tal",
//                 ignoreCase: true,
//             },
//         },
//     },
//     products: {
//         _some: {
//             createdAt: { gt: new Date() },
//         },
//     },
// });

// console.log(where);
