/**
 * ! THIS FILE IS AUTO-GENERATED.
 * ! DO NOT EDIT MANUALLY.
 */
/* eslint-disable */
/* biome-ignore-all lint: generated file */
// @ts-nocheck

import {
    BuildConfig,
    ClientOrTransaction,
    DbClient,
    DbTransaction,
    OrdenationModel,
    PaginationOptions,
    PrismaModelName,
    RepositoryRelations,
    SeeMode,
    WhereModel,
} from "./VSRepository.types";

/**
 * Flattens a type intersection into a single object,
 * avoiding the TypeScript "union type too complex to represent" error.
 */
type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Keys of `TEntity` that were configured as relations in `WRelations`.
 */
type DynamicRelationKeys<TEntity, WRelations> = WRelations extends Partial<Record<keyof TEntity, true>>
    ? { [K in keyof WRelations]: WRelations[K] extends true ? K : never }[keyof WRelations] & keyof TEntity
    : never;

/**
 * Resolves the shape of an input object based on the relations configured via `WRelations`.
 *
 * Fields that are mapped as relations become optional, since their linking, creation,
 * or cascading deletion is automatically handled by the repository. All other fields
 * keep their original shape from `TEntity`.
 */
type ResolveRelationsInput<TEntity, WRelations> = [DynamicRelationKeys<TEntity, WRelations>] extends [never]
    ? TEntity
    : Simplify<
          Omit<TEntity, DynamicRelationKeys<TEntity, WRelations>> &
              Partial<Pick<TEntity, DynamicRelationKeys<TEntity, WRelations>>>
      >;

/**
 * Payload accepted by the `save`/`saveList` methods.
 *
 * Relation fields configured via `WRelations` are optional; every other field
 * follows the shape of `TEntity`.
 */
export type DynamicSaveInput<TEntity, WRelations> = ResolveRelationsInput<TEntity, WRelations>;

/**
 * Payload accepted by the `patch`/`patchList` methods.
 *
 * Every field is optional, and relation fields configured via `WRelations`
 * are resolved the same way as in `DynamicSaveInput`.
 */
export type DynamicPatchInput<TEntity, WRelations> = Partial<ResolveRelationsInput<TEntity, WRelations>>;

/**
 * Payload accepted by the `merge` method.
 *
 * Every field is optional, and relation fields configured via `WRelations`
 * are resolved the same way as in `DynamicSaveInput`.
 */
export type DynamicMergeInput<TEntity, WRelations> = Partial<ResolveRelationsInput<TEntity, WRelations>>;

/**
 * Base options accepted by most `DynamicRepository` methods.
 */
export type DynamicMethodOptions = {
    /** Database client or transaction to use for this operation. */
    db?: ClientOrTransaction;
};

/**
 * Options accepted by methods that respect soft-delete visibility.
 */
export type DynamicMethodOptionsWithSee = DynamicMethodOptions & {
    /**
     * Controls visibility of soft-deleted records.
     * Only takes effect if `softRemovekName` is configured.
     */
    see?: SeeMode;
};

/**
 * Options accepted by methods that run in a batch/automatic transaction.
 */
export type DynamicTransactionOptions = {
    /** Transaction client to use for this operation. */
    db?: DbTransaction;
};

/**
 * Configuration for an individual base method exposed by `DynamicRepository`.
 *
 * Unlike `VSRepository`'s `BuildConfig`, this configuration does not accept
 * `active` (base methods are always available) nor `defaultSelect`
 * (`DynamicRepository` has no select models).
 */
type StrippedBaseMethods<TSelectKeys extends PropertyKey = string> = {
    [K in keyof NonNullable<BuildConfig<TSelectKeys>["baseMethods"]>]: Omit<
        NonNullable<NonNullable<BuildConfig<TSelectKeys>["baseMethods"]>[K]>,
        "active" | "defaultSelect"
    >;
};

/**
 * Configuration applied during the construction of a `DynamicRepository`.
 *
 * Equivalent to `VSRepository`'s `BuildConfig`, but without `freeze`
 * (no longer configurable) and without `active`/`defaultSelect` on each
 * base method (base methods are always active and there are no select models).
 */
export type DynamicRepositoryBuildConfig = Omit<BuildConfig, "freeze" | "baseMethods"> & {
    /** Customizes the behavior of the automatic base methods. */
    baseMethods?: StrippedBaseMethods;
};

/**
 * Configuration used to construct a `DynamicRepository`.
 *
 * @template T Type of the entity managed by the repository.
 * @template U Prisma model name.
 */
export interface DynamicRepositoryConstructorConfig<T, U extends PrismaModelName> {
    /**
     * Name of the table mapped by Prisma (usually uncapitalized).
     */
    tableName: Uncapitalize<U>;

    /**
     * Name of the field that represents the entity's primary key (Primary Key).
     */
    pkName: keyof T;

    /**
     * Name of the `DateTime` field used for soft-delete.
     *
     * When configured, enables the `softRemove`, `softRemoveList`, `restore`, and `restoreList` methods.
     * The field **must** be of type `DateTime` in the Prisma schema — VSRepository validates this during `build`.
     */
    softRemovekName?: keyof T;

