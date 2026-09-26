// Testes do `VSRawQueryBuilder`, criado via `userRepository.createRawQueryBuilder()`.
// Como no resto do core, não há banco/ORM real: o `VSRepoAdapter` é falso.
// `toVSSql()`/`toSql()` são testados compilando o `VSSql` resultante (ou a
// string, via `getPlaceholder` do fake adapter) — sem tocar o adapter.
// `execute()` é testado verificando QUAIS argumentos chegam em `adapter.query`
// (texto, args, db, modifying: false) e que o retorno é propagado sem alterações.

import "reflect-metadata";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { VSRepoError } from "../../src/errors/VSRepoError";
import { VSSql } from "../../src/internal/utils/vs-sql.util";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User } from "../helpers/entities";
import { UserRepository } from "../helpers/user-repository";

const numberedPlaceholder = (index: number) => `$${index + 1}`;

const dbClient = { name: "db-client" };
const tx = { name: "transaction" };

let fakeAdapter: jest.Mocked<VSRepoAdapter<User>>;
let userRepository: UserRepository;

beforeEach(() => {
    fakeAdapter = createFakeAdapter<User>();
    fakeAdapter.getDbClient.mockReturnValue(dbClient);
    fakeAdapter.getPlaceholder = numberedPlaceholder;

    userRepository = new UserRepository(fakeAdapter);
});

describe("VSRawQueryBuilder — montagem das cláusulas (toVSSql)", () => {
    it("compila um select simples com 'SELECT *' quando nenhuma coluna é informada", () => {
        const qb = userRepository.createRawQueryBuilder().from("user");

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text: "SELECT * FROM user",
            args: [],
        });
    });

    it("compila select, from com alias, where e parâmetros na ordem certa", () => {
        const qb = userRepository
            .createRawQueryBuilder()
            .select("id", "name")
            .from("user", "u")
            .where(VSSql.sql`u.active = ${true}`)
            .andWhere(VSSql.sql`u.age > ${18}`);

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text: "SELECT id, name FROM user AS u WHERE (u.active = $1) AND (u.age > $2)",
            args: [true, 18],
        });
    });

    it("combina orWhere com OR, mantendo o AND anterior entre parênteses", () => {
        const qb = userRepository
            .createRawQueryBuilder()
            .select("id")
            .from("user")
            .where(VSSql.sql`active = ${true}`)
            .orWhere(VSSql.sql`is_admin = ${true}`);

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text: "SELECT id FROM user WHERE (active = $1) OR (is_admin = $2)",
            args: [true, true],
        });
    });

    it("compila joins com alias e condição", () => {
        const qb = userRepository
            .createRawQueryBuilder()
            .select("o.id", "u.name")
            .from("order", "o")
            .innerJoin("user", "u", VSSql.sql`u.id = o.user_id`)
            .leftJoin("address", "a", VSSql.sql`a.user_id = u.id`);

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text:
                "SELECT o.id, u.name FROM order AS o " +
                "INNER JOIN user AS u ON u.id = o.user_id " +
                "LEFT JOIN address AS a ON a.user_id = u.id",
            args: [],
        });
    });

    it("compila groupBy, having, orderBy, limit e offset", () => {
        const qb = userRepository
            .createRawQueryBuilder()
            .select("user_id", VSSql.sql`count(*) AS total`)
            .from("order")
            .groupBy("user_id")
            .having(VSSql.sql`count(*) > ${1}`)
            .orderBy("total", "desc")
            .orderBy("user_id")
            .limit(20)
            .offset(40);

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text:
                "SELECT user_id, count(*) AS total FROM order " +
                "GROUP BY user_id HAVING (count(*) > $1) " +
                "ORDER BY total DESC, user_id LIMIT $2 OFFSET $3",
            args: [1, 20, 40],
        });
    });

    it("aceita um VSRawQueryBuilder como subquery em from(), envolvido em parênteses", () => {
        const recent = userRepository
            .createRawQueryBuilder()
            .select("user_id")
            .from("order")
            .where(VSSql.sql`total > ${100}`);

        const qb = userRepository.createRawQueryBuilder().select("user_id").from(recent, "recent");

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text: "SELECT user_id FROM (SELECT user_id FROM order WHERE (total > $1)) AS recent",
            args: [100],
        });
    });

    it("aceita uma subquery em join()", () => {
        const topBuyers = userRepository.createRawQueryBuilder().select("user_id").from("order").groupBy("user_id");

        const qb = userRepository
            .createRawQueryBuilder()
            .select("u.id")
            .from("user", "u")
            .innerJoin(topBuyers, "tb", VSSql.sql`tb.user_id = u.id`);

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text: "SELECT u.id FROM user AS u INNER JOIN (SELECT user_id FROM order GROUP BY user_id) AS tb ON tb.user_id = u.id",
            args: [],
        });
    });

    it("aceita uma subquery diretamente dentro de um WHERE ... IN (...), via toVSSql()", () => {
        const orderUserIds = userRepository.createRawQueryBuilder().select("user_id").from("order");

        const qb = userRepository
            .createRawQueryBuilder()
            .select("id")
            .from("user")
            .where(VSSql.sql`id IN (${orderUserIds.toVSSql()})`);

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text: "SELECT id FROM user WHERE (id IN (SELECT user_id FROM order))",
            args: [],
        });
    });

    it("aceita string crua (sem parâmetros) em where/andWhere/orWhere/having/on", () => {
        const qb = userRepository
            .createRawQueryBuilder()
            .select("o.id")
            .from("order", "o")
            .innerJoin("user", "u", "u.id = o.user_id")
            .where("o.total > 0")
            .andWhere("o.deleted_at is null")
            .orWhere("o.force_included = true")
            .groupBy("o.id")
            .having("count(*) > 1");

        expect(qb.toVSSql().compile(numberedPlaceholder)).toEqual({
            text:
                "SELECT o.id FROM order AS o INNER JOIN user AS u ON u.id = o.user_id " +
                "WHERE (o.total > 0) AND (o.deleted_at is null) OR (o.force_included = true) " +
                "GROUP BY o.id HAVING (count(*) > 1)",
            args: [],
        });
    });

    it("clone() produz um builder independente", () => {
        const base = userRepository
            .createRawQueryBuilder()
            .select("id")
            .from("user")
            .where(VSSql.sql`active = ${true}`);

        const clone = base.clone().andWhere(VSSql.sql`age > ${18}`);

        expect(base.toVSSql().compile(numberedPlaceholder).text).toBe("SELECT id FROM user WHERE (active = $1)");
        expect(clone.toVSSql().compile(numberedPlaceholder).text).toBe(
            "SELECT id FROM user WHERE (active = $1) AND (age > $2)",
        );
    });

    it("lança VSRepoError QUERY_BUILDER se 'from' não foi definido", () => {
        expect(() => userRepository.createRawQueryBuilder().select("id").toVSSql()).toThrow(VSRepoError);
    });

    it("lança VSRepoError QUERY_BUILDER para limit/offset negativos", () => {
        expect(() => userRepository.createRawQueryBuilder().limit(-1)).toThrow(VSRepoError);
        expect(() => userRepository.createRawQueryBuilder().offset(-1)).toThrow(VSRepoError);
    });
});

