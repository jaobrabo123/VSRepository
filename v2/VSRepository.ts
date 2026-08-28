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

/**
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
        );

        const dynamicMethodsResolver = new DynamicMethodsResolver<Entity, PKType>(
            this.logger,
            this.adapter,
            this.mergeWheresResolver,
            this.validator,
            this.defaultOrdering,
        );

        const start = this.logger.startPerformLog("resolve dynamic methods");
        dynamicMethodsResolver.resolve(this);
        this.logger.endPerformLog(start);

        const startQuery = this.logger.startPerformLog("resolve query methods");
        dynamicMethodsResolver.resolveQueries(this);
        this.logger.endPerformLog(startQuery);
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
        const result = await fn(optionsChecked);
        this.logger.endPerformLog(start);

        return result;
    }

    async transaction<R, TX = OrmTypes["dbTransaction"]>(
        fn: (tx: TX) => Promise<R>,
        options?: VSRepoTransactionOptions,
    ): Promise<R> {
        if (typeof fn !== "function") {
            throw new VSRepoError("'fn' must be a valid function", VSRepoErrorType.BASE);
        }

        return this.adapter.runInTransaction(
            fn,
            this.validator.validateTransactionOptions(options),
        );
    }

    getDbClient<DB extends any = OrmTypes["dbClient"]>(): DB {
        return this.adapter.getDbClient();
    }

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

    async getList(pks: PKType[], options?: MethodOptions<Entity, OrmTypes>): Promise<Entity[]> {
        if (!Array.isArray(pks)) {
            throw new VSRepoError("'pks' must be a valid array", VSRepoErrorType.BASE);
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

    async getAll(
        options?: MethodOptions<Entity, OrmTypes> & {
            pagination?: Pagination;
            order?: Ordering<Entity>;
        },
    ): Promise<Entity[]> {
        return this.execBaseMethod(
            opt => this.adapter.findMany(this.mergeWheresResolver.resolve(opt.see, {}), opt),
            "getAll",
            options,
        );
    }

    async save(
        obj: DeepPartial<Entity>,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        return this.execBaseMethod(opt => this.adapter.save(obj, opt), "save", options);
    }

    async saveList(
        objs: DeepPartial<Entity>[],
        options?: MethodOptions<Entity, OrmTypes> & { db?: OrmTypes["dbTransaction"] },
    ): Promise<Entity[]> {
        if (!Array.isArray(objs)) {
            throw new VSRepoError("'objs' must be a valid array", VSRepoErrorType.BASE);
        }

        return this.execBaseMethod(opt => this.adapter.saveMany(objs, opt), "saveList", options);
    }

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

    async removeList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!Array.isArray(pks)) {
            throw new VSRepoError("'pks' must be a valid array", VSRepoErrorType.BASE);
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

    async total(options?: MethodOptions<Entity, OrmTypes>): Promise<number> {
        return this.execBaseMethod(
            opt => this.adapter.count(this.mergeWheresResolver.resolve(opt.see, {}), opt),
            "total",
            options,
        );
    }

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

    async softRemove(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            throw new VSRepoError(
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

    async softRemoveList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            throw new VSRepoError(
                "this method can only be used if you have configured 'softRemoveKey' in this repository.",
                VSRepoErrorType.BASE,
            );
        }
        if (!Array.isArray(pks)) {
            throw new VSRepoError("'pks' must be a valid array", VSRepoErrorType.BASE);
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

    async restore(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            throw new VSRepoError(
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

    async restoreList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            throw new VSRepoError(
                "this method can only be used if you have configured 'softRemoveKey' in this repository.",
                VSRepoErrorType.BASE,
            );
        }
        if (!Array.isArray(pks)) {
            throw new VSRepoError("'pks' must be a valid array", VSRepoErrorType.BASE);
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
