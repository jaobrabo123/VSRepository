import { VSRepoError } from "../../errors/VSRepoError";
import { AdapterMethodOptions } from "../../types/adapter/adapter-method-options.type";
import { KeysOfType } from "../../types/utils/keys-of-type.type";
import { Ordering } from "../../types/utils/ordering.type";
import { Primitive } from "../../types/utils/primitive.type";
import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";
import { VSRepoRelations } from "../../types/vsrepo/vsrepo-relations.type";
import { VSRepoSelect } from "../../types/vsrepo/vsrepo-select.type";
import { VSRepoWhere } from "../../types/vsrepo/vsrepo-where.type";
import { VSRepoAdapter } from "../../VSRepoAdapter";
import { VSRepoErrorType } from "../enums/vsrepo-error-type.enum";
import orderingSchema from "../validators/schemas/ordering.schema";
import relationsSchema from "../validators/schemas/relations.schema";
import selectSchema from "../validators/schemas/select.schema";
import whereSchema from "../validators/schemas/where.schema";
import { VSLogger } from "./vs-logger.util";
import * as v from "valibot";

/**
 * @publicApi
 */
export class VSQueryBuilder<Entity, OrmTypes extends VSRepoOrmTypes = VSRepoOrmTypes> {
    private options: Omit<AdapterMethodOptions<Entity>, "db"> = {};
    private whereFilter?: VSRepoWhere<Entity>;
    private distinct?: KeysOfType<Entity, Primitive>[];

    constructor(
        private db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"],
        private readonly adapter: VSRepoAdapter<Entity>,
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

    /**
     * @internal
     */
    setOptions(options: Omit<AdapterMethodOptions<Entity>, "db">): void {
        this.options = options;
    }

    /**
     * @internal
     */
    setWhereFilter(whereFilter?: VSRepoWhere<Entity>): void {
        this.whereFilter = whereFilter;
    }

    /**
     * @internal
     */
    setDistinct(distinct?: KeysOfType<Entity, Primitive>[]): void {
        this.distinct = distinct;
    }

    setDb(db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"]): void {
        this.db = db;
    }

    async getResult(): Promise<Entity[]> {
        const result = await this.adapter.findMany(this.whereFilter ?? {}, {
            ...this.options,
            distinct: this.distinct,
            db: this.db,
        });

        return result;
    }

    async getOneResult(): Promise<Entity | null> {
        const result = await this.adapter.findOne(this.whereFilter ?? {}, {
            ...this.options,
            db: this.db,
        });

        return result;
    }

    async getCount(): Promise<number> {
        const result = await this.adapter.count(this.whereFilter ?? {}, {
            order: this.options.order,
            pagination: this.options.pagination,
            db: this.db,
        });

        return result;
    }

    async getExistence(): Promise<boolean> {
        const result = await this.adapter.exists(this.whereFilter ?? {}, {
            db: this.db,
        });

        return result;
    }

    async getResultAndCount(): Promise<{ result: Entity[]; count: number }> {
        const [result, count] = await Promise.all([
            this.adapter.findMany(this.whereFilter ?? {}, {
                ...this.options,
                db: this.db,
            }),
            this.adapter.count(this.whereFilter ?? {}, {
                db: this.db,
            }),
        ]);

        return { result, count };
    }

    clone(): VSQueryBuilder<Entity, OrmTypes> {
        const qbClone = new VSQueryBuilder<Entity, OrmTypes>(this.db, this.adapter, this.logger);

        qbClone.setOptions(structuredClone(this.options));
        qbClone.setWhereFilter(this.whereFilter && structuredClone(this.whereFilter));
        qbClone.setDistinct(this.distinct && structuredClone(this.distinct));

        return qbClone;
    }

    select(select: VSRepoSelect<Entity>): this {
        this.validate(select, selectSchema);

        this.options.select = select;

        return this;
    }

    relations(relations: VSRepoRelations<Entity>): this {
        this.validate(relations, relationsSchema);

        this.options.relations = relations;

        return this;
    }

    where(where: VSRepoWhere<Entity>): this {
        this.validate(where, whereSchema);

        this.whereFilter = where;

        return this;
    }

    orderBy(order: Ordering<Entity>): this {
        this.validate(order, orderingSchema);

        this.options.order = order;

        return this;
    }

    limit(limit?: number): this {
        if (limit === undefined) return this;

        this.validate(limit, v.number());

        this.options.pagination ??= {};
        this.options.pagination.limit = limit;

        return this;
    }

    offset(offset?: number): this {
        if (offset === undefined) return this;

        this.validate(offset, v.number());

        this.options.pagination ??= {};
        this.options.pagination.offset = offset;

        return this;
    }

    distinctOn(fields: KeysOfType<Entity, Primitive> | KeysOfType<Entity, Primitive>[]): this {
        this.validate(fields, v.union([v.string(), v.array(v.string())]));

        this.distinct = Array.isArray(fields) ? fields : [fields];

        return this;
    }
}