describe("VSRawQueryBuilder — toSql()", () => {
    it("compila a string SQL usando o getPlaceholder do adapter, sem os valores dos parâmetros", () => {
        const qb = userRepository
            .createRawQueryBuilder()
            .select("id")
            .from("user")
            .where(VSSql.sql`active = ${true}`);

        expect(qb.toSql()).toBe("SELECT id FROM user WHERE (active = $1)");
    });

    it("lança VSRepoError QUERY_BUILDER se o adapter não implementa getPlaceholder", () => {
        fakeAdapter.getPlaceholder = undefined;

        const qb = userRepository.createRawQueryBuilder().select("id").from("user");

        expect(() => qb.toSql()).toThrow(VSRepoError);
    });
});

describe("VSRawQueryBuilder.execute()", () => {
    it("chama adapter.query com o texto compilado, args, db (default: getDbClient()) e modifying: false", async () => {
        fakeAdapter.query.mockResolvedValueOnce([{ id: "1" }]);

        const qb = userRepository
            .createRawQueryBuilder()
            .select("id")
            .from("user")
            .where(VSSql.sql`active = ${true}`);

        const result = await qb.execute<User[]>();

        expect(fakeAdapter.query).toHaveBeenCalledWith("SELECT id FROM user WHERE (active = $1)", {
            args: [true],
            db: dbClient,
            modifying: false,
        });
        expect(result).toEqual([{ id: "1" }]);
    });

    it("createRawQueryBuilder(db) usa o db informado em vez de getDbClient()", async () => {
        const qb = userRepository.createRawQueryBuilder(tx).select("id").from("user");

        await qb.execute();

        expect(fakeAdapter.query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ db: tx }));
    });

    it("setDb() troca o client usado pelas próximas chamadas a execute()", async () => {
        const qb = userRepository.createRawQueryBuilder().select("id").from("user");

        qb.setDb(tx);
        await qb.execute();

        expect(fakeAdapter.query).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ db: tx }));
    });

    it("lança VSRepoError QUERY_BUILDER se o adapter não implementa getPlaceholder", async () => {
        fakeAdapter.getPlaceholder = undefined;

        const qb = userRepository.createRawQueryBuilder().select("id").from("user");

        await expect(qb.execute()).rejects.toThrow(VSRepoError);
        expect(fakeAdapter.query).not.toHaveBeenCalled();
    });
});
