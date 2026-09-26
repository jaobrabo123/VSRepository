import { VSRepoError } from "../../errors/VSRepoError";
import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";
import { VSRepoAdapter } from "../../VSRepoAdapter";
import { VSRepoErrorType } from "../enums/vsrepo-error-type.enum";
import { VSLogger } from "./vs-logger.util";
import { VSSql } from "./vs-sql.util";

/** Anything that can be used where a table/column reference is expected: a raw identifier
 * (passed through as-is, like `VSSql.raw`), a `VSSql` fragment (e.g. built with `VSSql.sql`
 * for something parameterized), a nested `VSRawQueryBuilder` (compiled as a subquery) or a subquery function.
 *
 * @publicApi
 */
export type VSRawQueryBuilderTarget =
    string | VSSql | VSRawQueryBuilder | ((subquery: VSRawQueryBuilder) => VSRawQueryBuilder | VSSql);

type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";
type Connector = "AND" | "OR";

interface JoinClause {
    type: JoinType;
    target: VSSql;
    on: VSSql;
}

interface Condition {
    connector: Connector;
    sql: VSSql;
}

/**
 * Fluent, SQL-agnostic builder for hand-written **`SELECT`** queries whose shape is only known
 * at runtime, but whose SQL is too specific (window functions, CTEs referenced elsewhere,
 * vendor-specific syntax, ...) to express through {@link VSQueryBuilder}'s `where`/`relations`
 * model. Compiles down to a single {@link VSSql} fragment — get one from
 * `VSRepository.createRawQueryBuilder()`.
 *
 * Every clause accepts either a raw, trusted string — an identifier for `select`/`from`/`groupBy`/
 * `orderBy` (passed through as-is, just like `VSSql.raw`), a plain condition for `on`/`where`/
 * `having` when it needs no parameters (e.g. `.andWhere("deleted_at is null")`) — or a `VSSql`
 * fragment for anything parameterized or aliased. Values passed through `VSSql.sql` are always
 * parameterized, and clauses compose and nest freely, including subqueries: pass a
 * `VSRawQueryBuilder` to {@link VSRawQueryBuilder.from}/{@link VSRawQueryBuilder.innerJoin} &
 * friends, or splice `.toVSSql()` of one builder into another fragment (e.g. inside a
 * `WHERE ... IN (...)`).
 *
 * Nothing reaches the database until {@link VSRawQueryBuilder.execute} is called. The builder is
 * **mutable**: every chained call changes the same instance and returns it. Use
 * {@link VSRawQueryBuilder.clone} to derive variations from a common base.
 *
 * @template OrmTypes ORM-specific client/transaction types. See `VSRepoOrmTypes`.
 *
 * @example
 * ```typescript
 * import { VSSql } from "vsrepo";
 *
 * const rows = await orderRepository
 *     .createRawQueryBuilder()
 *     .select("o.id", "o.total", "u.name")
 *     .from("order", "o")
 *     .innerJoin("user", "u", VSSql.sql`u.id = o.user_id`)
 *     .where(VSSql.sql`u.active = ${true}`)
 *     .andWhere(VSSql.sql`o.total > ${100}`)
 *     .andWhere("o.deleted_at is null") // simple condition, no parameters needed
 *     .groupBy("o.id", "u.name")
 *     .having(VSSql.sql`count(*) > ${1}`)
 *     .orderBy("o.total", "desc")
 *     .limit(20)
 *     .offset(0)
 *     .execute<{ id: string; total: number; name: string }[]>();
 *
 * // Subquery in `FROM`
 * const recentOrders = orderRepository
 *     .createRawQueryBuilder()
 *     .select("*")
 *     .from("order")
 *     .where(VSSql.sql`created_at > now() - interval '7 days'`);
 *
 * const perUser = await orderRepository
 *     .createRawQueryBuilder()
 *     .select("user_id", VSSql.sql`count(*) AS total`)
 *     .from(recentOrders, "recent")
 *     .groupBy("user_id")
 *     .execute();
 *
 * // Subquery in `WHERE`, spliced in directly as a `VSSql` fragment
 * const usersWithOrders = await userRepository
 *     .createRawQueryBuilder()
 *     .select("*")
 *     .from("user")
 *     .where(VSSql.sql`id IN (${orderRepository.createRawQueryBuilder().select("user_id").from("order").toVSSql()})`)
 *     .execute();
 * ```
 *
 * @publicApi
 */
