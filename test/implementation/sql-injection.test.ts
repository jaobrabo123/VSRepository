// Testes de SQL Injection do pipeline de query/VSSql.
//
// Garantia principal: nenhum valor fornecido pelo usuário (payload malicioso)
// pode aparecer no TEXTO SQL entregue ao adapter — ele deve chegar somente no
// array de `args` (parâmetros ligados). Cobrimos os três caminhos que montam
// SQL no core:
//   1. `VSSql.sql`/`join`/composição -> `compile()` -> `{ text, args }`
//   2. `VSRepository.query()` (com `VSSql` ou string + `vsPlaceholders`)
//   3. `@QueryMethod` (incl. `modifying: true` para UPDATE/INSERT/DELETE)
//
// `VSSql.raw` é por design o ÚNICO escape hatch que insere texto sem
// parametrizar (documentado para identificadores / input confiável) — os
// testes travam esse contrato: `raw` inlina, `sql`/`join` nunca inlinam.
//
// Não há banco real aqui (o core é ORM-agnostic): a garantia verificada é a
// separação `{ text, args }` no formato que o `VSRepoAdapter.query` recebe.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { QueryMethod } from "../../src/decorators/query-method.decorator";
import { QueryMethodArg } from "../../src/types/utils/query-method-arg.type";
import { VSSql } from "../../src/internal/utils/vs-sql.util";
import { VSRepoError } from "../../src/errors/VSRepoError";
import { VSLogLevel } from "../../src/internal/enums/vs-log-level.enum";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User, buildUser } from "../helpers/entities";

const { sql, raw, join } = VSSql;

const numberedPlaceholder = (index: number) => `$${index + 1}`;
const anonymousPlaceholder = () => "?";

// Corpus de payloads de injeção clássicos (string, comentário, UNION, unicode...).
const PAYLOAD_DROP = "'; DROP TABLE users; --";
const PAYLOAD_OR = "1 OR 1=1 --";
const PAYLOAD_UNION = "' UNION SELECT * FROM users--";
const PAYLOAD_BOBBY = "Robert'); DROP TABLE students;--";
const PAYLOAD_OR_QUOTE = "x' OR '1'='1";
const PAYLOAD_UNICODE = 'ç"; --';
const PAYLOAD_TRUNCATE = "users; TRUNCATE users; --";

const ALL_PAYLOADS: readonly string[] = [
    PAYLOAD_DROP,
    PAYLOAD_OR,
    PAYLOAD_UNION,
    PAYLOAD_BOBBY,
    PAYLOAD_OR_QUOTE,
    PAYLOAD_UNICODE,
    PAYLOAD_TRUNCATE,
];

/** Assert that `text` does not contain any payload — the SQL text must never inline user input. */
function expectNoPayloadInText(text: string, payloads: readonly unknown[]): void {
    for (const payload of payloads) {
        expect(text).not.toContain(String(payload));
    }
}

class InjectionUserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>, vsPlaceholders = false) {
        super({ adapter, pkName: "id", logLevel: VSLogLevel.ERROR, vsPlaceholders });
    }

    @QueryMethod('UPDATE "user" SET name = $1 WHERE id = $2', { modifying: true })
    declare updateNameRaw: (arg: QueryMethodArg<[name: string, id: string]>) => Promise<number>;
}