    /**
     * Defines global filters that will be automatically applied to all repository queries.
     * Useful for tenant isolation (multi-tenancy) or base restrictions (e.g., `isActive: true`).
     */
    requiredWhere?: WhereModel<U>;

    /**
     * Default ordering automatically injected into all queries that accept `orderBy`,
     * unless the method already has `injectOrdenation` configured or uses the `Ordered` suffix.
     *
     * Useful for ensuring a consistent sort order across the repository without repeating
     * the `order` argument on every call.
     */
    defaultOrdenation?: OrdenationModel<U>;

    /**
     * Configures automatic relation management.
     * When configured, allows the `save`, `saveList`, `patch`, and `patchList` methods
     * to automatically handle linking, creation, or cascading deletion of related records.
     */
    relations?: RepositoryRelations<T>;

    /**
     * Customizes the behavior of the automatic base methods when the repository is built.
     */
    build?: DynamicRepositoryBuildConfig;
}

/**
 * Base repository built from a fixed configuration, exposing a complete set of
 * ready-to-use CRUD and soft-delete methods around a Prisma model.
 *
 * @template TEntity Type of the entity managed by the repository.
 * @template UName Prisma model name.
 * @template VPKType Type of the entity's primary key value.
 * @template WRelations Map indicating which fields of `TEntity` are configured as relations.
 */
export declare abstract class DynamicRepository<
    TEntity extends object,
    UName extends PrismaModelName,
    VPKType,
    WRelations extends Partial<Record<keyof TEntity, true>> | undefined = undefined,
> {
    /**
     * Creates a configured instance of `DynamicRepository`.
     */
    constructor(prisma: DbClient, config: DynamicRepositoryConstructorConfig<TEntity, UName>);

    /** Fetches a record by its primary key (PK). */
    get(pk: VPKType, options?: DynamicMethodOptionsWithSee): Promise<TEntity | null>;

    /** Fetches a record by PK and throws `VSRepoRuntimeError` if not found. */
    getOrThrow(pk: VPKType, options?: DynamicMethodOptionsWithSee): Promise<TEntity>;

    /** Fetches multiple records by a list of primary keys (PKs). */
    getList(pks: VPKType[], options?: DynamicMethodOptionsWithSee): Promise<TEntity[]>;

    /** Deletes a record identified by its primary key (PK). */
    remove(pk: VPKType, options?: DynamicMethodOptions): Promise<TEntity>;

    /** Inserts or updates (upsert) a record. */
    save(obj: DynamicSaveInput<TEntity, WRelations>, options?: DynamicMethodOptions): Promise<TEntity>;

    /** Saves an array of objects in a single automatic transaction. */
    saveList(
        objs: DynamicSaveInput<TEntity, WRelations>[],
        options?: DynamicTransactionOptions,
    ): Promise<TEntity[]>;

    /** Partially updates (patch) an existing record by its primary key (PK). */
    patch(
        pk: VPKType,
        obj: DynamicPatchInput<TEntity, WRelations>,
        options?: DynamicMethodOptions,
    ): Promise<TEntity>;

    /** Partially updates multiple records via `[pk, obj]` tuples in an automatic transaction. */
    patchList(
        tuples: [pk: VPKType, obj: DynamicPatchInput<TEntity, WRelations>][],
        options?: DynamicTransactionOptions,
    ): Promise<TEntity[]>;

    /** Fetches a record by PK and deep-merges it with the provided object **in memory**. */
    merge(
        pk: VPKType,
        obj: DynamicMergeInput<TEntity, WRelations>,
        options?: DynamicMethodOptions,
    ): Promise<TEntity | null>;

    /** Deletes multiple records by their primary keys. */
    removeList(pks: VPKType[], options?: DynamicMethodOptions): Promise<{ count: number }>;

    /** Fetches all records (respects `requiredWhere` when set). */
    getAll(
        options?: DynamicMethodOptionsWithSee & {
            /** Pagination options for the query. */
            pagination?: PaginationOptions;
            /**
             * Ordering to apply to the query.
             * When omitted and `defaultOrdenation` is configured on the repository,
             * the default ordering is applied automatically.
             */
            order?: OrdenationModel<UName>;
        },
    ): Promise<TEntity[]>;

    /** Returns the total number of records. */
    total(options?: DynamicMethodOptionsWithSee): Promise<number>;

    /** Checks whether a record exists by its primary key (PK). */
    has(pk: VPKType, options?: DynamicMethodOptionsWithSee): Promise<boolean>;

    /** Marks a record as deleted (soft-delete). */
    softRemove(pk: VPKType, options?: DynamicMethodOptionsWithSee): Promise<TEntity>;

    /** Marks multiple records as deleted (soft-delete) in batch. */
    softRemoveList(pks: VPKType[], options?: DynamicMethodOptions): Promise<{ count: number }>;

    /** Restores a record previously marked as deleted (soft-delete). */
    restore(pk: VPKType, options?: DynamicMethodOptionsWithSee): Promise<TEntity>;

    /** Restores multiple records previously marked as deleted (soft-delete) in batch. */
    restoreList(pks: VPKType[], options?: DynamicMethodOptions): Promise<{ count: number }>;
}