export class VSRawQueryBuilder<OrmTypes extends VSRepoOrmTypes = VSRepoOrmTypes> {
    private selectColumns: VSSql[] = [];
    private fromTarget?: VSSql;
    private joinClauses: JoinClause[] = [];
    private whereConditions: Condition[] = [];
    private groupByColumns: VSSql[] = [];
    private havingConditions: Condition[] = [];
    private orderByClauses: VSSql[] = [];
    private limitValue?: number;
    private offsetValue?: number;

    /**
     * @internal
     */
    constructor(
        private db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"],
        private readonly adapter: VSRepoAdapter<any>,
        private readonly logger?: VSLogger,
    ) {}

    private trace(message: string, obj?: unknown): void {
        this.logger?.logDebug(`VSRawQueryBuilder: ${message}`, obj);
    }

    private static toFragment(value: string | VSSql): VSSql {
        return typeof value === "string" ? VSSql.raw(value) : value;
    }

    private resolveTarget(target: VSRawQueryBuilderTarget, alias?: string): VSSql {
        const base =
            target instanceof VSRawQueryBuilder
                ? VSSql.sql`(${target.toVSSql()})`
                : typeof target === "function"
                  ? (() => {
                        const subBuilder = new VSRawQueryBuilder(this.db, this.adapter, this.logger);

                        const subqueryResult = target(subBuilder);

                        return subqueryResult instanceof VSRawQueryBuilder
                            ? VSSql.sql`(${subqueryResult.toVSSql()})`
                            : subqueryResult;
                    })()
                  : VSRawQueryBuilder.toFragment(target);

        return alias ? VSSql.sql`${base} AS ${VSSql.raw(alias)}` : base;
    }

    private static combine(conditions: Condition[]): VSSql {
        let result = VSSql.sql`(${conditions[0]!.sql})`;

        for (let i = 1; i < conditions.length; i++) {
            const { connector, sql } = conditions[i]!;
            result = connector === "AND" ? VSSql.sql`${result} AND (${sql})` : VSSql.sql`${result} OR (${sql})`;
        }

        return result;
    }

    private static validateNonNegativeInt(value: number, name: "limit" | "offset"): void {
        if (!Number.isInteger(value) || value < 0) {
            throw new VSRepoError(
                `${name}: Invalid value: Expected >=0 but received ${value}`,
                VSRepoErrorType.QUERY_BUILDER,
            );
        }
    }

    /**
     * Sets the columns to select, replacing any previous `select`. Each column is either a raw,
     * trusted string (an identifier, passed through as-is — like `VSSql.raw`, never pass
     * user-controlled input) or a `VSSql` fragment for anything parameterized or aliased
     * (`VSSql.sql\`count(*) AS total\``).
     *
     * @param columns One or more columns/expressions. `select()` with no arguments is equivalent
     * to `SELECT *`.
     */
    select(...columns: (string | VSSql)[]): this {
        this.selectColumns = columns.length ? columns.map(VSRawQueryBuilder.toFragment) : [VSSql.raw("*")];

        return this;
    }

    /**
     * Sets the `FROM` target, replacing any previous one.
     *
     * @param target A raw table name, a `VSSql` fragment, or another `VSRawQueryBuilder`
     * (compiled inline as a subquery, wrapped in parentheses).
     * @param alias Optional alias, appended as `AS alias` (raw, trusted text).
     */
    from(target: VSRawQueryBuilderTarget, alias?: string): this {
        this.fromTarget = this.resolveTarget(target, alias);

        return this;
    }

