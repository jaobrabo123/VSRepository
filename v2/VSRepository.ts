import { VSRepoOptions } from "./types/vsrepo/vsrepo-options.type";
import { CountResult } from "./types/utils/count-result.type";
import { DeepPartial } from "./types/utils/deep-partial.type";
import { KeysOfType } from "./types/utils/keys-of-type.type";
import { VSRepoAdapter } from "./VSRepoAdapter";
import { VSRepoHooks } from "./types/vsrepo/vsrepo-hooks.type";
import { VSRepoMethodsNames } from "./types/vsrepo/vsrepo-methods-names.type";
import { VSRepoWhere } from "./types/vsrepo/vsrepo-where.type";
import { MergeWheresResolver } from "./internal/resolvers/merge-wheres.resolver";
import { VSRepoOrmTypes } from "./types/vsrepo/vsrepo-orm-types.type";
import { VSRepoTransactionOptions } from "./types/vsrepo/vsrepo-transaction-options.type";
import { VSRepoMethodOptions } from "./types/vsrepo/vsrepo-methods-options.type";
import { Ordering } from "./types/utils/ordering.type";
import { Pagination } from "./types/utils/pagination.type";
import { VSLogger } from "./internal/utils/vs-logger.util";
import { VSLogLevel } from "./internal/enums/vs-log-level.enum";
import { VSRepoValidator } from "./internal/validators/vsrepo.validator";
import { VSRepoArgs } from "./types/vsrepo/vsrepo-args.type";
import { DynamicMethodsResolver } from "./internal/resolvers/dynamic-methods.resolver";

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

    private readonly hooks?: VSRepoHooks<Entity, PKType>;
    private readonly softRemoveKey?: keyof Entity;

    private readonly defaultOrdering?: Ordering<Entity>;

    /** This is a property managed by the VSRepository, please don't modify it. */
    $vsrepocache: Map<
        string,
        (args: any[], methodOptions?: VSRepoMethodOptions<Entity, OrmTypes>) => VSRepoArgs<Entity>
    > = new Map();

    constructor(options: VSRepoOptions<Entity, PKType>) {
        this.validator = new VSRepoValidator<Entity, PKType>();

        const optionsValidated = this.validator.validateConstructorOptions(options);

        this.adapter = optionsValidated.adapter;
        this.hooks = optionsValidated.hooks;
        this.pkName = optionsValidated.pkName;
        this.softRemoveKey = optionsValidated.softRemoveKey;
        this.defaultOrdering = optionsValidated.defaultOrdering;
        this.mergeWheresResolver = new MergeWheresResolver<Entity>(this.softRemoveKey);
        this.logger = new VSLogger(
            optionsValidated.logLevel ?? VSLogLevel.WARN,
            this.constructor.name + "Logger",
        );

        const start = this.logger.startPerformLog("resolve dynamic methods");

        const dynamicMethodsResolver = new DynamicMethodsResolver<Entity, PKType>(
            this.logger,
            this.adapter,
            this.mergeWheresResolver,
            this.validator,
            this.defaultOrdering,
        );
        dynamicMethodsResolver.resolve(this);

        this.logger.endPerformLog(start);
    }

    private async execBeforeHook<B extends VSRepoMethodsNames>(
        method: B,
        ...args: Parameters<NonNullable<NonNullable<VSRepoHooks<Entity, PKType>[B]>["before"]>>
    ): Promise<void> {
        const hook = this.hooks?.[method]?.before as any;
        if (hook) {
            await hook(...args);
        }
    }

    private async execAfterHook<B extends VSRepoMethodsNames>(
        method: B,
        ...args: Parameters<NonNullable<NonNullable<VSRepoHooks<Entity, PKType>[B]>["after"]>>
    ): Promise<void> {
        const hook = this.hooks?.[method]?.after as any;
        if (hook) {
            await hook(...args);
        }
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

    async get(pk: PKType, options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<Entity | null> {
        await this.execBeforeHook("get", pk, options);

        const result = await this.adapter.findOne(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        await this.execAfterHook("get", result, pk, options);

        return result;
    }

    async getOrThrow(pk: PKType, options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<Entity> {
        await this.execBeforeHook("getOrThrow", pk, options);

        const result = await this.adapter.findOneOrThrow(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        await this.execAfterHook("getOrThrow", result, pk, options);

        return result;
    }

    async getList(
        pks: PKType[],
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<Entity[]> {
        await this.execBeforeHook("getList", pks, options);

        const result = await this.adapter.findMany(
            this.mergeWheresResolver.resolve(options?.see, this.wherePkIn(pks)),
            options,
        );

        await this.execAfterHook("getList", result, pks, options);

        return result;
    }

    async getAll(
        options?: VSRepoMethodOptions<Entity, OrmTypes> & {
            pagination?: Pagination;
            order?: Ordering<Entity>;
        },
    ): Promise<Entity[]> {
        await this.execBeforeHook("getAll", options);

        const result = await this.adapter.findMany(
            this.mergeWheresResolver.resolve(options?.see, {}),
            options,
        );

        await this.execAfterHook("getAll", result, options);

        return result;
    }

    async save(
        obj: DeepPartial<Entity>,
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        await this.execBeforeHook("save", obj, options);

        const result = await this.adapter.save(obj, options);

        await this.execAfterHook("save", result, obj, options);

        return result;
    }

    async saveList(
        objs: DeepPartial<Entity>[],
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<Entity[]> {
        await this.execBeforeHook("saveList", objs, options);

        const result = await this.adapter.saveMany(objs, options);

        await this.execAfterHook("saveList", result, objs, options);

        return result;
    }

    async remove(pk: PKType, options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<Entity> {
        await this.execBeforeHook("remove", pk, options);

        const result = await this.adapter.delete(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        await this.execAfterHook("remove", result, pk, options);

        return result;
    }

    async removeList(
        pks: PKType[],
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        await this.execBeforeHook("removeList", pks, options);

        const result = await this.adapter.deleteMany(
            this.mergeWheresResolver.resolve(options?.see, this.wherePkIn(pks)),
            options,
        );

        await this.execAfterHook("removeList", result, pks, options);

        return result;
    }

    async patch(
        pk: PKType,
        obj: DeepPartial<Entity>,
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<Entity> {
        await this.execBeforeHook("patch", pk, obj, options);

        const result = await this.adapter.update(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            obj,
            options,
        );

        await this.execAfterHook("patch", result, pk, obj, options);

        return result;
    }

    async merge<U extends DeepPartial<Entity>>(
        pk: PKType,
        obj: U,
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<(U & Entity) | null> {
        await this.execBeforeHook("merge", pk, obj, options);

        const result = await this.adapter.merge<U>(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            obj,
            options,
        );

        await this.execAfterHook("merge", result, pk, obj, options);

        return result;
    }

    async total(options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<number> {
        await this.execBeforeHook("total", options);

        const result = await this.adapter.count(
            this.mergeWheresResolver.resolve(options?.see, {}),
            options,
        );

        await this.execAfterHook("total", result, options);

        return result;
    }

    async has(pk: PKType, options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<boolean> {
        await this.execBeforeHook("has", pk, options);

        const result = await this.adapter.exists(
            this.mergeWheresResolver.resolve(options?.see, this.wherePk(pk)),
            options,
        );

        await this.execAfterHook("has", result, pk, options);

        return result;
    }

    async softRemove(pk: PKType, options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        await this.execBeforeHook("softRemove", pk, options);

        const result = await this.adapter.update(
            this.mergeWheresResolver.resolve("all", this.wherePk(pk)),
            { [this.softRemoveKey]: new Date() } as DeepPartial<Entity>,
            options,
        );

        await this.execAfterHook("softRemove", result, pk, options);

        return result;
    }

    async softRemoveList(
        pks: PKType[],
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        await this.execBeforeHook("softRemoveList", pks, options);

        const result = await this.adapter.updateMany(
            this.mergeWheresResolver.resolve("all", this.wherePkIn(pks)),
            { [this.softRemoveKey]: new Date() } as DeepPartial<Entity>,
            options,
        );

        await this.execAfterHook("softRemoveList", result, pks, options);

        return result;
    }

    async restore(pk: PKType, options?: VSRepoMethodOptions<Entity, OrmTypes>): Promise<Entity> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        await this.execBeforeHook("restore", pk, options);

        const result = await this.adapter.update(
            this.mergeWheresResolver.resolve("all", this.wherePk(pk)),
            { [this.softRemoveKey]: null } as DeepPartial<Entity>,
            options,
        );

        await this.execAfterHook("restore", result, pk, options);

        return result;
    }

    async restoreList(
        pks: PKType[],
        options?: VSRepoMethodOptions<Entity, OrmTypes>,
    ): Promise<CountResult> {
        if (!this.softRemoveKey) {
            throw new Error();
        }

        await this.execBeforeHook("restoreList", pks, options);

        const result = await this.adapter.updateMany(
            this.mergeWheresResolver.resolve("all", this.wherePkIn(pks)),
            { [this.softRemoveKey]: null } as DeepPartial<Entity>,
            options,
        );

        await this.execAfterHook("restoreList", result, pks, options);

        return result;
    }
}
