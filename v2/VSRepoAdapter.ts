import { AdapterMethodOptions } from "./types/adapter/adapter-method-options.type";
import { AdapterQueryOptions } from "./types/adapter/adapter-query-options.type";
import { CountResult } from "./types/utils/count-result.type";
import { DeepPartial } from "./types/utils/deep-partial.type";
import { VSRepoTransactionOptions } from "./types/vsrepo/vsrepo-transaction-options.type";
import { VSRepoWhere } from "./types/vsrepo/vsrepo-where.type";

/**
 * @publicApi
 */
export abstract class VSRepoAdapter<T> {
    public abstract runInTransaction<R>(
        fn: (tx: any) => Promise<R>,
        options?: VSRepoTransactionOptions,
    ): Promise<R>;

    public abstract getDbClient(): any;

    public abstract query<T = any>(query: string, options?: AdapterQueryOptions): Promise<T>;

    public abstract findOne(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T | null>;

    public abstract findOneOrThrow(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;

    public abstract findMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    public abstract save(obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;

    public abstract saveMany(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    public abstract create(objs: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;

    public abstract createMany(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T> & { ignoreConflicts?: boolean },
    ): Promise<CountResult>;

    public abstract delete(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T>;

    public abstract deleteMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<CountResult>;

    public abstract deleteManyReturning(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    public abstract update(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;

    public abstract updateMany(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<CountResult>;

    public abstract updateManyReturning(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    public abstract count(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<number>;

    public abstract exists(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<boolean>;

    public abstract merge<K>(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<K & T>;

    public abstract upsert(
        where: VSRepoWhere<T>,
        create: DeepPartial<T>,
        update: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
}
