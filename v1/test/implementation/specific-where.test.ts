// Teste de regressão para resolveSpecificWhere.
//
// Contexto do bug: quando um mesmo método dinâmico combina mais de um filtro que
// aponta para a MESMA relation (ex.: EnderecoWithEstado e EnderecoWithCidadeNormalizada
// na mesma query), o merge anterior usava Object.assign (merge raso), então o segundo
// filtro da relation SUBSTITUÍA o objeto inteiro da relation, fazendo o primeiro filtro
// desaparecer da query gerada.
//
// Correção: trocar Object.assign por deepmerge (merge profundo), preservando todos os
// filtros da relation. Estes testes garantem que esse comportamento não volte a quebrar.

import { describe, it, expect } from "@jest/globals";
import { resolveSpecificWhere } from "../../src/internal/resolvers/specific-where.resolve";
import { PrettyWhere } from "../../src/internal/resolvers/types/pretty-where.type";

// * Helper p/ montar um PrettyWhere com mais legibilidade nos testes
function W(context: (string | number)[], opts: Partial<PrettyWhere> = {}): PrettyWhere {
    const lastKey = context[context.length - 1];
    return {
        context,
        argName: lastKey === undefined ? "" : String(lastKey),
        ...opts,
    };
}

// =============================================================================
// REGRESSÃO DO BUG ORIGINAL: múltiplos filtros na MESMA relation
// =============================================================================

describe("resolveSpecificWhere — múltiplos filtros na mesma relation", () => {
    it("mantém os dois filtros da relation 'endereco.is' (estado + cidadeNormalizada)", () => {
        // Corresponde a: findByTercerizadoAndDisponivelOffshoreAndIdiomasSomeIdiomaAndEnderecoWithEstadoAndEnderecoWithCidadeNormalizadaStartsWithPaginated
        const prettyWheres = [
            W(["tercerizado"]),
            W(["disponivelOffshore"]),
            W(["idiomas", "some", "idioma"]),
            W(["endereco", "is", "estado"]),
            W(["endereco", "is", "cidadeNormalizada", "startsWith"]),
        ];

        const result = resolveSpecificWhere(Array(prettyWheres.length).fill("00"), prettyWheres);

        expect(result).toEqual({
            tercerizado: "00",
            disponivelOffshore: "00",
            idiomas: { some: { idioma: "00" } },
            endereco: {
                is: {
                    estado: "00",
                    cidadeNormalizada: { startsWith: "00" },
                },
            },
        });
    });

    it("preserva operadores diferentes no mesmo campo da relation (startsWith + equals)", () => {
        const prettyWheres = [
            W(["endereco", "is", "cidadeNormalizada", "startsWith"]),
            W(["endereco", "is", "cidadeNormalizada", "equals"]),
        ];

        const result = resolveSpecificWhere(["Avenida", "Avenida Paulista"], prettyWheres);

        expect(result).toEqual({
            endereco: {
                is: {
                    cidadeNormalizada: { startsWith: "Avenida", equals: "Avenida Paulista" },
                },
            },
        });
    });

    it("combina 'With' puro (autoVal {}) com 'WithCampo' em qualquer ordem", () => {
        // Ordem 1: With puro depois de WithCampo
        const order1 = resolveSpecificWhere(Array(2).fill("00"), [
            W(["endereco", "is", "estado"]),
            W(["endereco", "is"], { autoVal: {} }),
        ]);
        expect(order1).toEqual({ endereco: { is: { estado: "00" } } });

        // Ordem 2: With puro antes de WithCampo
        const order2 = resolveSpecificWhere(Array(2).fill("00"), [
            W(["endereco", "is"], { autoVal: {} }),
            W(["endereco", "is", "estado"]),
        ]);
        expect(order2).toEqual({ endereco: { is: { estado: "00" } } });
    });

    it("mescla betweenMode com outro operador no mesmo campo", () => {
        const prettyWheres = [
            W(["valor"], { betweenMode: true }),
            W(["valor", "gt"]),
        ];

        const result = resolveSpecificWhere([[10, 20], 5], prettyWheres);

        expect(result).toEqual({ valor: { gte: 10, lte: 20, gt: 5 } });
    });
});

// =============================================================================
// OR / AND groups com filtros na mesma relation
// =============================================================================

describe("resolveSpecificWhere — grupos OR/AND", () => {
    it("mescla profundamente filtros da mesma relation dentro de um grupo OR", () => {
        const prettyWheres = [
            W(["OR", 0, "endereco", "is", "estado"]),
            W(["OR", 0, "endereco", "is", "cidadeNormalizada", "startsWith"]),
            W(["OR", 1, "nome", "contains"]),
            W(["OR", 1, "ativo"]),
        ];

        const result = resolveSpecificWhere(Array(4).fill("00"), prettyWheres);

        expect(result).toEqual({
            OR: [
                {
                    endereco: {
                        is: {
                            estado: "00",
                            cidadeNormalizada: { startsWith: "00" },
                        },
                    },
                },
                { nome: { contains: "00" }, ativo: "00" },
            ],
        });
    });

    it("mescla profundamente filtros da mesma relation dentro de um grupo AND", () => {
        const prettyWheres = [
            W(["AND", 0, "endereco", "is", "estado"]),
            W(["AND", 0, "endereco", "is", "cidadeNormalizada", "startsWith"]),
            W(["AND", 1, "nome"]),
        ];

        const result = resolveSpecificWhere(Array(3).fill("00"), prettyWheres);

        expect(result).toEqual({
            AND: [
                {
                    endereco: {
                        is: {
                            estado: "00",
                            cidadeNormalizada: { startsWith: "00" },
                        },
                    },
                },
                { nome: "00" },
            ],
        });
    });

    it("não deixa 'buracos' (undefined) no array de OR", () => {
        const prettyWheres = [W(["OR", 2, "nome"])];

        const result = resolveSpecificWhere(["x"], prettyWheres);

        expect(result.OR).toEqual([{ nome: "x" }]);
    });
});

// =============================================================================
// Camadas/relações diferentes não interferem entre si
// =============================================================================

describe("resolveSpecificWhere — isolamento entre relations", () => {
    it("mantém relations distintas sem mesclar seus campos", () => {
        const prettyWheres = [
            W(["endereco", "is", "estado"]),
            W(["idiomas", "some", "idioma"]),
            W(["endereco", "is", "cidadeNormalizada", "startsWith"]),
        ];

        const result = resolveSpecificWhere(Array(3).fill("00"), prettyWheres);

        expect(result).toEqual({
            endereco: { is: { estado: "00", cidadeNormalizada: { startsWith: "00" } } },
            idiomas: { some: { idioma: "00" } },
        });
    });
});