describe("SQL Injection — VSSql.sql (nível compile)", () => {
    it("UPDATE: valor interpolado vira parâmetro, payload não entra no texto", () => {
        const fragment = sql`UPDATE "user" SET email = ${PAYLOAD_DROP} WHERE id = ${"user-1"}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('UPDATE "user" SET email = $1 WHERE id = $2');
        expect(args).toEqual([PAYLOAD_DROP, "user-1"]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("INSERT: payloads em colunas e em valores ficam em args", () => {
        const fragment = sql`INSERT INTO "user" (id, name, email) VALUES (${"user-2"}, ${PAYLOAD_UNION}, ${PAYLOAD_DROP})`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('INSERT INTO "user" (id, name, email) VALUES ($1, $2, $3)');
        expect(args).toEqual(["user-2", PAYLOAD_UNION, PAYLOAD_DROP]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("DELETE: payload no WHERE vira parâmetro", () => {
        const fragment = sql`DELETE FROM "user" WHERE id = ${PAYLOAD_OR_QUOTE}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('DELETE FROM "user" WHERE id = $1');
        expect(args).toEqual([PAYLOAD_OR_QUOTE]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("SELECT: payload no meio de outros parâmetros mantém ordem e separação", () => {
        const fragment = sql`SELECT * FROM "user" WHERE active = ${true} AND email = ${PAYLOAD_OR} AND balance > ${100}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('SELECT * FROM "user" WHERE active = $1 AND email = $2 AND balance > $3');
        expect(args).toEqual([true, PAYLOAD_OR, 100]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("valores não-string (número, boolean, null) também nunca entram no texto SQL", () => {
        const fragment = sql`UPDATE "user" SET "balance" = balance + ${1} WHERE id = ${null} AND active = ${true}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('UPDATE "user" SET "balance" = balance + $1 WHERE id = $2 AND active = $3');
        expect(args).toEqual([1, null, true]);
    });

    it("funciona igual com placeholder anônimo do estilo '?' (ex.: SQLite/MySQL)", () => {
        const fragment = sql`DELETE FROM "user" WHERE email = ${PAYLOAD_DROP}`;
        const { text, args } = fragment.compile(anonymousPlaceholder);

        expect(text).toBe('DELETE FROM "user" WHERE email = ?');
        expect(args).toEqual([PAYLOAD_DROP]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });
});

describe("SQL Injection — VSSql.join", () => {
    it("UPDATE com IN(...): payloads da lista ficam em args, texto só com placeholders", () => {
        const fragment = sql`UPDATE "user" SET active = false WHERE id IN (${join([PAYLOAD_DROP, "user-2", PAYLOAD_BOBBY])})`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('UPDATE "user" SET active = false WHERE id IN ($1, $2, $3)');
        expect(args).toEqual([PAYLOAD_DROP, "user-2", PAYLOAD_BOBBY]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("DELETE com join customizado (separator ' OR ') não inlina payloads", () => {
        const fragment = sql`DELETE FROM "user" WHERE email = ${join([PAYLOAD_UNICODE, "safe@email.com"], " OR email = ")}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('DELETE FROM "user" WHERE email = $1 OR email = $2');
        expect(args).toEqual([PAYLOAD_UNICODE, "safe@email.com"]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });
});

describe("SQL Injection — composição de fragmentos VSSql", () => {
    it("fragmento aninhado com payload mantém payload em args (splice não vaza texto)", () => {
        const condition = sql`AND email = ${PAYLOAD_DROP}`;
        const fragment = sql`UPDATE "user" SET active = false WHERE 1=1 ${condition}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('UPDATE "user" SET active = false WHERE 1=1 AND email = $1');
        expect(args).toEqual([PAYLOAD_DROP]);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("join aninhado + raw legítimo: payload só em args, identificador do raw em texto", () => {
        const ids = join([PAYLOAD_UNION, "user-2"]);
        const fragment = sql`SELECT * FROM ${raw('"user"')} WHERE id IN (${ids}) AND active = ${PAYLOAD_OR}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe('SELECT * FROM "user" WHERE id IN ($1, $2) AND active = $3');
        expect(args).toEqual([PAYLOAD_UNION, "user-2", PAYLOAD_OR]);
        expectNoPayloadInText(text, [PAYLOAD_UNION, PAYLOAD_OR]);
    });
});

describe("SQL Injection — VSSql.compile / getPlaceholder", () => {
    it("getPlaceholder é chamado apenas com o índice 0-based — nunca com o payload", () => {
        const getPlaceholder = jest.fn((index: number) => `$${index + 1}`);
        const fragment = sql`UPDATE "user" SET email = ${PAYLOAD_DROP} WHERE id = ${"user-1"} AND active = ${false}`;
        const { text, args } = fragment.compile(getPlaceholder);

        expect(text).toBe('UPDATE "user" SET email = $1 WHERE id = $2 AND active = $3');
        expect(args).toEqual([PAYLOAD_DROP, "user-1", false]);
        expect(getPlaceholder).toHaveBeenCalledTimes(3);
        expect(getPlaceholder).toHaveBeenNthCalledWith(1, 0);
        expect(getPlaceholder).toHaveBeenNthCalledWith(2, 1);
        expect(getPlaceholder).toHaveBeenNthCalledWith(3, 2);
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });
});

describe("SQL Injection — contrato do VSSql.raw", () => {
    it("raw() insere o texto como está (único escape hatch, sem escape — por design)", () => {
        const fragment = sql`SELECT * FROM ${raw(PAYLOAD_TRUNCATE)} WHERE id = ${"user-1"}`;
        const { text, args } = fragment.compile(numberedPlaceholder);

        expect(text).toBe(`SELECT * FROM ${PAYLOAD_TRUNCATE} WHERE id = $1`);
        expect(args).toEqual(["user-1"]);
    });

    it("o MESMO payload via sql`${...}` ou join([...]) NUNCA é inlineado", () => {
        const viaSql = sql`SELECT * FROM "${PAYLOAD_TRUNCATE}"`;
        const compiledSql = viaSql.compile(numberedPlaceholder);

        expect(compiledSql.text).not.toContain(PAYLOAD_TRUNCATE);
        expect(compiledSql.args).toEqual([PAYLOAD_TRUNCATE]);

        const viaJoin = sql`WHERE id IN (${join([PAYLOAD_TRUNCATE])})`;
        const compiledJoin = viaJoin.compile(numberedPlaceholder);

        expect(compiledJoin.text).not.toContain(PAYLOAD_TRUNCATE);
        expect(compiledJoin.args).toEqual([PAYLOAD_TRUNCATE]);
    });

    it("raw() rejeita valor não-string antes de qualquer coisa (não vira método de injeção acidental)", () => {
        expect(() => raw({} as any)).toThrow(VSRepoError);
    });
});

describe("SQL Injection — VSRepository.query() com VSSql (modifying: true)", () => {
    let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
    let userRepository: InjectionUserRepository;

    beforeEach(() => {
        fakeAdapter = createFakeAdapter<User>();
        fakeAdapter.getPlaceholder = jest.fn(numberedPlaceholder);
        userRepository = new InjectionUserRepository(fakeAdapter);
    });

    it("UPDATE via fragmento: adapter.query recebe texto sem payload e args com payload", async () => {
        fakeAdapter.query.mockResolvedValueOnce(1);

        const fragment = VSSql.sql`UPDATE "user" SET email = ${PAYLOAD_DROP} WHERE id = ${"user-1"}`;
        await userRepository.query(fragment, { modifying: true });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'UPDATE "user" SET email = $1 WHERE id = $2',
            expect.objectContaining({ args: [PAYLOAD_DROP, "user-1"], modifying: true }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("INSERT via fragmento idem", async () => {
        fakeAdapter.query.mockResolvedValueOnce(1);

        const fragment = VSSql.sql`INSERT INTO "user" (id, name) VALUES (${"user-2"}, ${PAYLOAD_UNION})`;
        await userRepository.query(fragment, { modifying: true });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'INSERT INTO "user" (id, name) VALUES ($1, $2)',
            expect.objectContaining({ args: ["user-2", PAYLOAD_UNION], modifying: true }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("DELETE via fragmento idem", async () => {
        fakeAdapter.query.mockResolvedValueOnce(1);

        const fragment = VSSql.sql`DELETE FROM "user" WHERE email = ${PAYLOAD_BOBBY}`;
        await userRepository.query(fragment, { modifying: true });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'DELETE FROM "user" WHERE email = $1',
            expect.objectContaining({ args: [PAYLOAD_BOBBY], modifying: true }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });
});

describe("SQL Injection — VSRepository.query() com string + 'vsPlaceholders' (modifying)", () => {
    let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
    let userRepository: InjectionUserRepository;

    beforeEach(() => {
        fakeAdapter = createFakeAdapter<User>();
        fakeAdapter.getPlaceholder = jest.fn(numberedPlaceholder);
        userRepository = new InjectionUserRepository(fakeAdapter, true);
    });

    it("UPDATE: '?1'/'?2' viram placeholders nativos; payload só em args", async () => {
        fakeAdapter.query.mockResolvedValueOnce(1);

        await userRepository.query('UPDATE "user" SET email = ?1 WHERE id = ?2', {
            args: [PAYLOAD_DROP, "user-1"],
            modifying: true,
        });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'UPDATE "user" SET email = $1 WHERE id = $2',
            expect.objectContaining({ args: [PAYLOAD_DROP, "user-1"], modifying: true }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });

    it("DELETE: payload no '?1' idem", async () => {
        fakeAdapter.query.mockResolvedValueOnce(1);

        await userRepository.query('DELETE FROM "user" WHERE id = ?1', {
            args: [PAYLOAD_OR_QUOTE],
            modifying: true,
        });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'DELETE FROM "user" WHERE id = $1',
            expect.objectContaining({ args: [PAYLOAD_OR_QUOTE], modifying: true }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });
});

describe("SQL Injection — 'vsPlaceholders' não re-interpreta valores", () => {
    let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
    let userRepository: InjectionUserRepository;

    beforeEach(() => {
        fakeAdapter = createFakeAdapter<User>();
        fakeAdapter.getPlaceholder = jest.fn(numberedPlaceholder);
        userRepository = new InjectionUserRepository(fakeAdapter, true);
    });

    it("payload contendo '?1' é ligado como valor, nunca processado como placeholder", async () => {
        const sneakyPayload = "?1; DROP TABLE users; --";
        fakeAdapter.query.mockResolvedValueOnce([buildUser()]);

        await userRepository.query('SELECT * FROM "user" WHERE email = ?1', { args: [sneakyPayload] });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'SELECT * FROM "user" WHERE email = $1',
            expect.objectContaining({ args: [sneakyPayload] }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expect(text).toBe('SELECT * FROM "user" WHERE email = $1');
        expectNoPayloadInText(text, [sneakyPayload]);
    });
});

describe("SQL Injection — '@QueryMethod' com modifying: true", () => {
    let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
    let userRepository: InjectionUserRepository;

    beforeEach(() => {
        fakeAdapter = createFakeAdapter<User>();
        fakeAdapter.getPlaceholder = jest.fn(numberedPlaceholder);
        userRepository = new InjectionUserRepository(fakeAdapter);
    });

    it("UPDATE declarado no decorator: payload não entra no texto, modifying chega ao adapter", async () => {
        fakeAdapter.query.mockResolvedValueOnce(1);

        await userRepository.updateNameRaw({ args: [PAYLOAD_DROP, "user-1"] });

        expect(fakeAdapter.query).toHaveBeenCalledWith(
            'UPDATE "user" SET name = $1 WHERE id = $2',
            expect.objectContaining({ args: [PAYLOAD_DROP, "user-1"], modifying: true }),
        );

        const [text] = fakeAdapter.query.mock.calls[0]!;
        expectNoPayloadInText(text, ALL_PAYLOADS);
    });
});
