import "reflect-metadata";
import { VSRepoOptions } from "./types/vsrepo/vsrepo-options.type";
import { CountResult } from "./types/utils/count-result.type";
import { DeepPartial } from "./types/utils/deep-partial.type";
import { KeysOfType } from "./types/utils/keys-of-type.type";
import { VSRepoAdapter } from "./VSRepoAdapter";
import { VSRepoWhere } from "./types/vsrepo/vsrepo-where.type";
import { MergeWheresResolver } from "./internal/resolvers/merge-wheres.resolver";
import { VSRepoOrmTypes } from "./types/vsrepo/vsrepo-orm-types.type";
import { VSRepoTransactionOptions } from "./types/vsrepo/vsrepo-transaction-options.type";
import { MethodOptions } from "./types/utils/methods-options.type";
import { Ordering } from "./types/utils/ordering.type";
import { Pagination } from "./types/utils/pagination.type";
import { VSLogger } from "./internal/utils/vs-logger.util";
import { VSLogLevel } from "./internal/enums/vs-log-level.enum";
import { VSRepoValidator } from "./internal/validators/vsrepo.validator";
import { VSRepoArgs } from "./types/vsrepo/vsrepo-args.type";
import { DynamicMethodsResolver } from "./internal/resolvers/dynamic-methods.resolver";
import { VSRepoError } from "./errors/VSRepoError";
import { VSRepoErrorType } from "./internal/enums/vsrepo-errortype.enum";
import { VSRepoQueryOptions } from "./types/vsrepo/vsrepo-query-options.type";

/**
 * ORM-agnostic base repository, exposing a complete set of ready-to-use CRUD
 * and soft-delete methods around an entity, plus any `@DynamicMethod`/`@QueryMethod`
 * decorated methods declared on the subclass.
 *
 * Unlike the previous (v1) `VSRepository`, this class delegates every
 * operation to a `VSRepoAdapter` instead of talking to Prisma directly, which
 * is what allows it to work with any ORM/database that has an adapter
 * implementation (e.g. Prisma, TypeORM).
 *
 * @template Entity Type of the entity managed by the repository.
 * @template PKType Type of the entity's primary key value.
 * @template OrmTypes ORM-specific client/transaction types. See `VSRepoOrmTypes`.
 *
 * @example
 * ```typescript
 * class UserRepository extends VSRepository<User, string> {
 *     constructor() {
 *         super({ pkName: "id", adapter: new VSRepoPrisma7Adapter(prisma, "user") });
 *     }
 *
 *     @DynamicMethod()
 *     declare findByEmail: (email: string) => Promise<User[]>;
 * }
 *
 * const userRepository = new UserRepository();
 * const user = await userRepository.get("123");
 * ```
 *
 * @publicApi
 */
export abstract class VSRepository<
    Entity,
    PKType,
    OrmTypes extends VSRepoOrmTypes = VSRepoOrmTypes,
