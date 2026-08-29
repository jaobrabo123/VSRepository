/**
 * Parser que converte um `VSRepoWhere<T>` (formato "amigável" da aplicação)
 * em um `where` válido de qualquer modelo do Prisma.
 *
 * Suporta:
 *  - Valor direto:               { name: "Ana" }
 *  - Operadores de campo:        { age: { gte: 18, lte: 65 } }
 *  - `between`:                  { age: { between: [18, 65] } } -> { gte: 18, lte: 65 }
 *  - `not` (valor ou operador):  { name: { not: "Ana" } }
 *                                { name: { not: { contains: "an" } } }
 *  - Strings case-insensitive:   { name: { contains: "ana", ignoreCase: true } }
 *                                -> { contains: "ana", mode: "insensitive" }
 *  - Relação lista (array):      { posts: { _some: { title: "x" } } } -> { posts: { some: {...} } }
 *  - Relação objeto (to-one):    { author: { _with: { id: 1 } } }    -> { author: { is: {...} } }
 *                                { author: { _without: { id: 1 } } } -> { author: { isNot: {...} } }
 *  - Lógicos no nível raiz:      { AND: [...] , OR: [...], NOT: {...} }
 *
 * Reflete a tipagem atual: `AND`/`OR`/`NOT` só existem em `VSRepoWhere<T>`
 * (nível raiz). Dentro de relações (`_some`/`_every`/`_none`/`_with`/
 * `_without`), o tipo usado é `VSRepoWherePlain<U>`, que NÃO tem esses
 * operadores lógicos — por isso a recursão para relações usa
 * `parsePlainWhere`, e não `parseWhere`.
 */

import { VSRepoWhere } from "../../../types/vsrepo/vsrepo-where.type";
import { PlainObject } from "../types/plain-object.type";
import { isDecimal } from "../validators/is-decimal.validator";
import { isPlainObject } from "../validators/is-plain-object.validator";

/** Chaves reconhecidas como operadores de campo do VSRepoFieldOperators */
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

/** Chaves de operadores de string que aceitam `mode: 'insensitive'` no Prisma */
const CASE_SENSITIVE_STRING_KEYS = ["equals", "contains", "startsWith", "endsWith"];

const LOGICAL_KEYS = new Set(["AND", "OR", "NOT"]);


/** Verifica se um objeto "parece" um VSRepoFieldOperators (e não um filtro de relação/nested where) */
function isFieldOperatorObject(value: PlainObject): boolean {
    return Object.keys(value).some(key => FIELD_OPERATOR_KEYS.has(key));
}

function isArrayRelationFilter(value: PlainObject): boolean {
    return "_some" in value || "_every" in value || "_none" in value;
}

function isObjectRelationFilter(value: PlainObject): boolean {
    return "_with" in value || "_without" in value;
}

/**
 * Converte um VSRepoFieldOperators<V> em um filtro de campo do Prisma.
 */
function parseFieldOperators(value: PlainObject): PlainObject {
    const result: PlainObject = {};
    const ignoreCase = value.ignoreCase === true;

    for (const [key, val] of Object.entries(value)) {
        if (val === undefined) continue;

        switch (key) {
            case "ignoreCase":
                // tratado à parte, no final (vira `mode`)
                break;

            case "between": {
                const [min, max] = val as [any, any];
                if (min !== undefined) result.gte = min;
                if (max !== undefined) result.lte = max;
                break;
            }

            case "not": {
                result.not =
                    isPlainObject(val) && isFieldOperatorObject(val)
                        ? parseFieldOperators(val)
                        : val;
                break;
            }

            default:
                result[key] = val;
        }
    }

    if (ignoreCase) {
        const hasCaseSensitiveKey = CASE_SENSITIVE_STRING_KEYS.some(k => k in result);
        if (hasCaseSensitiveKey) {
            result.mode = "insensitive";
        }
    }

    return result;
}

/** Converte { _some, _every, _none } em { some, every, none } (VSRepoWherePlain — sem AND/OR/NOT) */
function parseArrayRelationFilter(value: PlainObject): PlainObject {
    const result: PlainObject = {};

    if (value._some !== undefined) {
        result.some = parsePlainWhere(value._some);
    }
    if (value._every !== undefined) {
        result.every = parsePlainWhere(value._every);
    }
    if (value._none !== undefined) {
        result.none = parsePlainWhere(value._none);
    }

    return result;
}

/** Converte { _with, _without } em { is, isNot } (VSRepoWherePlain — sem AND/OR/NOT) */
function parseObjectRelationFilter(value: PlainObject): PlainObject {
    if (value._with !== undefined) {
        return { is: parsePlainWhere(value._with) };
    }
    if (value._without !== undefined) {
        return { isNot: parsePlainWhere(value._without) };
    }
    return {};
}

/** Decide como interpretar o valor de um campo do where */
function parseFieldValue(value: unknown): unknown {
    // valores primitivos (string, number, boolean, Date, null, bigint, Decimal) passam direto
    if (value === null || typeof value !== "object" || value instanceof Date || isDecimal(value)) {
        return value;
    }

    // arrays (usados em `in`/`notIn` no nível mais alto, ex: { status: ["A","B"] })
    if (Array.isArray(value)) {
        return value;
    }

    const obj = value as PlainObject;

    if (isArrayRelationFilter(obj)) {
        return parseArrayRelationFilter(obj);
    }

    if (isObjectRelationFilter(obj)) {
        return parseObjectRelationFilter(obj);
    }

    if (isFieldOperatorObject(obj)) {
        return parseFieldOperators(obj);
    }

    // fallback: nested where (não deveria ocorrer para campos primitivos bem tipados)
    return parsePlainWhere(obj);
}

/**
 * Converte um `VSRepoWherePlain<T>` (sem AND/OR/NOT) — usado para o corpo de
 * relações (`_some`/`_every`/`_none`/`_with`/`_without`).
 */
function parsePlainWhere(where: PlainObject | undefined | null): PlainObject | undefined {
    if (where === undefined || where === null) return undefined;

    const result: PlainObject = {};

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined) continue;
        result[key] = parseFieldValue(value);
    }

    return result;
}

/**
 * Converte um `VSRepoWhere<T>` completo (nível raiz, com AND/OR/NOT) em um
 * where do Prisma.
 */
function parseWhere(where: PlainObject | undefined | null): PlainObject | undefined {
    if (where === undefined || where === null) return undefined;

    const result: PlainObject = {};

    for (const [key, value] of Object.entries(where)) {
        if (value === undefined) continue;

        if (LOGICAL_KEYS.has(key)) {
            result[key] = Array.isArray(value) ? value.map(v => parseWhere(v)) : parseWhere(value);
            continue;
        }

        result[key] = parseFieldValue(value);
    }

    return result;
}

/**
 * API pública. Use o segundo generic para tipar o retorno com o `WhereInput`
 * do Prisma correspondente ao modelo, ex:
 *
 *   parseVSRepoWhere<User, Prisma.UserWhereInput>(where)
 */
export function parsePrismaWhere<T, W = any>(
    where: VSRepoWhere<T> | undefined | null,
): W | undefined {
    return parseWhere(where) as W | undefined;
}
