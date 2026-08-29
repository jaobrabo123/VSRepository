import { AdapterMethodOptions } from "../src/types/adapter/adapter-method-options.type";
import { AdapterQueryOptions } from "../src/types/adapter/adapter-query-options.type";
import { CountResult } from "../src/types/utils/count-result.type";
import { DeepPartial } from "../src/types/utils/deep-partial.type";
import { VSRepoTransactionOptions } from "../src/types/vsrepo/vsrepo-transaction-options.type";
import { VSRepoWhere } from "../src/types/vsrepo/vsrepo-where.type";

/**
 * Contract implemented by ORM-specific adapters (e.g. Prisma, TypeORM) that
 * `VSRepository` delegates every operation to.
 *
 * Implementing this class is what makes `VSRepository` usable with a given
 * ORM/database: `VSRepository` never talks to the ORM directly, it only
 * calls these methods with already-resolved `VSRepoWhere`/`AdapterMethodOptions`.
 *
 * @template T Entity type this adapter operates on.
 *
 * @publicApi
 */
export abstract class VSRepoAdapter<T> {
    /** Runs `fn` inside a native transaction of the underlying ORM/database. */
    public abstract runInTransaction<R>(
        fn: (tx: any) => Promise<R>,
        options?: VSRepoTransactionOptions,
    ): Promise<R>;

    /** Returns the underlying ORM client instance used outside of transactions. */
    public abstract getDbClient(): any;

    /** Executes a raw query/statement against the underlying database, used by `@QueryMethod`. */
    public abstract query<T = any>(query: string, options?: AdapterQueryOptions): Promise<T>;

    /** Fetches a single record matching `where`. */
    public abstract findOne(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T | null>;

    /** Fetches a single record matching `where`, throwing if none is found. */
    public abstract findOneOrThrow(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;

    /** Fetches all records matching `where`. */
    public abstract findMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> & { distinct?: (keyof T)[] },
    ): Promise<T[]>;

    /** Creates or updates (upsert) a single record. */
    public abstract save(obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;

    /** Creates or updates (upsert) multiple records in a single operation. */
    public abstract saveMany(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    /** Creates a single record. */
    public abstract create(objs: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;

    /** Creates multiple records in a single operation. */
    public abstract createMany(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T> & { ignoreConflicts?: boolean },
    ): Promise<CountResult>;

    /** Deletes a single record matching `where`. */
    public abstract delete(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T>;

    /** Deletes every record matching `where`, returning the count of affected rows. */
    public abstract deleteMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<CountResult>;

    /** Deletes every record matching `where`, returning the deleted records. */
    public abstract deleteManyReturning(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    /** Updates a single record matching `where`. */
    public abstract update(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;

    /** Updates every record matching `where`, returning the count of affected rows. */
    public abstract updateMany(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<CountResult>;

    /** Updates every record matching `where`, returning the updated records. */
    public abstract updateManyReturning(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;

    /** Returns the number of records matching `where`. */
    public abstract count(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<number>;

    /** Checks whether at least one record matching `where` exists. */
    public abstract exists(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<boolean>;

    /** Updates a single record matching `where` and returns it deep-merged with the provided object. */
    public abstract merge<K>(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<K & T>;

    /** Creates a record if none matches `where`, otherwise updates it. */
    public abstract upsert(
        where: VSRepoWhere<T>,
        create: DeepPartial<T>,
        update: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
}
