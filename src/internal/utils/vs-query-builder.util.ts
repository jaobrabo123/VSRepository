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
import whereSchema from "../validators/schemas/where.schema";
import { VSLogger } from "./vs-logger.util";
import * as v from "valibot";

export class VSQueryBuilder<Entity, OrmTypes extends VSRepoOrmTypes = VSRepoOrmTypes> {
    private options: Omit<AdapterMethodOptions<Entity>, "db"> = {};
    private whereFilter?: VSRepoWhere<Entity>;
    private distinct?: KeysOfType<Entity, Primitive>[];
    private seeMode: SeeMode = "active";

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
        return this.mergeWheresResolver.resolve(this.seeMode, this.whereFilter ?? {});
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

    /**
     * @internal
     */
    setSeeMode(seeMode: SeeMode): void {
        this.seeMode = seeMode;
    }

    setDb(db: OrmTypes["dbClient"] | OrmTypes["dbTransaction"]): void {
        this.db = db;
    }

    async getResult(): Promise<Entity[]> {
        const result = await this.adapter.findMany(this.resolveWhere(), {
            ...this.options,
            distinct: this.distinct,
            db: this.db,
        });

        return result;
    }

    async getOneResult(): Promise<Entity | null> {
        const result = await this.adapter.findOne(this.resolveWhere(), {
            ...this.options,
            db: this.db,
        });

        return result;
    }

    async getOneResultOrThrow(): Promise<Entity> {
        const result = await this.adapter.findOneOrThrow(this.resolveWhere(), {
            ...this.options,
            db: this.db,
        });

        return result;
    }

    async getCount(): Promise<number> {
        const result = await this.adapter.count(this.resolveWhere(), {
            order: this.options.order,
            pagination: this.options.pagination,
            db: this.db,
        });

        return result;
    }

    async getExistence(): Promise<boolean> {
        const result = await this.adapter.exists(this.resolveWhere(), {
            db: this.db,
        });

        return result;
    }

    async getResultAndCount(): Promise<{ result: Entity[]; count: number }> {
        const whereResolved = this.resolveWhere();

        const [result, count] = await Promise.all([
            this.adapter.findMany(whereResolved, {
                ...this.options,
                db: this.db,
            }),
            this.adapter.count(whereResolved, {
                db: this.db,
            }),
        ]);

        return { result, count };
    }

    clone(): VSQueryBuilder<Entity, OrmTypes> {
        const qbClone = new VSQueryBuilder<Entity, OrmTypes>(
            this.db,
            this.adapter,
            this.mergeWheresResolver,
            this.logger,
        );

        qbClone.setOptions(structuredClone(this.options));
        qbClone.setWhereFilter(this.whereFilter && structuredClone(this.whereFilter));
        qbClone.setDistinct(this.distinct && structuredClone(this.distinct));
        qbClone.setSeeMode(this.seeMode);

        return qbClone;
    }

    select(select: VSRepoSelect<Entity>): this {
        this.validate(select, selectSchema, "select");

        this.options.select = select;

        return this;
    }

    relations(relations: VSRepoRelations<Entity>): this {
        this.validate(relations, relationsSchema, "relations");

        this.options.relations = relations;

        return this;
    }

    where(where: VSRepoWhere<Entity>): this {
        this.validate(where, whereSchema, "where");

        this.whereFilter = where;

        return this;
    }

    andWhere(where: VSRepoWherePlain<Entity>): this {
        this.validate(where, v.looseObject({}), "where");

        this.whereFilter ??= {};
        this.whereFilter.AND = this.whereFilter.AND
            ? Array.isArray(this.whereFilter.AND)
                ? this.whereFilter.AND
                : [this.whereFilter.AND]
            : [];

        this.whereFilter.AND.push(where);

        return this;
    }

    orWhere(where: VSRepoWherePlain<Entity>): this {
        this.validate(where, v.looseObject({}), "where");

        this.whereFilter ??= {};
        this.whereFilter.OR = this.whereFilter.OR
            ? Array.isArray(this.whereFilter.OR)
                ? this.whereFilter.OR
                : [this.whereFilter.OR]
            : [];

        this.whereFilter.OR.push(where);

        return this;
    }

    orderBy(order: Ordering<Entity>): this {
        this.validate(order, orderingSchema, "order");

        this.options.order = order;

        return this;
    }

    limit(limit: number): this {
        this.validate(limit, v.pipe(v.number(), v.integer(), v.minValue(0)), "limit");

        this.options.pagination ??= {};
        this.options.pagination.limit = limit;

        return this;
    }

    offset(offset: number): this {
        this.validate(offset, v.pipe(v.number(), v.integer(), v.minValue(0)), "offset");

        this.options.pagination ??= {};
        this.options.pagination.offset = offset;

        return this;
    }

    distinctOn(fields: KeysOfType<Entity, Primitive> | KeysOfType<Entity, Primitive>[]): this {
        this.validate(fields, v.union([v.string(), v.array(v.string())]), "fields");

        this.distinct = Array.isArray(fields) ? fields : [fields];

        return this;
    }

    see(seeMode: SeeMode): this {
        this.validate(seeMode, seeModeSchema, "seeMode");

        this.seeMode = seeMode;

        return this;
    }
}
