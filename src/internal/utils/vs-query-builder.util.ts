import { VSRepoError } from "../../errors/VSRepoError";
import { AdapterMethodOptions } from "../../types/adapter/adapter-method-options.type";
import { KeysOfType } from "../../types/utils/keys-of-type.type";
import { Ordering } from "../../types/utils/ordering.type";
import { Primitive } from "../../types/utils/primitive.type";
import { SeeMode } from "../../types/utils/see-mode.type";
import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";
import { VSRepoRelations } from "../../types/vsrepo/vsrepo-relations.type";
import { VSRepoSelect } from "../../types/vsrepo/vsrepo-select.type";
import { VSRepoWhere, VSRepoWherePlain } from "../../types/vsrepo/vsrepo-where.type";
import { VSRepoAdapter } from "../../VSRepoAdapter";
import { VSRepoErrorType } from "../enums/vsrepo-error-type.enum";
import { MergeWheresResolver } from "../resolvers/merge-wheres.resolver";
import orderingSchema from "../validators/schemas/ordering.schema";
import relationsSchema from "../validators/schemas/relations.schema";
import seeModeSchema from "../validators/schemas/see-mode.schema";
import selectSchema from "../validators/schemas/select.schema";
import { VSLogger } from "./vs-logger.util";
import * as v from "valibot";
import merge from "deepmerge";

/**
 * @publicApi
 */
export class VSQueryBuilder<Entity, OrmTypes extends VSRepoOrmTypes = VSRepoOrmTypes> {
    private options: Omit<AdapterMethodOptions<Entity>, "db"> = {};
    private distinct?: KeysOfType<Entity, Primitive>[];
    private seeMode: SeeMode = "active";
    private wherePlain?: VSRepoWherePlain<Entity>;
    private orWhereArray?: VSRepoWherePlain<Entity>[];

    constructor(
        private db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"],
        private readonly adapter: VSRepoAdapter<Entity>,
        private readonly mergeWheresResolver: MergeWheresResolver<Entity>,
        private readonly logger?: VSLogger,
    ) {}

    private failValidation(issue: v.GenericIssue | undefined, fallbackPath = "options"): never {
        const path = issue?.path?.length ? issue.path.map(p => String(p.key)).join(".") : fallbackPath;
        const message = `${path}: ${issue?.message ?? "validation failed"}`;

        this.logger?.logError(`Validation failed (${VSRepoErrorType.QUERY_BUILDER}): ${message}`);

        throw new VSRepoError(message, VSRepoErrorType.QUERY_BUILDER);
    }

    private validate(value: unknown, schema: v.GenericSchema, fallbackPath?: string): void {
        const parsed = v.safeParse(schema, value);

        if (!parsed.success) {
            this.failValidation(parsed.issues[0], fallbackPath);
        }
    }

    private resolveWhere(): VSRepoWhere<Entity> {
        const where = (
            this.orWhereArray
                ? {
                      OR: this.wherePlain ? [this.wherePlain, ...this.orWhereArray] : this.orWhereArray,
                  }
                : (this.wherePlain ?? {})
        ) as VSRepoWhere<Entity>;

        return this.mergeWheresResolver.resolve(this.seeMode, where);
    }

    // * Log de debug dos passos do builder e das queries. O objeto só é serializado se o nível for DEBUG
    private trace(message: string, obj?: unknown): void {
        this.logger?.logDebug(`VSQueryBuilder: ${message}`, obj);
    }

    // * Nunca logar o `db` aqui (client/transação do ORM), só os parâmetros da query
    private async execute<R>(operation: string, params: Record<string, unknown>, run: () => Promise<R>): Promise<R> {
        this.trace(operation, { see: this.seeMode, ...params });

        const start = this.logger?.startPerformLog(`run query builder ${operation}`);

        try {
            return await run();
        } finally {
            this.logger?.endPerformLog(start);
        }
    }

    /**
     * @internal
     */
    setOptions(options: Omit<AdapterMethodOptions<Entity>, "db">): void {
        this.options = options;
    }

    /**
     * @internal
     */
    setWherePlain(wherePlain?: VSRepoWherePlain<Entity>): void {
        this.wherePlain = wherePlain;
    }

    /**
     * @internal
     */
    setOrWhereArray(orWhereArray?: VSRepoWherePlain<Entity>[]): void {
        this.orWhereArray = orWhereArray;
    }

    /**
     * @internal
     */
    setDistinct(distinct?: KeysOfType<Entity, Primitive>[]): void {
        this.distinct = distinct;
    }

    /**
     * @internal
     */
    setSeeMode(seeMode: SeeMode): void {
        this.seeMode = seeMode;
    }

    setDb(db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"]): void {
        this.db = db;

        this.trace("db replaced");
    }