    private addJoin(type: JoinType, target: VSRawQueryBuilderTarget, alias: string, on: string | VSSql): this {
        this.joinClauses.push({
            type,
            target: this.resolveTarget(target, alias),
            on: VSRawQueryBuilder.toFragment(on),
        });

        return this;
    }

    /**
     * Adds an `INNER JOIN`. `target` accepts the same values as {@link VSRawQueryBuilder.from}
     * (including a subquery); `on` is a raw, trusted condition string or a `VSSql` fragment.
     */
    innerJoin(target: VSRawQueryBuilderTarget, alias: string, on: string | VSSql): this {
        return this.addJoin("INNER", target, alias, on);
    }

    /**
     * Adds a `LEFT JOIN`. `target` accepts the same values as {@link VSRawQueryBuilder.from}
     * (including a subquery); `on` is a raw, trusted condition string or a `VSSql` fragment.
     */
    leftJoin(target: VSRawQueryBuilderTarget, alias: string, on: string | VSSql): this {
        return this.addJoin("LEFT", target, alias, on);
    }

    /**
     * Adds a `RIGHT JOIN`. `target` accepts the same values as {@link VSRawQueryBuilder.from}
     * (including a subquery); `on` is a raw, trusted condition string or a `VSSql` fragment.
     */
    rightJoin(target: VSRawQueryBuilderTarget, alias: string, on: string | VSSql): this {
        return this.addJoin("RIGHT", target, alias, on);
    }

    /**
     * Adds a `FULL JOIN`. `target` accepts the same values as {@link VSRawQueryBuilder.from}
     * (including a subquery); `on` is a raw, trusted condition string or a `VSSql` fragment.
     */
    fullJoin(target: VSRawQueryBuilderTarget, alias: string, on: string | VSSql): this {
        return this.addJoin("FULL", target, alias, on);
    }

    /**
     * Adds a `WHERE` condition. The first call sets the filter; every later call (`where` or
     * {@link VSRawQueryBuilder.andWhere}) is `AND`-combined with it, each wrapped in parentheses.
     * Use {@link VSRawQueryBuilder.orWhere} to `OR`-combine instead.
     *
     * @param condition A raw, trusted condition string (for something simple enough to need no
     * parameters, e.g. `"deleted_at is null"`) or a `VSSql` fragment — which may itself contain a
     * subquery, e.g. `VSSql.sql\`id IN (${otherBuilder.toVSSql()})\``.
     */
    where(condition: string | VSSql): this {
        this.whereConditions.push({ connector: "AND", sql: VSRawQueryBuilder.toFragment(condition) });

        return this;
    }

    /** Alias for {@link VSRawQueryBuilder.where} — `AND`-combines `condition` with the existing filter. */
    andWhere(condition: string | VSSql): this {
        return this.where(condition);
    }

    /** `OR`-combines `condition` with the existing `WHERE` filter. */
    orWhere(condition: string | VSSql): this {
        this.whereConditions.push({ connector: "OR", sql: VSRawQueryBuilder.toFragment(condition) });

        return this;
    }

    /**
     * Adds columns to `GROUP BY`. Each call appends; call {@link VSRawQueryBuilder.clone} from a
     * common base if you need independent variations.
     *
     * @param columns One or more raw identifiers or `VSSql` fragments.
     */
    groupBy(...columns: (string | VSSql)[]): this {
        this.groupByColumns.push(...columns.map(VSRawQueryBuilder.toFragment));

        return this;
    }

    /**
     * Adds a `HAVING` condition, `AND`-combined with any previous one (same semantics as
     * {@link VSRawQueryBuilder.where}, including accepting a raw, trusted condition string).
     * Use {@link VSRawQueryBuilder.orHaving} to `OR`-combine.
     */
    having(condition: string | VSSql): this {
        this.havingConditions.push({ connector: "AND", sql: VSRawQueryBuilder.toFragment(condition) });

        return this;
    }

