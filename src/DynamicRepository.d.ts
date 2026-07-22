import {
    BuildConfig,
    ClientOrTransaction,
    DbClient,
    DbTransaction,
    DistributiveOmit,
    ExtractNestedCreateInput,
    ExtractNestedUpdateInput,
    IncludeModel,
    ModelUpsertInput,
    OrdenationModel,
    PaginationModel,
    PaginationOptions,
    PrismaModelInputs,
    PrismaModelName,
    RepositoryRelations,
    SeeMode,
    WhereModel,
} from "./VSRepository.d";

/**
 * Flattens a type intersection into a single object,
 * avoiding the TypeScript "union type too complex to represent" error.
 */
type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Resolves `WRelations` to a concrete relation map, falling back to `{}` when no
 * relations were flagged (mirrors `VSRepository`'s own internal fallback).
 */
type ResolveRelations<WRelations> = WRelations extends object ? WRelations : {};

/**
 * Payload accepted for a relation field mapped as `true` in `WRelations`, used to build
 * the `create`-shaped payload for `save`/`saveList`/`patch`/`patchList`.
 *
 * To-many relations (array fields) resolve to a list of Prisma's own nested `create`
 * payload. To-one relations (object fields) resolve to that same nested `create` payload,
 * but **always also accept `null`** by default — since `WRelations` only flags *which*
 * fields are relations (not their `mode`/`restriction`/`nullable` config), every to-one
 * relation here is treated as unlinkable.
 */
type DynamicRelationCreatePayload<TField, M extends PrismaModelName, K extends PropertyKey> =
    NonNullable<TField> extends any[]
        ? ExtractNestedCreateInput<M, K>[]
        : NonNullable<TField> extends object
          ? ExtractNestedCreateInput<M, K> | null
          : never;

/**
 * Same as `DynamicRelationCreatePayload`, but built from Prisma's nested `update` payload
 * instead of `create` — used by `merge`. To-one relations still accept `null` by default.
 */
type DynamicRelationUpdatePayload<TField, M extends PrismaModelName, K extends PropertyKey> =
    NonNullable<TField> extends any[]
        ? ExtractNestedUpdateInput<M, K>[]
        : NonNullable<TField> extends object
          ? ExtractNestedUpdateInput<M, K> | null
          : never;

/**
 * Distributes over the branches of Prisma's own upsert/create union for `UName`, replacing
 * every field flagged in `TRelations` with `DynamicRelationCreatePayload`.
 */
type DynamicTransformCreatePayload<U, T, M extends PrismaModelName, TRelations> = Omit<
    U,
    keyof TRelations
> & {
    // Fields that are REQUIRED in this specific branch of the Prisma union
    [K in Extract<keyof TRelations, keyof U> as {} extends Pick<U, K>
        ? never
        : K]: K extends keyof T ? DynamicRelationCreatePayload<T[K], M, K> : never;
} & {
    // Fields that are OPTIONAL in this branch or do not originally belong to it
    [K in keyof TRelations as K extends keyof U
        ? {} extends Pick<U, K>
            ? K
            : never
        : K]?: K extends keyof T ? DynamicRelationCreatePayload<T[K], M, K> : never;
};

/**
 * Payload accepted by the `save`/`saveList` methods.
 *
 * Built directly from Prisma's own upsert/create input for `UName`, exactly like
 * `VSRepository`'s `save`: fields flagged as relations via `WRelations` are resolved
 * into their nested `create` payload shape instead of `TEntity`'s own shape (to-one
 * relations also accept `null` by default); every other field keeps Prisma's own
 * validated create input shape.
 */
export type DynamicSaveInput<TEntity, UName extends PrismaModelName, WRelations = undefined> =
    ModelUpsertInput<UName> extends infer U
        ? U extends any
            ? Simplify<DynamicTransformCreatePayload<U, TEntity, UName, ResolveRelations<WRelations>>>
            : never
        : never;

/**
 * Payload accepted by the `patch`/`patchList` methods.
 *
 * Built from Prisma's own `update` input for `UName` (so every field is already
 * optional); fields flagged as relations via `WRelations` are resolved into their
 * nested `create` payload shape, the same way as in `DynamicSaveInput` (to-one
 * relations also accept `null` by default).
 */
export type DynamicPatchInput<
    TEntity,
    UName extends PrismaModelName,
    WRelations = undefined,
> = Simplify<
    DistributiveOmit<PrismaModelInputs<UName>["updateInput"], keyof ResolveRelations<WRelations>> & {
        [K in Extract<keyof ResolveRelations<WRelations>, keyof TEntity>]?: DynamicRelationCreatePayload<
            TEntity[K],
            UName,
            K
        >;
    }
>;

/**
 * Payload accepted by the `merge` method.
 *
 * Built from Prisma's own `update` input for `UName` (so every field is already
 * optional); fields flagged as relations via `WRelations` are resolved into their
 * nested `update` payload shape (to-one relations also accept `null` by default).
 */
export type DynamicMergeInput<
    TEntity,
    UName extends PrismaModelName,
    WRelations = undefined,
> = Simplify<
    DistributiveOmit<PrismaModelInputs<UName>["updateInput"], keyof ResolveRelations<WRelations>> & {
        [K in Extract<keyof ResolveRelations<WRelations>, keyof TEntity>]?: DynamicRelationUpdatePayload<
            TEntity[K],
            UName,
            K
        >;
    }
>;

/**
 * Base options accepted by most `DynamicRepository` methods.
 */
export type DynamicMethodOptions<TName extends PrismaModelName = PrismaModelName> = {
    /** Database client or transaction to use for this operation. */
    db?: ClientOrTransaction;

    /**
     * Controls visibility of soft-deleted records.
     * Only takes effect if `softRemovekName` is configured.
     */
    see?: SeeMode;

    /** Raw Prisma `include`. */
    include?: IncludeModel<TName>;
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
 * @template WRelations Keys of `TEntity` configured as relations (flags only, `true`
 * per relation field). The actual relation behavior (`mode`, `restriction`, `nullable`)
 * still comes from `relations` in the constructor config; `WRelations` here only tells
 * `DynamicSaveInput`/`DynamicPatchInput`/`DynamicMergeInput` which fields to resolve
 * into their nested Prisma create/update payload shape instead of `TEntity`'s own shape.
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

    /**
     * The Prisma Client instance passed to constructor.
     */
    readonly prisma: DbClient;

    /** Fetches a record by its primary key (PK). */
    get(pk: VPKType, options?: DynamicMethodOptions<UName>): Promise<TEntity | null>;

    /** Fetches a record by PK and throws `VSRepoRuntimeError` if not found. */
    getOrThrow(pk: VPKType, options?: DynamicMethodOptions<UName>): Promise<TEntity>;

    /** Fetches multiple records by a list of primary keys (PKs). */
    getList(pks: VPKType[], options?: DynamicMethodOptions<UName>): Promise<TEntity[]>;

    /** Deletes a record identified by its primary key (PK). */
    remove(pk: VPKType, options?: DynamicMethodOptions<UName>): Promise<TEntity>;

    /** Inserts or updates (upsert) a record. */
    save(
        obj: DynamicSaveInput<TEntity, UName, WRelations>,
        options?: DynamicMethodOptions<UName>,
    ): Promise<TEntity>;

    /** Saves an array of objects in a single automatic transaction. */
    saveList(
        objs: DynamicSaveInput<TEntity, UName, WRelations>[],
        options?: Omit<DynamicMethodOptions<UName>, "include"> & {
            /** Transaction client to use for this operation. */
            db?: DbTransaction;
        },
    ): Promise<TEntity[]>;

    /** Partially updates (patch) an existing record by its primary key (PK). */
    patch(
        pk: VPKType,
        obj: DynamicPatchInput<TEntity, UName, WRelations>,
        options?: DynamicMethodOptions<UName>,
    ): Promise<TEntity>;

    /** Partially updates multiple records via `[pk, obj]` tuples in an automatic transaction. */
    patchList(
        tuples: [pk: VPKType, obj: DynamicPatchInput<TEntity, UName, WRelations>][],
        options?: Omit<DynamicMethodOptions<UName>, "include"> & {
            /** Transaction client to use for this operation. */
            db?: DbTransaction;
        },
    ): Promise<TEntity[]>;

    /** Fetches a record by PK and deep-merges it with the provided object **in memory**. */
    merge(
        pk: VPKType,
        obj: DynamicMergeInput<TEntity, UName, WRelations>,
        options?: DynamicMethodOptions<UName>,
    ): Promise<TEntity | null>;

    /** Deletes multiple records by their primary keys. */
    removeList(
        pks: VPKType[],
        options?: Omit<DynamicMethodOptions<UName>, "include">,
    ): Promise<{ count: number }>;

    /** Fetches all records (respects `requiredWhere` when set). */
    getAll(
        options?: DynamicMethodOptions<UName> & {
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
    total(options?: Omit<DynamicMethodOptions<UName>, "include">): Promise<number>;

    /** Checks whether a record exists by its primary key (PK). */
    has(pk: VPKType, options?: Omit<DynamicMethodOptions<UName>, "include">): Promise<boolean>;

    /** Marks a record as deleted (soft-delete). */
    softRemove(pk: VPKType, options?: Omit<DynamicMethodOptions<UName>, "see">): Promise<TEntity>;

    /** Marks multiple records as deleted (soft-delete) in batch. */
    softRemoveList(
        pks: VPKType[],
        options?: Omit<DynamicMethodOptions<UName>, "see" | "include">,
    ): Promise<{ count: number }>;

    /** Restores a record previously marked as deleted (soft-delete). */
    restore(pk: VPKType, options?: Omit<DynamicMethodOptions<UName>, "see">): Promise<TEntity>;

    /** Restores multiple records previously marked as deleted (soft-delete) in batch. */
    restoreList(
        pks: VPKType[],
        options?: Omit<DynamicMethodOptions<UName>, "see" | "include">,
    ): Promise<{ count: number }>;
}

export type DynamicMethodConfig<M extends PrismaModelName = PrismaModelName> = {
    /** Redirects the logic to another valid method pattern. */
    proxyTo?: string;

    /** Controls whether the method combines (`extending`) or overwrites (`overwrite`) the `requiredWhere`. */
    whereType?: "overwrite" | "extending";

    /** Adds an extra `where` on top of `requiredWhere`. */
    pushWhere?: WhereModel<M>;

    /**
     * Defines whether the method returns a single item (`one`) or a list (`list`).
     * @deprecated Use `findOneBy` if you want to return a single result.
     */
    fbMode?: "one" | "list";

    /** Injects a fixed ordering automatically into the query. */
    injectOrdenation?: OrdenationModel<M>;

    /** Injects a fixed pagination automatically into the query. */
    injectPagination?: PaginationModel<M>;
};

/**
 * Property decorator used to declare a dynamic method on a `DynamicRepository` subclass.
 *
 * Applied to a `declare` class field whose name follows one of the supported method
 * patterns (e.g. `findByEmail`, `findManyByStatusPaginated`); the method's behavior and
 * return type are inferred from the field name, optionally adjusted via `config`.
 *
 * @template M Prisma model name the decorated method operates on.
 *
 * @example
 * ```typescript
 * class UserRepository extends DynamicRepository<User, "User", string> {
 *     `@DynamicMethod()`
 *     declare findOneByEmail: (email: string) => Promise<User | null>;
 * 
 *     @DynamicMethod<"User">({ injectOrdenation: { createdAt: "desc" } })
 *     declare findByAge: (email: number) => Promise<User[]>;
 * }
 * ```
 */
export declare function DynamicMethod<M extends PrismaModelName = PrismaModelName>(
    config?: DynamicMethodConfig<M>,
): PropertyDecorator;
