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
    private readonly validator: VSRepoValidator<Entity, PKType>;

    private readonly softRemoveKey?: keyof Entity;
    private readonly defaultOrdering?: Ordering<Entity>;

    /**
     * This is a property managed by the VSRepository, please don't modify it!!
     * @internal
     */
    $vsrepocache: Map<
        string,
        (args: any[], methodOptions?: MethodOptions<Entity, OrmTypes>) => VSRepoArgs<Entity>
    > = new Map();

    constructor(options: VSRepoOptions<Entity, PKType>) {
        this.validator = new VSRepoValidator<Entity, PKType>();

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

    async transaction<R, TX = OrmTypes["dbTransaction"]>(
        fn: (tx: TX) => Promise<R>,
        options?: VSRepoTransactionOptions,
    ): Promise<R> {
        return this.adapter.runInTransaction(fn, options);
    }

    getDbClient<DB = OrmTypes["dbClient"]>(): DB {
        return this.adapter.getDbClient();
    }

    async get(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity | null> {
        const result = await this.adapter.findOne(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        return result;
    }

    async getOrThrow(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        const result = await this.adapter.findOneOrThrow(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        return result;
    }

    async getList(pks: PKType[], options?: MethodOptions<Entity, OrmTypes>): Promise<Entity[]> {
        const result = await this.adapter.findMany(
            this.mergeWheresResolver.resolve(options?.see, this.wherePkIn(pks)),
            options,
        );

        return result;
    }

    async getAll(
        options?: MethodOptions<Entity, OrmTypes> & {
            pagination?: Pagination;
            order?: Ordering<Entity>;
        },
    ): Promise<Entity[]> {
        const result = await this.adapter.findMany(
            this.mergeWheresResolver.resolve(options?.see, {}),
            options,
        );

        return result;
    }

    async save(
        obj: DeepPartial<Entity>,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        const result = await this.adapter.save(obj, options);

        return result;
    }

    async saveList(
        objs: DeepPartial<Entity>[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<Entity[]> {
        const result = await this.adapter.saveMany(objs, options);

        return result;
    }

    async remove(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        const result = await this.adapter.delete(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        return result;
    }

    async removeList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        const result = await this.adapter.deleteMany(
            this.mergeWheresResolver.resolve(options?.see, this.wherePkIn(pks)),
            options,
        );

        return result;
    }

    async patch(
        pk: PKType,
        obj: DeepPartial<Entity>,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        const result = await this.adapter.update(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            obj,
            options,
        );

        return result;
    }

    async merge<U extends DeepPartial<Entity>>(
        pk: PKType,
        obj: U,
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<(U & Entity) | null> {
        const result = await this.adapter.merge<U>(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            obj,
            options,
        );

        return result;
    }

    async total(options?: MethodOptions<Entity, OrmTypes>): Promise<number> {
        const result = await this.adapter.count(
            this.mergeWheresResolver.resolve(options?.see, {}),
            options,
        );

        return result;
    }

    async has(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<boolean> {
        const result = await this.adapter.exists(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        return result;
    }

    async softRemove(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        const result = await this.adapter.update(
            this.mergeWheresResolver.resolve("all", this.wherePk(pk)),
            { [this.softRemoveKey]: new Date() } as DeepPartial<Entity>,
            options,
        );

        return result;
    }

    async softRemoveList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        const result = await this.adapter.updateMany(
            this.mergeWheresResolver.resolve("all", this.wherePkIn(pks)),
            { [this.softRemoveKey]: new Date() } as DeepPartial<Entity>,
            options,
        );

        return result;
    }

    async restore(pk: PKType, options?: MethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        const result = await this.adapter.update(
            this.mergeWheresResolver.resolve("all", this.wherePk(pk)),
            { [this.softRemoveKey]: null } as DeepPartial<Entity>,
            options,
        );

        return result;
    }

    async restoreList(
        pks: PKType[],
        options?: MethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        const result = await this.adapter.updateMany(
            this.mergeWheresResolver.resolve("all", this.wherePkIn(pks)),
            { [this.softRemoveKey]: null } as DeepPartial<Entity>,
            options,
        );

        return result;
    }
}