    /** `OR`-combines `condition` with the existing `HAVING` filter. */
    orHaving(condition: string | VSSql): this {
        this.havingConditions.push({ connector: "OR", sql: VSRawQueryBuilder.toFragment(condition) });

        return this;
    }

    /**
     * Adds a column to `ORDER BY`. Each call appends, in order, so call it once per column for a
     * multi-column ordering.
     *
     * @param column A raw identifier or a `VSSql` fragment.
     * @param direction `"asc"`/`"desc"` (either case). Omit to let the database's default apply.
     */
    orderBy(column: string | VSSql, direction?: "asc" | "desc" | "ASC" | "DESC"): this {
        const base = VSRawQueryBuilder.toFragment(column);

        this.orderByClauses.push(direction ? VSSql.sql`${base} ${VSSql.raw(direction.toUpperCase())}` : base);

        return this;
    }

    /**
     * Sets the maximum number of rows to return, replacing any previous `limit`.
     *
     * @throws {VSRepoError} `QUERY_BUILDER` if `limit` isn't a non-negative integer.
     */
    limit(limit: number): this {
        VSRawQueryBuilder.validateNonNegativeInt(limit, "limit");
        this.limitValue = limit;

        return this;
    }

    /**
     * Sets how many rows to skip, replacing any previous `offset`.
     *
     * @throws {VSRepoError} `QUERY_BUILDER` if `offset` isn't a non-negative integer.
     */
    offset(offset: number): this {
        VSRawQueryBuilder.validateNonNegativeInt(offset, "offset");
        this.offsetValue = offset;

        return this;
    }

    /**
     * Sets the client or transaction the query runs on, replacing the one given to
     * `createRawQueryBuilder()`.
     *
     * It's lazy — it only matters when {@link VSRawQueryBuilder.execute} runs — so a builder can
     * be created before a transaction and pointed at it from inside, or a
     * {@link VSRawQueryBuilder.clone} can be pointed at another client without touching the
     * original builder.
     *
     * @param db Client or transaction that {@link VSRawQueryBuilder.execute} will use from now on.
     *
     * @example
     * ```typescript
     * const qb = orderRepository.createRawQueryBuilder().select("*").from("order");
     *
     * await orderRepository.transaction(async tx => {
     *     qb.setDb(tx);
     *     return qb.execute();
     * });
     * ```
     */
    setDb(db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"]): void {
        this.db = db;

        this.trace("db replaced");
    }

    /**
     * Returns an independent builder with the same clauses and `db`. Changes made to either one
     * afterwards don't affect the other (the underlying `VSSql`/`VSRawQueryBuilder` values
     * themselves are immutable, so a shallow copy of every clause array is enough).
     */
    clone(): VSRawQueryBuilder<OrmTypes> {
        const copy = new VSRawQueryBuilder<OrmTypes>(this.db, this.adapter, this.logger);

        copy.selectColumns = [...this.selectColumns];
        copy.fromTarget = this.fromTarget;
        copy.joinClauses = [...this.joinClauses];
        copy.whereConditions = [...this.whereConditions];
        copy.groupByColumns = [...this.groupByColumns];
        copy.havingConditions = [...this.havingConditions];
        copy.orderByClauses = [...this.orderByClauses];
        copy.limitValue = this.limitValue;
        copy.offsetValue = this.offsetValue;

        this.trace("clone");

        return copy;
    }