> {
    public readonly pkName: KeysOfType<Entity, PKType>;

    private readonly adapter: VSRepoAdapter<Entity>;
    private readonly mergeWheresResolver: MergeWheresResolver<Entity>;
    private readonly logger: VSLogger;
    private readonly validator: VSRepoValidator<Entity, PKType, OrmTypes>;

    private readonly softRemoveKey?: keyof Entity;
    private readonly defaultOrdering?: Ordering<Entity>;

    /**
     * This is a property managed by VSRepository, please don't modify it!!
     * @internal
     */
    $vsrepocache: Map<
        string,
        (args: any[], methodOptions?: MethodOptions<Entity, OrmTypes>) => VSRepoArgs<Entity>
    > = new Map();

    /**
     * Creates a configured instance of `VSRepository`, resolving and validating
     * every `@DynamicMethod`/`@QueryMethod` declared on the subclass.
     */
    constructor(options: VSRepoOptions<Entity, PKType>) {
        this.validator = new VSRepoValidator<Entity, PKType, OrmTypes>();

        const optionsValidated = this.validator.validateConstructorOptions(options);

        this.adapter = optionsValidated.adapter;
        this.pkName = optionsValidated.pkName;
        this.softRemoveKey = optionsValidated.softRemoveKey;
        this.defaultOrdering = optionsValidated.defaultOrdering;
        this.mergeWheresResolver = new MergeWheresResolver<Entity>(this.softRemoveKey);
        this.logger = new VSLogger(
            optionsValidated.logLevel ?? VSLogLevel.WARN,
            this.constructor.name + "Logger",
            optionsValidated.logSlowThresholdMs,
        );
        this.validator.setLogger(this.logger);

        this.logger.logInfo(
            `Initializing ${this.constructor.name} (pk: '${String(this.pkName)}'` +
                (this.softRemoveKey ? `, softRemoveKey: '${String(this.softRemoveKey)}'` : "") +
                (this.defaultOrdering
                    ? `, defaultOrdering: ${JSON.stringify(this.defaultOrdering)}`
                    : "") +
                `, adapter: ${this.adapter.constructor.name}` +
                `)`,
        );

        const dynamicMethodsResolver = new DynamicMethodsResolver<Entity, PKType>(
            this.logger,
            this.adapter,
            this.mergeWheresResolver,
            this.validator,
            this.defaultOrdering,
        );

        let dynamicMethodsCount = 0;
        let queryMethodsCount = 0;

        try {
            const start = this.logger.startPerformLog("resolve dynamic methods");
            dynamicMethodsCount = dynamicMethodsResolver.resolve(this);
            this.logger.endPerformLog(start);

            const startQuery = this.logger.startPerformLog("resolve query methods");
            queryMethodsCount = dynamicMethodsResolver.resolveQueries(this);
            this.logger.endPerformLog(startQuery);
        } catch (err) {
            this.logger.logError(`Failed to initialize ${this.constructor.name}`, err);
            throw err;
        }

        this.logger.logInfo(
            `${this.constructor.name} ready (${dynamicMethodsCount} dynamic method(s), ${queryMethodsCount} query method(s) resolved)`,
        );
    }

    // * Loga o erro antes de lançar, pra guard clauses (mau uso da API) não passarem em silêncio
    private fail(message: string, type: VSRepoErrorType): never {
        this.logger.logError(`${this.constructor.name}: ${message}`);
        throw new VSRepoError(message, type);
    }

    private wherePk(pk: PKType): VSRepoWhere<Entity> {
        return { [this.pkName]: pk } as VSRepoWhere<Entity>;
    }

    private wherePkIn(pks: PKType[]): VSRepoWhere<Entity> {
        return { [this.pkName]: { in: pks } } as VSRepoWhere<Entity>;
    }

    private async execBaseMethod<R>(
        fn: (optionsChecked: MethodOptions<Entity, OrmTypes>) => Promise<R>,
        methodName: string,
        optionsUnchecked: unknown,
    ): Promise<R> {
        const optionsChecked =
            methodName === "getAll"
                ? this.validator.validateGetAllMethodOptions(optionsUnchecked)
                : this.validator.validateMethodOptions(optionsUnchecked);

        optionsChecked.db ??= this.getDbClient();

        const start = this.logger.startPerformLog("run " + methodName);

        try {
            const result = await fn(optionsChecked);
            this.logger.endPerformLog(start);

            return result;
        } catch (err) {
            this.logger.endPerformLog(start);
            this.logger.logError(`Failed to run '${methodName}' on ${this.constructor.name}`, err);

            throw err;
        }
    }

    /**
     * Runs `fn` inside a native transaction of the underlying ORM, sharing the
     * transaction client (`tx`) across every repository call made within it.
     */
    async transaction<R, TX = OrmTypes["dbTransaction"]>(
        fn: (tx: TX) => Promise<R>,
        options?: VSRepoTransactionOptions,
    ): Promise<R> {
        if (typeof fn !== "function") {
            this.fail("'fn' must be a valid function", VSRepoErrorType.BASE);
        }

        return this.adapter.runInTransaction(
            fn,
            this.validator.validateTransactionOptions(options),
        );
    }

    /** Returns the underlying ORM client instance used outside of transactions. */
    getDbClient<DB extends any = OrmTypes["dbClient"]>(): DB {
        return this.adapter.getDbClient();
    }

    /**
     * Executes a raw query/statement directly against the underlying database.
     *
     * Use `$1`, `$2`, ... placeholders for values passed via `options.args` —
     * never interpolate values directly into `query`, to avoid SQL injection.
     * Set `options.modifying: true` for `INSERT`/`UPDATE`/`DELETE` statements.
     *
     * @example
     * ```typescript
     * const users = await userRepository.query<User[]>(
     *     'SELECT * FROM "user" WHERE email = $1',
     *     { args: ["joao@email.com"] },
     * );
     *
     * const affected = await userRepository.query<number>(
     *     'UPDATE "user" SET active = true WHERE id = $1',
     *     { args: ["123"], modifying: true },
     * );
     * ```
     */
    async query<T = any>(query: string, options?: VSRepoQueryOptions): Promise<T> {
        if (typeof query !== "string") {
            this.fail("'query' must be a valid string", VSRepoErrorType.BASE);
        }

        const optionsValidated = this.validator.validateQueryOptions(options);
        optionsValidated.db ??= this.getDbClient();

        const start = this.logger.startPerformLog("run query");

        try {
            const result = await this.adapter.query<T>(query, {
                args: optionsValidated.args,
                db: optionsValidated.db,
                modifying: optionsValidated.modifying ?? false,
            });

            this.logger.endPerformLog(start);

            return result;
        } catch (err) {
            this.logger.endPerformLog(start);
            this.logger.logError(`Failed to run 'query' on ${this.constructor.name}`, err);

            throw err;
        }
    }

    /** Fetches a record by its primary key (PK). */
    async get(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity | null> {
        return this.execBaseMethod(
            opt =>
                this.adapter.findOne(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePk(pk)),
                    opt,
                ),
            "get",
            options,
        );
    }

    /** Fetches a record by PK and throws an Error if not found. */
    async getOrThrow(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        return this.execBaseMethod(
            opt =>
                this.adapter.findOneOrThrow(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePk(pk)),
                    opt,
                ),
            "getOrThrow",
            options,
        );
    }

    /** Fetches multiple records by a list of primary keys (PKs). */
    async getList(pks: PKType[], options?: MethodOptions<Entity, OrmTypes>): Promise<Entity[]> {
        if (!Array.isArray(pks)) {
            this.fail("'pks' must be a valid array", VSRepoErrorType.BASE);
        }

        return this.execBaseMethod(
            opt =>
                this.adapter.findMany(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePkIn(pks)),
                    opt,
                ),
            "getList",
            options,
        );
    }

    /** Fetches all records (respects the repository's `defaultOrdering` unless `order` is provided). */
    async getAll(
        options?: MethodOptions<Entity, OrmTypes> & {
            pagination?: Pagination;
            order?: Ordering<Entity>;
        },
    ): Promise<Entity[]> {
        return this.execBaseMethod(
            (opt: MethodOptions<Entity, OrmTypes> & { order?: Ordering<Entity> }) =>
                this.adapter.findMany(this.mergeWheresResolver.resolve(opt.see, {}), {
                    ...opt,
                    order: opt.order ?? this.defaultOrdering,
                }),
            "getAll",
            options,
        );
    }

    /** Creates or updates (upsert) a record. */
    async save(
        obj: DeepPartial<Entity>,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        return this.execBaseMethod(opt => this.adapter.save(obj, opt), "save", options);
    }

    /** Creates or updates (upsert) multiple records in a single operation. */
    async saveList(
        objs: DeepPartial<Entity>[],
        options?: MethodOptions<Entity, OrmTypes> & { db?: OrmTypes["dbTransaction"] },
    ): Promise<Entity[]> {
        if (!Array.isArray(objs)) {
            this.fail("'objs' must be a valid array", VSRepoErrorType.BASE);
        }

        return this.execBaseMethod(opt => this.adapter.saveMany(objs, opt), "saveList", options);
    }

    /** Deletes a record identified by its primary key (PK). */
    async remove(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        return this.execBaseMethod(
            opt =>
                this.adapter.delete(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePk(pk)),
                    opt,
                ),
            "remove",
            options,
        );
    }

    /** Deletes multiple records by their primary keys, returning the count of affected rows. */
    async removeList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!Array.isArray(pks)) {
            this.fail("'pks' must be a valid array", VSRepoErrorType.BASE);
        }

        return this.execBaseMethod(
            opt =>
                this.adapter.deleteMany(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePkIn(pks)),
                    opt,
                ),
            "removeList",
            options,
        );
    }

    /** Partially updates an existing record by its primary key (PK). */
    async patch(
        pk: PKType,
        obj: DeepPartial<Entity>,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        return this.execBaseMethod(
            opt =>
                this.adapter.update(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePk(pk)),
                    obj,
                    opt,
                ),
            "patch",
            options,
        );
    }

    /** Partially updates a record by PK and returns it deep-merged with the provided object. */
    async merge<U extends DeepPartial<Entity>>(
        pk: PKType,
        obj: U,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<(U & Entity) | null> {
        return this.execBaseMethod(
            opt =>
                this.adapter.merge<U>(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePk(pk)),
                    obj,
                    opt,
                ),
            "merge",
            options,
        );
    }

    /** Returns the total number of records. */
    async total(options?: MethodOptions<Entity, OrmTypes>): Promise<number> {
        return this.execBaseMethod(
            opt => this.adapter.count(this.mergeWheresResolver.resolve(opt.see, {}), opt),
            "total",
            options,
        );
    }

    /** Checks whether a record exists by its primary key (PK). */
    async has(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<boolean> {
        return this.execBaseMethod(
            opt =>
                this.adapter.exists(
                    this.mergeWheresResolver.resolve(opt.see, this.wherePk(pk)),
                    opt,
                ),
            "has",
            options,
        );
    }

    /** Marks a record as deleted (soft-delete). Requires `softRemoveKey` to be configured on the repository. */
    async softRemove(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            this.fail(
                "this method can only be used if you have configured 'softRemoveKey' in this repository.",
                VSRepoErrorType.BASE,
            );
        }

        const key = this.softRemoveKey;

        return this.execBaseMethod(
            opt =>
                this.adapter.update(
                    this.mergeWheresResolver.resolve(opt.see ?? "all", this.wherePk(pk)),
                    { [key]: new Date() } as DeepPartial<Entity>,
                    opt,
                ),
            "softRemove",
            options,
        );
    }

    /** Marks multiple records as deleted (soft-delete) in batch. Requires `softRemoveKey` to be configured on the repository. */
    async softRemoveList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            this.fail(
                "this method can only be used if you have configured 'softRemoveKey' in this repository.",
                VSRepoErrorType.BASE,
            );
        }
        if (!Array.isArray(pks)) {
            this.fail("'pks' must be a valid array", VSRepoErrorType.BASE);
        }

        const key = this.softRemoveKey;

        return this.execBaseMethod(
            opt =>
                this.adapter.updateMany(
                    this.mergeWheresResolver.resolve(opt.see ?? "all", this.wherePkIn(pks)),
                    { [key]: new Date() } as DeepPartial<Entity>,
                    opt,
                ),
            "softRemoveList",
            options,
        );
    }

    /** Restores a record previously marked as deleted (soft-delete). Requires `softRemoveKey` to be configured on the repository. */
    async restore(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            this.fail(
                "this method can only be used if you have configured 'softRemoveKey' in this repository.",
                VSRepoErrorType.BASE,
            );
        }

        const key = this.softRemoveKey;

        return this.execBaseMethod(
            opt =>
                this.adapter.update(
                    this.mergeWheresResolver.resolve(opt.see ?? "all", this.wherePk(pk)),
                    { [key]: null } as DeepPartial<Entity>,
                    opt,
                ),
            "restore",
            options,
        );
    }

    /** Restores multiple records previously marked as deleted (soft-delete) in batch. Requires `softRemoveKey` to be configured on the repository. */
    async restoreList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            this.fail(
                "this method can only be used if you have configured 'softRemoveKey' in this repository.",
                VSRepoErrorType.BASE,
            );
        }
        if (!Array.isArray(pks)) {
            this.fail("'pks' must be a valid array", VSRepoErrorType.BASE);
        }

        const key = this.softRemoveKey;

        return this.execBaseMethod(
            opt =>
                this.adapter.updateMany(
                    this.mergeWheresResolver.resolve(opt.see ?? "all", this.wherePkIn(pks)),
                    { [key]: null } as DeepPartial<Entity>,
                    opt,
                ),
            "restoreList",
            options,
        );
    }
}