    async getResult(): Promise<Entity[]> {
        const where = this.resolveWhere();
        const options = { ...this.options, distinct: this.distinct };

        return this.execute("getResult", { where, options }, () =>
            this.adapter.findMany(where, { ...options, db: this.db }),
        );
    }

    async getOneResult(): Promise<Entity | null> {
        const where = this.resolveWhere();
        const options = { ...this.options };

        return this.execute("getOneResult", { where, options }, () =>
            this.adapter.findOne(where, { ...options, db: this.db }),
        );
    }

    async getOneResultOrThrow(): Promise<Entity> {
        const where = this.resolveWhere();
        const options = { ...this.options };

        return this.execute("getOneResultOrThrow", { where, options }, () =>
            this.adapter.findOneOrThrow(where, { ...options, db: this.db }),
        );
    }

    async getCount(): Promise<number> {
        const where = this.resolveWhere();
        const options = { order: this.options.order, pagination: this.options.pagination };

        return this.execute("getCount", { where, options }, () =>
            this.adapter.count(where, { ...options, db: this.db }),
        );
    }

    async getExistence(): Promise<boolean> {
        const where = this.resolveWhere();

        return this.execute("getExistence", { where }, () => this.adapter.exists(where, { db: this.db }));
    }

    async getResultAndCount(): Promise<{ result: Entity[]; count: number }> {
        const where = this.resolveWhere();
        const options = { ...this.options };

        return this.execute("getResultAndCount", { where, options }, async () => {
            const [result, count] = await Promise.all([
                this.adapter.findMany(where, { ...options, db: this.db }),
                this.adapter.count(where, { db: this.db }),
            ]);

            return { result, count };
        });
    }

    clone(): VSQueryBuilder<Entity, OrmTypes> {
        const qbClone = new VSQueryBuilder<Entity, OrmTypes>(
            this.db,
            this.adapter,
            this.mergeWheresResolver,
            this.logger,
        );

        qbClone.setOptions(structuredClone(this.options));
        qbClone.setWherePlain(this.wherePlain);
        qbClone.setOrWhereArray(this.orWhereArray && [...this.orWhereArray]);
        qbClone.setDistinct(this.distinct);
        qbClone.setSeeMode(this.seeMode);

        this.trace("clone");

        return qbClone;
    }

    select(select: VSRepoSelect<Entity>): this {
        this.validate(select, selectSchema, "select");

        this.options.select = select;

        this.trace("select", select);

        return this;
    }

    relations(relations: VSRepoRelations<Entity>): this {
        this.validate(relations, relationsSchema, "relations");

        this.options.relations = relations;

        this.trace("relations", relations);

        return this;
    }

    where(where: VSRepoWherePlain<Entity>): this {
        this.validate(where, v.looseObject({}), "where");

        this.wherePlain = where;

        this.trace("where", where);

        return this;
    }

    andWhere(where: VSRepoWherePlain<Entity>): this {
        this.validate(where, v.looseObject({}), "where");

        this.wherePlain = this.wherePlain
            ? merge<VSRepoWherePlain<Entity>>(this.wherePlain, where, { arrayMerge: (_t, s) => s })
            : where;

        this.trace("andWhere", where);

        return this;
    }

    orWhere(where: VSRepoWherePlain<Entity>): this {
        this.validate(where, v.looseObject({}), "where");

        this.orWhereArray ??= [];
        this.orWhereArray.push(where);

        this.trace("orWhere", where);

        return this;
    }

    orderBy(order: Ordering<Entity>): this {
        this.validate(order, orderingSchema, "order");

        this.options.order = order;

        this.trace("orderBy", order);

        return this;
    }

    limit(limit: number): this {
        this.validate(limit, v.pipe(v.number(), v.integer(), v.minValue(0)), "limit");

        this.options.pagination ??= {};
        this.options.pagination.limit = limit;

        this.trace(`limit ${limit}`);

        return this;
    }

    offset(offset: number): this {
        this.validate(offset, v.pipe(v.number(), v.integer(), v.minValue(0)), "offset");

        this.options.pagination ??= {};
        this.options.pagination.offset = offset;

        this.trace(`offset ${offset}`);

        return this;
    }

    distinctOn(fields: KeysOfType<Entity, Primitive> | KeysOfType<Entity, Primitive>[]): this {
        this.validate(fields, v.union([v.string(), v.array(v.string())]), "fields");

        this.distinct = Array.isArray(fields) ? fields : [fields];

        this.trace("distinctOn", this.distinct);

        return this;
    }

    see(seeMode: SeeMode): this {
        this.validate(seeMode, seeModeSchema, "seeMode");

        this.seeMode = seeMode;

        this.trace(`see '${seeMode}'`);

        return this;
    }
}