    /**
     * Compiles every configured clause into a single {@link VSSql} fragment, in the order
     * `SELECT` → `FROM` → `JOIN`s → `WHERE` → `GROUP BY` → `HAVING` → `ORDER BY` → `LIMIT` →
     * `OFFSET`. Nothing runs by itself — splice the result into another `VSSql` fragment as a
     * subquery, or pass it to `VSRepository.query()`. See {@link VSRawQueryBuilder.toSql} for the
     * plain SQL string instead, or {@link VSRawQueryBuilder.execute} to run it directly.
     *
     * @throws {VSRepoError} `QUERY_BUILDER` if no `from()` target was set (`select()` alone
     * defaults to `SELECT *`, so it's never the one missing).
     */
    toVSSql(): VSSql {
        if (!this.fromTarget) {
            throw new VSRepoError("'from' is required before calling 'toVSSql'", VSRepoErrorType.QUERY_BUILDER);
        }

        const select = this.selectColumns.length ? VSSql.join(this.selectColumns, ", ") : VSSql.raw("*");

        let query = VSSql.sql`SELECT ${select} FROM ${this.fromTarget}`;

        for (const { type, target, on } of this.joinClauses) {
            query = VSSql.sql`${query} ${VSSql.raw(`${type} JOIN`)} ${target} ON ${on}`;
        }

        if (this.whereConditions.length) {
            query = VSSql.sql`${query} WHERE ${VSRawQueryBuilder.combine(this.whereConditions)}`;
        }

        if (this.groupByColumns.length) {
            query = VSSql.sql`${query} GROUP BY ${VSSql.join(this.groupByColumns, ", ")}`;
        }

        if (this.havingConditions.length) {
            query = VSSql.sql`${query} HAVING ${VSRawQueryBuilder.combine(this.havingConditions)}`;
        }

        if (this.orderByClauses.length) {
            query = VSSql.sql`${query} ORDER BY ${VSSql.join(this.orderByClauses, ", ")}`;
        }

        if (this.limitValue !== undefined) {
            query = VSSql.sql`${query} LIMIT ${this.limitValue}`;
        }

        if (this.offsetValue !== undefined) {
            query = VSSql.sql`${query} OFFSET ${this.offsetValue}`;
        }

        return query;
    }

    private compileForAdapter(): { text: string; args: unknown[] } {
        if (!this.adapter.getPlaceholder) {
            throw new VSRepoError(
                "Your adapter did not implement the 'getPlaceholder' method, required to compile a " +
                    "'VSRawQueryBuilder'; try updating your adapter to a newer version.",
                VSRepoErrorType.QUERY_BUILDER,
            );
        }

        return this.toVSSql().compile(index => this.adapter.getPlaceholder!(index));
    }

    /**
     * Compiles the builder down to a plain SQL string, rendered with the adapter's own
     * placeholder syntax (e.g. `$1`, `$2`, ...). Values themselves are **not** interpolated into
     * the string — use {@link VSRawQueryBuilder.toVSSql} (`.compile()`) or
     * {@link VSRawQueryBuilder.execute} if you also need the parameter values/to run the query.
     *
     * @throws {VSRepoError} `QUERY_BUILDER` if no `from()` target was set, or if the adapter
     * doesn't implement `getPlaceholder()`.
     */
    toSql(): string {
        return this.compileForAdapter().text;
    }

    /**
     * Compiles and runs the query against the underlying database, through the same adapter as
     * every other `VSRepository` method.
     *
     * @template T Shape of the returned rows. Defaults to `any`.
     * @returns Whatever the adapter's `query()` resolves to for this SQL (typically the matching
     * rows).
     * @throws {VSRepoError} `QUERY_BUILDER` if no `from()` target was set, or if the adapter
     * doesn't implement `getPlaceholder()`.
     */
    async execute<T = any>(): Promise<T> {
        const { text, args } = this.compileForAdapter();

        this.trace("execute", { query: text, args });

        const start = this.logger?.startPerformLog("run raw query builder execute");

        try {
            return await this.adapter.query<T>(text, { args, db: this.db, modifying: false });
        } finally {
            this.logger?.endPerformLog(start);
        }
    }
}
