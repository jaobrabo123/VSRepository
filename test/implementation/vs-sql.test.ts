// Testes puros do `VSSql` (`sql`/`raw`/`empty`/`join`): não dependem de
// adapter/banco, só verificam a compilação de `{ text, args }` a partir de um
// `getPlaceholder(index)` passado explicitamente — do mesmo jeito que
// `VSRepository.query()` faz internamente.

import { describe, it, expect } from "@jest/globals";
import { VSSql } from "../../src/internal/utils/vs-sql.util";
import { VSRepoError } from "../../src/errors/VSRepoError";

const { sql, raw, empty, join } = VSSql;

const numberedPlaceholder = (index: number) => `$${index + 1}`;
const anonymousPlaceholder = () => "?";

describe("VSSql.sql", () => {
    it("compila um fragmento simples com um único parâmetro", () => {
        const fragment = sql`SELECT * FROM "user" WHERE email = ${"joao@email.com"}`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: 'SELECT * FROM "user" WHERE email = $1',
            args: ["joao@email.com"],
        });
    });

    it("compila múltiplos parâmetros na ordem de interpolação", () => {
        const fragment = sql`WHERE active = ${true} AND age > ${18}`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: "WHERE active = $1 AND age > $2",
            args: [true, 18],
        });
    });

    it("renderiza os placeholders de acordo com a função recebida (estilo '?')", () => {
        const fragment = sql`WHERE id = ${"user-1"}`;

        expect(fragment.compile(anonymousPlaceholder)).toEqual({
            text: "WHERE id = ?",
            args: ["user-1"],
        });
    });

    it("sem nenhum valor interpolado, retorna o texto puro sem args", () => {
        const fragment = sql`SELECT 1`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({ text: "SELECT 1", args: [] });
    });

    it("faz splice de um 'VSSql' aninhado (texto + seus próprios args), em vez de tratá-lo como parâmetro", () => {
        const condition = sql`AND active = ${true}`;
        const fragment = sql`SELECT * FROM "user" WHERE 1=1 ${condition}`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: 'SELECT * FROM "user" WHERE 1=1 AND active = $1',
            args: [true],
        });
    });

    it("mantém a numeração correta quando um fragmento aninhado vem entre outros parâmetros", () => {
        const condition = sql`AND active = ${true}`;
        const fragment = sql`WHERE email = ${"joao@email.com"} ${condition} AND age > ${18}`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: "WHERE email = $1 AND active = $2 AND age > $3",
            args: ["joao@email.com", true, 18],
        });
    });
});

describe("VSSql.raw", () => {
    it("insere o texto sem virar parâmetro", () => {
        const fragment = sql`SELECT * FROM ${raw('"user"')} WHERE active = ${true}`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: 'SELECT * FROM "user" WHERE active = $1',
            args: [true],
        });
    });

    it("rejeita um valor que não é string", () => {
        expect(() => raw(123 as any)).toThrow(VSRepoError);
    });
});

describe("VSSql.empty", () => {
    it("não contribui com texto nem parâmetros", () => {
        const filter = false ? sql`AND active = ${true}` : empty;
        const fragment = sql`SELECT * FROM "user" WHERE 1=1 ${filter}`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: 'SELECT * FROM "user" WHERE 1=1 ',
            args: [],
        });
    });
});

describe("VSSql.join", () => {
    it("junta valores simples com o separador padrão, cada um virando um parâmetro", () => {
        const fragment = sql`WHERE id IN (${join(["user-1", "user-2", "user-3"])})`;

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: "WHERE id IN ($1, $2, $3)",
            args: ["user-1", "user-2", "user-3"],
        });
    });

    it("aceita separador/prefix/suffix customizados", () => {
        const fragment = join([1, 2], " OR ", "(", ")");

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: "($1 OR $2)",
            args: [1, 2],
        });
    });

    it("faz splice de fragmentos 'VSSql' dentro da lista", () => {
        const fragment = join([sql`UPPER(${"a"})`, sql`LOWER(${"B"})`]);

        expect(fragment.compile(numberedPlaceholder)).toEqual({
            text: "UPPER($1), LOWER($2)",
            args: ["a", "B"],
        });
    });

    it("rejeita um array vazio", () => {
        expect(() => join([])).toThrow(VSRepoError);
    });

    it("rejeita um valor que não é array", () => {
        expect(() => join("not-an-array" as any)).toThrow(VSRepoError);
    });
});
