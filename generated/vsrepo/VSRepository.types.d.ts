/**
 * ! THIS FILE IS AUTO-GENERATED.
 * ! DO NOT EDIT MANUALLY.
 */
/* eslint-disable */
/* biome-ignore-all lint: generated file */
// @ts-nocheck

import { Prisma, PrismaClient } from '../prisma/client';
import { Decimal, JsonValue } from '@prisma/client/runtime/client';

/**
 * Flattens a type intersection into a single object,
 * avoiding the TypeScript "union type too complex to represent" error.
 */
type Simplify<T> = { [K in keyof T]: T[K] } & {};

type WidenField<T> = 
    T extends bigint ? bigint | number :
    T extends Date ? Date | string :
    T extends Decimal ? Decimal | string | number :
    T extends readonly [infer U, infer V] ? [WidenField<U>, WidenField<V>] : 
    T extends Array<infer U> ? WidenField<U>[] : 
    T;

/**
 * Full Prisma Client instance used to build repositories.
 */
export type DbClient = PrismaClient;

/**
 * Prisma transactional client returned by `prisma.$transaction`.
 */
export type DbTransaction = Prisma.TransactionClient;

/**
 * Accepts either the main Prisma client or a transaction client.
 */
export type ClientOrTransaction = DbClient | DbTransaction;

export * from './VSRepoError';

type OrderPattern = {
    [key: string]: 'asc' | 'desc' | { _count: 'asc' | 'desc' } | OrderPattern;
};

/**
 * Pagination options accepted by methods with the `Paginated` suffix.
 *
 * @template TCursor Type of the cursor used by the Prisma model.
 */
export type PaginationOptions<TCursor = unknown> = {
    /** Number of records to skip. */
    skip?: number;
    /** Maximum number of records to return. */
    take?: number;
    /** Typed cursor for position-based pagination. */
    cursor?: TCursor;
};

/**
 * Ordering accepted by repository methods.
 *
 * Can be a single ordering or a list of chained orderings.
 */
export type OrderOptions = OrderPattern | OrderPattern[];

/**
 * Visibility mode for records with soft-delete.
 *
 * - `"active"` — returns only non-deleted records (default).
 * - `"removed"` — returns only deleted records.
 * - `"all"` — returns all records regardless of their status.
 */
export type SeeMode = 'active' | 'removed' | 'all';

type ValidMethodPatterns =
    | `existsBy${string}` | `findBy${string}` 
    | `findUniqueBy${string}` | `findUniqueOrThrowBy${string}`
    | `findFirstBy${string}` | `findFirst${string}` 
    | `findFirstOrThrowBy${string}` | `findFirstOrThrow${string}`
    | `findManyBy${string}` | `findMany${string}` 
    | `createManyAndReturn${string}` | `createMany${string}`
    | `create${string}` | `updateManyAndReturnBy${string}` | `updateManyBy${string}`
    | `updateBy${string}` | `upsertBy${string}` | `deleteManyBy${string}`
    | `deleteBy${string}` | `countBy${string}` | `count${string}` | `countWhere${string}`
    | `findWhere${string}` | `findListWhere${string}`
    | `existsWhere${string}` | `updateManyWhere${string}` | `deleteManyWhere${string}`
    | `findOneWhere${string}` | `findOneBy${string}` | `updateManyAndReturnWhere${string}`
    | 'aggregate' | 'groupBy';

type StripModifier<S extends string> =
  S extends `${infer Base}NotStartsWithInsensitive` ? Base :
  S extends `${infer Base}StartsWithInsensitive` ? Base :
  S extends `${infer Base}NotEndsWithInsensitive` ? Base :
  S extends `${infer Base}EndsWithInsensitive` ? Base :
  S extends `${infer Base}NotContainsInsensitive` ? Base :
  S extends `${infer Base}ContainsInsensitive` ? Base :
  S extends `${infer Base}NotInInsensitive` ? Base :
  S extends `${infer Base}InInsensitive` ? Base :
  S extends `${infer Base}NotInsensitive` ? Base :
  S extends `${infer Base}NotStartsWith` ? Base :
  S extends `${infer Base}StartsWith` ? Base :
  S extends `${infer Base}NotEndsWith` ? Base :
  S extends `${infer Base}EndsWith` ? Base :
  S extends `${infer Base}NotContains` ? Base :
  S extends `${infer Base}Contains` ? Base :
  S extends `${infer Base}NotIn` ? Base :
  S extends `${infer Base}In` ? Base :
  S extends `${infer Base}NotBetween` ? Base :
  S extends `${infer Base}Between` ? Base :
  S extends `${infer Base}Not` ? Base :
  S extends `${infer Base}LessThanEqual` ? Base :
  S extends `${infer Base}LessThan` ? Base :
  S extends `${infer Base}GreaterThanEqual` ? Base :
  S extends `${infer Base}GreaterThan` ? Base :
  S extends `${infer Base}Insensitive` ? Base :
  S;

type ExtractFieldName<S extends string> = Uncapitalize<StripModifier<S>>;

type IsArrayFilter<S extends string> = S extends `${string}${'NotIn' | 'In'}` ? true : false;

type IsBetweenFilter<S extends string> = S extends `${string}${'NotBetween' | 'Between'}` ? true : false;

type ParseRelation<S extends string> =
    S extends `${infer Rel}Without${infer Rest}` ? [Uncapitalize<Rel>, 'isNot', Rest] :
    S extends `${infer Rel}With${infer Rest}` ? [Uncapitalize<Rel>, 'is', Rest] :
    S extends `${infer Rel}Some${infer Rest}` ? [Uncapitalize<Rel>, 'some', Rest] :
    S extends `${infer Rel}Every${infer Rest}` ? [Uncapitalize<Rel>, 'every', Rest] :
    S extends `${infer Rel}None${infer Rest}` ? [Uncapitalize<Rel>, 'none', Rest] : null;

type GetFieldType<T, S extends string, I> = WidenField<
    ExtractFieldName<S> extends infer FieldName
        ? FieldName extends keyof T
            ? IsArrayFilter<S> extends true
                ? T[FieldName][]
                : IsBetweenFilter<S> extends true
                  ? [NonNullable<T[FieldName]>, NonNullable<T[FieldName]>]
                  : NonNullable<T[FieldName]> extends object | any[]
                    ? I extends { whereInput: infer W }
                        ? FieldName extends keyof NonNullable<W> ? Exclude<NonNullable<W>[FieldName], undefined> : T[FieldName]
                        : T[FieldName]
                    : T[FieldName]
            : ParseRelation<S> extends [infer Rel extends keyof T, any, infer Rest extends string]
                ? GetFieldType<NonNullable<T[Rel]> extends any[] ? NonNullable<T[Rel]>[number] : NonNullable<T[Rel]>, Rest, unknown>
                : unknown
        : unknown
>;

type NoArgModifiers = 'IsNull' | 'IsNotNull' | 'IsTrue' | 'IsFalse' | 'None' | 'Some' | 'Every' | 'Without';

type IsNoArgModifier<S extends string> = 
    S extends `${string}${'StartsWith' | 'EndsWith'}` ? false :
    S extends `${string}${NoArgModifiers | 'With'}` ? true : 
    false;

type IsOptional<S extends string> = S extends `${string}Optional` ? true : false;
type StripOptional<S extends string> = S extends `${infer Base}Optional` ? Base : S;

type MapToContractTypes<T, Arr extends string[], I> = 
    Arr extends [infer First extends string, ...infer Rest extends string[]]
        ? First extends '' 
            ? MapToContractTypes<T, Rest, I>
            : StripOptional<First> extends infer CleanFirst extends string
                ? IsNoArgModifier<CleanFirst> extends true
                    ? MapToContractTypes<T, Rest, I>
                    : IsOptional<First> extends true
                        ? [GetFieldType<T, CleanFirst, I> | undefined, ...MapToContractTypes<T, Rest, I>]
                        : [GetFieldType<T, CleanFirst, I>, ...MapToContractTypes<T, Rest, I>]
                : never
        : [];

type SplitAllTokens<S extends string> =
    S extends `${infer L}AND${infer R}` ? [...SplitAllTokens<L>, ...SplitAllTokens<R>] :
    S extends `${infer L}And${infer R}` ? [...SplitAllTokens<L>, ...SplitAllTokens<R>] :
    S extends `${infer L}Or${infer R}` ? [...SplitAllTokens<L>, ...SplitAllTokens<R>] :
    S extends '' ? [] :
    [S];

type ExtractFields<T, R extends string, I> =
    R extends '' ? [] 
    : FilterNonEmpty<MapToContractTypes<T, SplitAllTokens<R>, I>>;

type FilterNonEmpty<T extends unknown[]> = 
    T extends [infer First, ...infer Rest]
        ? [First] extends ['']
            ? FilterNonEmpty<Rest>
            : [First, ...FilterNonEmpty<Rest>]
        : [];

type ResolveReturnType<M extends string, TSelected> =
    M extends 'existsBy' | 'existsWhere' ? boolean :
    M extends 'createMany' | 'updateManyBy' | 'deleteManyBy' | 'updateManyWhere' | 'deleteManyWhere' ? { count: number } :
    M extends 'findMany' | 'createManyAndReturn' | 'updateManyAndReturnBy' | 'updateManyAndReturnWhere' | 'findListWhere' | 'findByList' ? TSelected[] :
    M extends 'findUnique' | 'findFirst' | 'findWhere' | 'findByOne' | 'findOneBy' | 'findOneWhere' ? TSelected | null :
    M extends 'findUniqueOrThrow' | 'findFirstOrThrow' | 'create' | 'updateBy' | 'upsertBy' | 'deleteBy' ? TSelected :
    M extends 'count' | 'countWhere' ? number : never;

type GetUpdateInput<I> = I extends { updateInput: infer U } ? U : unknown;
type GetCreateInput<I> = I extends { createInput: infer C } ? C : unknown;
type GetCreateManyInput<I> = I extends { createManyInput: infer CM } ? CM : unknown;
type GetUpdateManyInput<I> = I extends { updateManyInput: infer UM } ? UM : unknown;
type GetWhereInput<I> = I extends { whereInput: infer W } ? NonNullable<W> : unknown;
type GetCursorInput<I> = I extends { cursorInput: infer C } ? C : unknown;
type GetOrderByInput<I> = I extends { orderByInput: infer OB } ? NonNullable<OB> : OrderOptions;

type ExtraArgs<M extends string, R extends string, I> = [
    ...(M extends 'upsertBy' ? [update: GetUpdateInput<I>, create: GetCreateInput<I>]
      : M extends 'create' ? [data: GetCreateInput<I>]
      : M extends 'updateBy' ? [data: GetUpdateInput<I>]
      : M extends 'createMany' | 'createManyAndReturn' ? [data: GetCreateManyInput<I>]
      : M extends 'updateManyBy' | 'updateManyAndReturnBy' ? [data: GetUpdateManyInput<I>]
      : M extends 'findWhere' | 'findListWhere' | 'countWhere' | 'existsWhere' | 'deleteManyWhere' | 'findOneWhere' ? [where: GetWhereInput<I>]
      : M extends 'updateManyWhere' | 'updateManyAndReturnWhere' ? [where: GetWhereInput<I>, data: GetUpdateManyInput<I>]
      : []),
    ...(R extends `${string}PaginatedAndOrdered` ? [pagination: PaginationOptions<GetCursorInput<I>>, order: GetOrderByInput<I>]
      : R extends `${string}OrderedAndPaginated` ? [order: GetOrderByInput<I>, pagination: PaginationOptions<GetCursorInput<I>>]
      : R extends `${string}Paginated` ? [pagination: PaginationOptions<GetCursorInput<I>>]
      : R extends `${string}Ordered` ? [order: GetOrderByInput<I>]
      : [])
];

type PrismaDelegate<M extends Prisma.ModelName> = Uncapitalize<M> extends keyof DbClient ? DbClient[Uncapitalize<M>] : never;

type FullModelType<M extends Prisma.ModelName> = 
  Prisma.Result<PrismaDelegate<M>, {}, 'findMany'> extends Array<infer U> ? U : never;

type PrecomputedSelects<M extends Prisma.ModelName, SelectModels> = {
    [S in keyof SelectModels]: Prisma.Result<PrismaDelegate<M>, { select: SelectModels[S] }, 'findMany'> extends Array<infer U> ? U : never
};

type PrecomputedIncludes<M extends Prisma.ModelName, IncludeModels> = {
    [I in keyof IncludeModels]: Prisma.Result<PrismaDelegate<M>, { include: IncludeModels[I] }, 'findMany'> extends Array<infer U> ? U : never
};

type SelectedModel<M extends Prisma.ModelName, S, SelectModels, IM = never, IncludeModels = {}> = 
    [IM] extends [never]
        ? [S] extends [false] 
            ? FullModelType<M>
            : [S] extends [never] 
                ? FullModelType<M> 
                : [S] extends [keyof SelectModels] 
                    ? PrecomputedSelects<M, SelectModels>[S]
                    : FullModelType<M>
        : IM extends keyof IncludeModels
            ? PrecomputedIncludes<M, IncludeModels>[IM]
            : FullModelType<M>;

type CleanFields<R extends string> =
    R extends `${infer F}PaginatedAndOrdered` ? F :
    R extends `${infer F}OrderedAndPaginated` ? F :
    R extends `${infer F}Paginated` ? F :
    R extends `${infer F}Ordered` ? F :
    R extends `${infer F}SkipDuplicates` ? F : R;

/**
 * Additional options accepted by repository methods.
 *
 * @template S Available keys in `selectModels`.
 * @template IM Available keys in `includeModels`.
 */
export type MethodOptions<S, IM extends PropertyKey = never> = {
    /** Prisma client or transaction to use for the operation. */
    db?: ClientOrTransaction;
    /**
     * Visibility mode for records with soft-delete.
     *
     * Only takes effect if `softRemovekName` is configured on the repository.
     *
     * - `"active"` — returns only non-deleted records (default).
     * - `"removed"` — returns only deleted records.
     * - `"all"` — returns all records, ignoring deletion status.
     */
    see?: SeeMode;
} & (
    [IM] extends [never]
        ? { 
            /** Select model to apply to the operation. Use `false` to return the full payload. */
            selectModel?: S | false; 
            /** Include model to apply to the operation. Cannot be used together with `selectModel`. */
            includeModel?: never;
          }
        : | { selectModel?: S | false; includeModel?: never }
          | { selectModel?: never; includeModel: IM }
);

/**
 * Version of `MethodOptions` derived directly from a configured `VSRepository` instance.
 *
 * @template TRepo Configured `VSRepository` instance (use `typeof myVSRepo`).
 *
 * @example
 * const userVSRepo = setupVSRepo<User, "user">()(config);
 * type Opts = MethodOptionsModel<typeof userVSRepo>;
 */
export type MethodOptionsModel<TRepo> =
    TRepo extends VSRepository<any, any, infer Config>
        ? MethodOptions<keyof ExtractSelectModels<Config> | false, keyof ExtractIncludeModels<Config>>
        : never;

type MethodFn<MethodName extends string, T, M extends Prisma.ModelName, R extends string, SelectModels, DefaultSelect extends keyof SelectModels | false, I, IncludeModels> = 
    <S extends keyof SelectModels | false = DefaultSelect, IM extends keyof IncludeModels = never>(
        ...args: [...ExtractFields<T, CleanFields<R>, I>, ...ExtraArgs<MethodName, R, I>, options?: MethodOptions<S, keyof IncludeModels> & ({ includeModel: IM } | { includeModel?: never })]
    ) => Promise<ResolveReturnType<MethodName, SelectedModel<M, S, SelectModels, IM, IncludeModels>>>;

type GetMappedMethod<K extends string, MethodConf> = 
    K extends `findBy${string}` ? (MethodConf extends { fbMode: 'one' } ? 'findByOne' : 'findByList') :
    K extends `findOneBy${string}` ? 'findOneBy' :
    K extends `existsBy${string}` ? 'existsBy' :
    K extends `existsWhere${string}` ? 'existsWhere' :
    K extends `findUniqueOrThrowBy${string}` ? 'findUniqueOrThrow' :
    K extends `findUniqueBy${string}` ? 'findUnique' :
    K extends `findFirstOrThrowBy${string}` | `findFirstOrThrow${string}` ? 'findFirstOrThrow' :
    K extends `findFirstBy${string}` | `findFirst${string}` ? 'findFirst' :
    K extends `findManyBy${string}` | `findMany${string}` ? 'findMany' :
    K extends `createManyAndReturn${string}` ? 'createManyAndReturn' :
    K extends `createMany${string}` ? 'createMany' :
    K extends `create${string}` ? 'create' :
    K extends `updateManyAndReturnBy${string}` ? 'updateManyAndReturnBy' :
    K extends `updateManyAndReturnWhere${string}` ? 'updateManyAndReturnWhere' :
    K extends `updateManyBy${string}` ? 'updateManyBy' :
    K extends `updateManyWhere${string}` ? 'updateManyWhere' :
    K extends `updateBy${string}` ? 'updateBy' :
    K extends `upsertBy${string}` ? 'upsertBy' :
    K extends `deleteManyBy${string}` ? 'deleteManyBy' :
    K extends `deleteManyWhere${string}` ? 'deleteManyWhere' :
    K extends `deleteBy${string}` ? 'deleteBy' :
    K extends `countWhere${string}` ? 'countWhere' :
    K extends `countBy${string}` | `count${string}` ? 'count' :
    K extends `findListWhere${string}` ? 'findListWhere' :
    K extends `findOneWhere${string}` ? 'findOneWhere' :
    K extends `findWhere${string}` ? 'findWhere' :
    K extends 'aggregate' ? 'aggregate' :
    K extends 'groupBy' ? 'groupBy' :
    never;

type ExtractPatternBase<K extends string> = 
    K extends `${string}By${infer R}` ? R :
    K extends `findFirstOrThrow${infer R}` ? R :
    K extends `findFirst${infer R}` ? R :
    K extends `findMany${infer R}` ? R :
    K extends `createManyAndReturn${infer R}` ? R :
    K extends `createMany${infer R}` ? R :
    K extends `create${infer R}` ? R :
    K extends `countWhere${infer R}` ? R :
    K extends `count${infer R}` ? R :
    K extends `findListWhere${infer R}` ? R :
    K extends `findOneWhere${infer R}` ? R :
    K extends `findWhere${infer R}` ? R :
    K extends `existsWhere${infer R}` ? R :
    K extends `updateManyWhere${infer R}` ? R :
    K extends `updateManyAndReturnWhere${infer R}` ? R :
    K extends `deleteManyWhere${infer R}` ? R : '';

type MethodFactory<T, M extends Prisma.ModelName, K extends string, SelectModels, DefaultSelect extends keyof SelectModels | false, I, MethodConf, IncludeModels> = 
    K extends `findWhere${string}`
        ? {
            /** @deprecated Use findOneWhere instead. */
            <S extends keyof SelectModels | false = DefaultSelect, IM extends keyof IncludeModels = never>(...args: [...ExtractFields<T, CleanFields<ExtractPatternBase<K>>, I>, ...ExtraArgs<GetMappedMethod<K, MethodConf>, ExtractPatternBase<K>, I>, options?: MethodOptions<S, keyof IncludeModels> & ({ includeModel: IM } | { includeModel?: never })]): Promise<ResolveReturnType<GetMappedMethod<K, MethodConf>, SelectedModel<M, S, SelectModels, IM, IncludeModels>>>;
          }
        : MethodFn<GetMappedMethod<K, MethodConf>, T, M, ExtractPatternBase<K>, SelectModels, DefaultSelect, I, IncludeModels>;

type ResolveSelectModel<MethodConf, GlobalConf, SelectModels> = 
    MethodConf extends { selectModel: infer S } ? (S extends false ? false : S extends keyof SelectModels ? S : never) : 
    GlobalConf extends { defaultSelectModel: infer D } ? (D extends keyof SelectModels ? D : never) : never;

type ExtractPkName<T, Config> = Config extends { pkName: infer PK } ? (PK extends keyof T ? PK : never) : never;
type ExtractSelectModels<Config> = Config extends { selectModels: infer SM } ? SM : {};
type ExtractIncludeModels<Config> = Config extends { includeModels: infer IM } ? IM : {};
type ExtractDefaultSelect<Config> = Config extends { defaultSelectModel: infer D } ? D : never;
type ExtractRelations<Config> = Config extends { relations: infer R } ? (R extends object ? R : {}) : {};
type ExtractSoftRemovekName<Config> = Config extends { softRemovekName: infer S } ? S : never;
type ExtractDefaultOrdenation<Config> = Config extends { defaultOrdenation: infer O } ? O : never;

type AggregateMethod<M extends Prisma.ModelName> = <A extends Prisma.TypeMap['model'][M]['operations']['aggregate']['args']>(
    prismaArgs: A, 
    options?: { db?: ClientOrTransaction }
) => Promise<Prisma.Result<PrismaDelegate<M>, A, 'aggregate'>>;

type GroupByMethod<M extends Prisma.ModelName> = <A extends Prisma.TypeMap['model'][M]['operations']['groupBy']['args']>(
    prismaArgs: A, 
    options?: { db?: ClientOrTransaction }
) => Promise<Prisma.Result<PrismaDelegate<M>, A, 'groupBy'>>;

type DynamicMethods<T, M extends Prisma.ModelName, Config, I> = Config extends { methods: infer Methods }
    ? {
          [K in keyof Methods as Methods[K] extends { map: true } ? K : never]: K extends string
              ? (Methods[K] extends { proxyTo: infer P extends string } ? P : K) extends infer ResolvedKey
                  ? ResolvedKey extends 'aggregate'
                      ? AggregateMethod<M>
                      : ResolvedKey extends 'groupBy'
                      ? GroupByMethod<M>
                      : ResolvedKey extends string
                      ? MethodFactory<T, M, ResolvedKey, ExtractSelectModels<Config>, ResolveSelectModel<Methods[K], Config, ExtractSelectModels<Config>>, I, Methods[K], ExtractIncludeModels<Config>>
                      : never
                  : never
              : never;
      }
    : {};

/**
 * Groups the main Prisma input types derived from a model.
 *
 * @template M Prisma model name.
 */
export type PrismaModelInputs<M extends Prisma.ModelName> = {
    /** Type of the `select` argument used in model queries. */
    select: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];
    /** Type of the `include` argument used in model queries. */
    include: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['include'];
    /** Type of the `data` used in `create`. */
    createInput: Prisma.TypeMap['model'][M]['operations']['create']['args']['data'];
    /** Type of the `data` used in `createMany`. */
    createManyInput: Prisma.TypeMap['model'][M]['operations']['createMany']['args']['data'];
    /** Type of the `data` used in `update`. */
    updateInput: Prisma.TypeMap['model'][M]['operations']['update']['args']['data'];
    /** Type of the `data` used in `updateMany`. */
    updateManyInput: Prisma.TypeMap['model'][M]['operations']['updateMany']['args']['data'];
    /** Type of the `where` used in model queries. */
    whereInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['where'];
    /** Type of the `orderBy` used in model queries. */
    orderByInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['orderBy'];
    /** Type of the cursor used in model queries. */
    cursorInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['cursor'];
    /** Type of the `create` payload used in `upsert`. */
    upsertCreateInput: Prisma.TypeMap['model'][M]['operations']['upsert']['args']['create'];
    /** Type of the `update` payload used in `upsert`. */
    upsertUpdateInput: Prisma.TypeMap['model'][M]['operations']['upsert']['args']['update'];
};

/**
 * Type of the `select` object of a Prisma model.
 */
export type SelectModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['select'];

/**
 * Map of named, reusable selects for a Prisma model.
 */
export type SelectModels<M extends Prisma.ModelName> = Record<string, SelectModel<M>>;

/**
 * Type of the `include` object of a Prisma model.
 */
export type IncludeModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['include'];

/**
 * Map of named, reusable includes for a Prisma model.
 */
export type IncludeModels<M extends Prisma.ModelName> = Record<string, IncludeModel<M>>;

/**
 * Type of the `where` object of a Prisma model.
 */
export type WhereModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['whereInput'];

/**
 * Type of the `orderBy` object of a Prisma model.
 */
export type OrdenationModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['orderByInput'];

/**
 * Pagination options with typed cursor for a Prisma model.
 */
export type PaginationModel<M extends Prisma.ModelName> = PaginationOptions<PrismaModelInputs<M>['cursorInput']>;

/**
 * Base payload used to create a record in the model's `save`/`upsert`.
 */
export type ModelUpsertInput<M extends Prisma.ModelName> = PrismaModelInputs<M>['upsertCreateInput'];

/**
 * Configuration for a dynamic method defined in `methods`.
 *
 * @template M Prisma model name.
 * @template SelectModels Map of select models available in the repository.
 */
export type MethodConfig<M extends Prisma.ModelName, SelectModels = any> = {
    /** Defines whether the method will be exposed on the repository. */
    readonly map: boolean;
    /** Overrides `defaultSelectModel` for this method only. */
    readonly selectModel?: string | false;
    /** Controls whether the method combines (`extending`) or overwrites (`overwrite`) the `requiredWhere`. */
    readonly whereType?: 'overwrite' | 'extending';
    /** Redirects the logic to another valid method pattern. */
    readonly proxyTo?: ValidMethodPatterns;
    /** Adds an extra `where` on top of `requiredWhere`. */
    readonly pushWhere?: WhereModel<M>;
    /** * Defines whether `findBy` returns a single item (`one`) or a list (`list`).
     * @deprecated Use `findOneBy` if you want to return a single result.
     */
    readonly fbMode?: 'one' | 'list';
    /** Injects a fixed ordering automatically into the query. */
    readonly injectOrdenation?: OrdenationModel<M>;
    /** Injects a fixed pagination automatically into the query. */
    readonly injectPagination?: PaginationModel<M>;
};

type BaseMethodConfig<TSelectKeys extends PropertyKey = string> = {
    /** Enables or disables the base method in the `build`. */
    active?: boolean;
    /** Default select model used by the base method. */
    defaultSelect?: TSelectKeys;
    /** Ignores the `requiredWhere`. */
    ignoreRequiredWhere?: boolean;
};

/**
 * Configuration applied during `.build(prisma, config?)`.
 *
 * @template TSelectKeys Valid keys of `selectModels`.
 */
export type BuildConfig<TSelectKeys extends PropertyKey = string> = {
    /**
     * Freezes the final repository object with `Object.freeze`.
     * @deprecated No longer has any practical effect in the next version — freeze will be always applied.
     */
    freeze?: boolean;
    /** Prints internal working logs to the console. */
    showWorking?: boolean;
    /** Customizes the behavior of the automatic base methods. */
    baseMethods?: {
        /** Configuration for the `get` method. */
        get?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `getOrThrow` method. */
        getOrThrow?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `getList` method (fetch by list of PKs). */
        getList?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `remove` method. */
        remove?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `save` method. */
        save?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `saveList` method (batch save via transaction). */
        saveList?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `patch` method. */
        patch?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `patchList` method (batch update via transaction). */
        patchList?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `merge` method. */
        merge?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `removeList` method (batch deletion). Does not accept select. */
        removeList?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
        /** Configuration for the `getAll` method (full listing). */
        getAll?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `total` method (count). Does not accept select. */
        total?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
        /** Configuration for the `has` method (existence check). Does not accept select. */
        has?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
        /** Configuration for the `softRemove` method. Only available if `softRemovekName` is configured. */
        softRemove?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `softRemoveList` method. Does not accept select. Only available if `softRemovekName` is configured. */
        softRemoveList?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
        /** Configuration for the `restore` method. Only available if `softRemovekName` is configured. */
        restore?: BaseMethodConfig<TSelectKeys>;
        /** Configuration for the `restoreList` method. Does not accept select. Only available if `softRemovekName` is configured. */
        restoreList?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
    };
};

type ResolveMethodDefaultSelect<Config, C, Method extends keyof NonNullable<BuildConfig['baseMethods']>, TSelects = ExtractSelectModels<Config>> =
    C extends { baseMethods?: { [_ in Method]?: { defaultSelect?: infer D } } }
        ? D extends keyof TSelects 
            ? D 
            : ExtractDefaultSelect<Config> extends keyof TSelects 
                ? ExtractDefaultSelect<Config> 
                : false
        : ExtractDefaultSelect<Config> extends keyof TSelects 
            ? ExtractDefaultSelect<Config> 
            : false;

type ResolveCurrentReturn<M extends Prisma.ModelName, Models, S, D, IM = never, Includes = {}> = 
    [IM] extends [never]
        ? [S] extends [false] 
            ? FullModelType<M> 
            : [S] extends [never] 
                ? ([D] extends [never] ? FullModelType<M> : SelectedModel<M, D, Models>)
                : SelectedModel<M, S, Models>
        : IM extends keyof Includes
            ? PrecomputedIncludes<M, Includes>[IM]
            : FullModelType<M>;

// ─── helpers reused within the mapped type ───────────────────────────────────
// ─── relation payload types ──────────────────────────────────────────────────

/**
 * Distributive version of `Omit`, preserving unions when removing properties.
 */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type ExtractUnionProp<T, K extends PropertyKey> = T extends any ? (K extends keyof T ? T[K] : never) : never;

type ExtractNestedCreateInput<M extends Prisma.ModelName, K extends PropertyKey> =
    NonNullable<ExtractUnionProp<PrismaModelInputs<M>['createInput'], K>> extends { create?: infer C }
        ? Exclude<C, any[]>
        : never;

type RelationPayload<TField, TRelationConfig, M extends Prisma.ModelName, K extends PropertyKey> = NonNullable<TField> extends any[]
    ? ExtractNestedCreateInput<M, K>[]
    : NonNullable<TField> extends object
      ? ExtractNestedCreateInput<M, K> | (TRelationConfig extends { mode: 'oto'; restriction: 'set' } | { mode: 'mto'; nullable: true } | { mode: 'mto'; nullAble: true } ? null : never)
      : never;

type TransformCreatePayload<U, T, M extends Prisma.ModelName, TRelations> =
    Omit<U, keyof TRelations> &
    {
        // Fields that are REQUIRED in this specific branch of the Prisma union
        [K in Extract<keyof TRelations, keyof U> as {} extends Pick<U, K> ? never : K]: 
            K extends keyof T ? RelationPayload<T[K], TRelations[K], M, K> : never;
    } &
    {
        // Fields that are OPTIONAL in this branch or do not originally belong to it
        [K in keyof TRelations as K extends keyof U ? ({} extends Pick<U, K> ? K : never) : K]?: 
            K extends keyof T ? RelationPayload<T[K], TRelations[K], M, K> : never;
    };

/**
 * Payload accepted by `save` when the repository has configured relations.
 */
type UpsertWithRelations<T, M extends Prisma.ModelName, TRelations> =
    ModelUpsertInput<M> extends infer U
        ? U extends any
            ? Simplify<TransformCreatePayload<U, T, M, TRelations>>
            : never
        : never;

type CleanNestedInput<T> = T extends any
    ? T extends { data: infer D }
        ? CleanNestedInput<Exclude<D, any[]>>
        : Omit<T, 'where' | 'data'>
    : never;

type ExtractNestedUpdateInput<M extends Prisma.ModelName, K extends PropertyKey> =
    NonNullable<ExtractUnionProp<PrismaModelInputs<M>['updateInput'], K>> extends { update?: infer U }
        ? CleanNestedInput<Exclude<U, any[]>>
        : never;

type RelationUpdatePayload<TField, TRelationConfig, M extends Prisma.ModelName, K extends PropertyKey> = NonNullable<TField> extends any[]
    ? ExtractNestedUpdateInput<M, K>[]
    : NonNullable<TField> extends object
      ? ExtractNestedUpdateInput<M, K> | (TRelationConfig extends { mode: 'oto'; restriction: 'set' } | { mode: 'mto'; nullable: true } | { mode: 'mto'; nullAble: true } ? null : never)
      : never;

/**
 * Payload accepted by `merge` when the repository has configured relations (uses update input).
 */
type UpdateWithRelations<T, M extends Prisma.ModelName, TRelations> =
    DistributiveOmit<PrismaModelInputs<M>['updateInput'], keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationUpdatePayload<T[K], TRelations[K], M, K>;
    };

/**
 * Payload accepted by `patch` and `patchList` when the repository has configured relations (uses create input).
 */
type PatchWithRelations<T, M extends Prisma.ModelName, TRelations> =
    DistributiveOmit<PrismaModelInputs<M>['updateInput'], keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationPayload<T[K], TRelations[K], M, K>;
    };

/**
 * Extracts the payload type of the `save` method from a configured VSRepository instance.
 */
export type SaveObject<TInput, TRepo> = 
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? (Config extends { relations: infer R } ? (R extends object ? R : {}) : {}) extends infer TRelations
            ? TInput extends infer U 
                ? U extends any 
                    ? Simplify<TransformCreatePayload<U, T, M, TRelations>>
                    : never
                : never
            : never
        : never;

/**
 * Extracts the payload type of the `patch` method from a configured VSRepository instance.
 */
export type PatchObject<TInput, TRepo> = 
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? (Config extends { relations: infer R } ? (R extends object ? R : {}) : {}) extends infer TRelations
            ? DistributiveOmit<TInput, keyof TRelations> & {
                  [K in Extract<keyof TRelations, keyof T>]?: RelationPayload<T[K], TRelations[K], M, K>;
              }
            : never
        : never;


type _Pk<T, Config> = WidenField<T[ExtractPkName<T, Config> extends keyof T ? ExtractPkName<T, Config> : never]>;
type _Ret<M extends Prisma.ModelName, TSelects, S, TDefault, IM = never, TIncludes = {}> = ResolveCurrentReturn<M, TSelects, S, TDefault, IM, TIncludes>;
type _DS<Config, C, Method extends keyof NonNullable<BuildConfig['baseMethods']>, TSelects = ExtractSelectModels<Config>> =
    ResolveMethodDefaultSelect<Config, C, Method, TSelects>;
type _Sel<Config> = ExtractSelectModels<Config>;
type _Inc<Config> = ExtractIncludeModels<Config>;
type _Def<Config> = ExtractDefaultSelect<Config>;
type _Rel<Config> = ExtractRelations<Config>;
type _Soft<Config> = ExtractSoftRemovekName<Config>;
type _DOrd<Config> = ExtractDefaultOrdenation<Config>;

// ─── refactored mapped type — optimized for the TS compiler ──────────────────

type AllBaseMethods<
    T,
    M extends Prisma.ModelName,
    Config,
    C extends BuildConfig<any> | undefined,
    TSelects  = _Sel<Config>,
    TDefault  = _Def<Config>,
    TPk       = ExtractPkName<T, Config>,
    TRelations = _Rel<Config>,
    TSoftKey  = _Soft<Config>,
    I         = PrismaModelInputs<M>,
    TDefaultOrdenation = _DOrd<Config>,
    TIncludes = _Inc<Config>
> = {
    /** Fetches a record by its primary key (PK). */
    get: <S extends keyof TSelects | false = _DS<Config, C, 'get', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes> | null>;

    /** Fetches a record by PK and throws `VSRepoRuntimeError` if not found. */
    getOrThrow: <S extends keyof TSelects | false = _DS<Config, C, 'getOrThrow', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>>;

    /** Fetches multiple records by a list of primary keys (PKs). */
    getList: <S extends keyof TSelects | false = _DS<Config, C, 'getList', TSelects>, IM extends keyof TIncludes = never>(
        pks: _Pk<T, Config>[], options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>[]>;

    /** Deletes a record identified by its primary key (PK). */
    remove: <S extends keyof TSelects | false = _DS<Config, C, 'remove', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>>;

    /** Inserts or updates (upsert) a record. */
    save: <S extends keyof TSelects | false = _DS<Config, C, 'save', TSelects>, IM extends keyof TIncludes = never>(
        obj: UpsertWithRelations<T, M, TRelations>, options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>>;

    /** Saves an array of objects in a single automatic transaction. */
    saveList: <S extends keyof TSelects | false = _DS<Config, C, 'saveList', TSelects>, IM extends keyof TIncludes = never>(
        objs: UpsertWithRelations<T, M, TRelations>[], options?: Omit<MethodOptions<S, keyof TIncludes>, 'db'> & ({ includeModel: IM } | { includeModel?: never }) & { db?: DbTransaction }
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>[]>;

    /** Partially updates (patch) an existing record by its primary key (PK). */
    patch: <S extends keyof TSelects | false = _DS<Config, C, 'patch', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, obj: PatchWithRelations<T, M, TRelations>, options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>>;

    /** Partially updates multiple records via `[pk, obj]` tuples in an automatic transaction. */
    patchList: <S extends keyof TSelects | false = _DS<Config, C, 'patchList', TSelects>, IM extends keyof TIncludes = never>(
        tuples: [pk: _Pk<T, Config>, obj: PatchWithRelations<T, M, TRelations>][], options?: Omit<MethodOptions<S, keyof TIncludes>, 'db'> & ({ includeModel: IM } | { includeModel?: never }) & { db?: DbTransaction }
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>[]>;

    /** Fetches a record by PK and deep-merges it with the provided object **in memory**. */
    merge: <S extends keyof TSelects | false = _DS<Config, C, 'merge', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, obj: UpdateWithRelations<T, M, TRelations>, options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes> | null>;

    /** Deletes multiple records by their primary keys. */
    removeList: (pks: _Pk<T, Config>[], options?: { db?: ClientOrTransaction }) => Promise<{ count: number }>;

    /** Fetches all records (respects `requiredWhere` when set). */
    getAll: <S extends keyof TSelects | false = _DS<Config, C, 'getAll', TSelects>, IM extends keyof TIncludes = never>(
        options?: MethodOptions<S, keyof TIncludes> & ({ includeModel: IM } | { includeModel?: never }) & {
            pagination?: PaginationOptions<I extends { cursorInput: infer Curs } ? Curs : unknown>;
            /**
             * Ordering to apply to the query.
             * When omitted and `defaultOrdenation` is configured on the repository,
             * the default ordering is applied automatically.
             */
            order?: I extends { orderByInput: infer OB } ? OB : OrderOptions;
        }
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>[]>;

    /** Returns the total number of records. */
    total: (options?: { db?: ClientOrTransaction; see?: SeeMode }) => Promise<number>;

    /** Checks whether a record exists by its primary key (PK). */
    has: (pk: _Pk<T, Config>, options?: { db?: ClientOrTransaction; see?: SeeMode }) => Promise<boolean>;

    /** Marks a record as deleted (soft-delete). */
    softRemove: <S extends keyof TSelects | false = _DS<Config, C, 'softRemove', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, options?: Omit<MethodOptions<S, keyof TIncludes>, 'see'> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>>;

    /** Marks multiple records as deleted (soft-delete) in batch. */
    softRemoveList: (pks: _Pk<T, Config>[], options?: { db?: ClientOrTransaction }) => Promise<{ count: number }>;

    /** Restores a record previously marked as deleted (soft-delete). */
    restore: <S extends keyof TSelects | false = _DS<Config, C, 'restore', TSelects>, IM extends keyof TIncludes = never>(
        pk: _Pk<T, Config>, options?: Omit<MethodOptions<S, keyof TIncludes>, 'see'> & ({ includeModel: IM } | { includeModel?: never })
    ) => Promise<_Ret<M, TSelects, S, TDefault, IM, TIncludes>>;

    /** Restores multiple records previously marked as deleted (soft-delete) in batch. */
    restoreList: (pks: _Pk<T, Config>[], options?: { db?: ClientOrTransaction }) => Promise<{ count: number }>;
};

type InjectedBaseMethods<
    T,
    M extends Prisma.ModelName,
    Config,
    C extends BuildConfig<any> | undefined,
    TSelects  = _Sel<Config>,
    TDefault  = _Def<Config>,
    TPk       = ExtractPkName<T, Config>,
    TRelations = _Rel<Config>,
    TSoftKey  = _Soft<Config>,
    I         = PrismaModelInputs<M>,
    TDefaultOrdenation = _DOrd<Config>,
    TIncludes = _Inc<Config>
> = Pick<
    AllBaseMethods<T, M, Config, C, TSelects, TDefault, TPk, TRelations, TSoftKey, I, TDefaultOrdenation, TIncludes>,
    | (C extends { baseMethods: { get:          { active: false } } } ? never : 'get')
    | (C extends { baseMethods: { getOrThrow:   { active: false } } } ? never : 'getOrThrow')
    | (C extends { baseMethods: { getList:      { active: false } } } ? never : 'getList')
    | (C extends { baseMethods: { remove:       { active: false } } } ? never : 'remove')
    | (C extends { baseMethods: { save:         { active: false } } } ? never : 'save')
    | (C extends { baseMethods: { saveList:     { active: false } } } ? never : 'saveList')
    | (C extends { baseMethods: { patch:        { active: false } } } ? never : 'patch')
    | (C extends { baseMethods: { patchList:    { active: false } } } ? never : 'patchList')
    | (C extends { baseMethods: { merge:        { active: false } } } ? never : 'merge')
    | (C extends { baseMethods: { removeList:   { active: false } } } ? never : 'removeList')
    | (C extends { baseMethods: { getAll:       { active: false } } } ? never : 'getAll')
    | (C extends { baseMethods: { total:        { active: false } } } ? never : 'total')
    | (C extends { baseMethods: { has:          { active: false } } } ? never : 'has')
    | ([TSoftKey] extends [never] ? never : C extends { baseMethods: { softRemove:     { active: false } } } ? never : 'softRemove')
    | ([TSoftKey] extends [never] ? never : C extends { baseMethods: { softRemoveList: { active: false } } } ? never : 'softRemoveList')
    | ([TSoftKey] extends [never] ? never : C extends { baseMethods: { restore:        { active: false } } } ? never : 'restore')
    | ([TSoftKey] extends [never] ? never : C extends { baseMethods: { restoreList:    { active: false } } } ? never : 'restoreList')
>;


/**
 * Relation configuration for One-to-Many or Many-to-Many.
 *
 * @template TItem Type of the related entity.
 */
export type ManyRelationConfig<TItem> = {
    /** Primary key of the related entity. */
    pk: keyof TItem;
    /** Relation type: `otm` (One-to-Many) or `mtm` (Many-to-Many). */
    mode: 'otm' | 'mtm';
    /** Mutation behavior: `set` (replaces all) or `add` (appends to existing). */
    restriction: 'set' | 'add';
};

/**
 * One-to-One relation configuration.
 *
 * @template TItem Type of the related entity.
 */
export type OneToOneRelationConfig<TItem> = {
    /** Primary key of the related entity. */
    pk: keyof TItem;
    /** Relation type: `oto` (One-to-One). */
    mode: 'oto';
    /** Allowed mutation behavior for saving. */
    restriction: 'set' | 'add';
};

/**
 * Many-to-One relation configuration.
 *
 * @template TItem Type of the related entity.
 */
export type ManyToOneRelationConfig<TItem> = {
    /** Primary key of the related entity. */
    pk: keyof TItem;
    /** Relation type: `mto` (Many-to-One). */
    mode: 'mto';
    /** Allowed mutation behavior for saving. */
    restriction: 'set' | 'add';
    /**
     * Enables the ability to unlink the relation, setting the foreign key to null.
     * @deprecated Use `nullable` (lowercase) instead of `nullAble`.
     */
    nullAble?: boolean;
    /** Enables the ability to unlink the relation, setting the foreign key to null. */
    nullable?: boolean;
};

/**
 * Automatically infers the possible relation configuration from a field.
 */
export type ExtractRelationConfig<TField> = NonNullable<TField> extends infer NonNull
    ? NonNull extends Date | Buffer | Uint8Array | Decimal | JsonValue ? never
    : NonNull extends any[] ? (NonNull[number] extends object ? ManyRelationConfig<NonNull[number]> : never)
    : NonNull extends object ? (OneToOneRelationConfig<NonNull> | ManyToOneRelationConfig<NonNull>)
    : never
    : never;

/**
 * Map of configurable relations for an entity type.
 */
export type RepositoryRelations<T> = {
    [K in keyof T as ExtractRelationConfig<T[K]> extends never ? never : K]?: ExtractRelationConfig<T[K]>;
};

type AnySelect<M extends Prisma.ModelName> = Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];

/**
 * Main configuration used in `setupVSRepo<T, M>()(config)`.
 *
 * @template T Type of the entity managed by the repository.
 * @template M Prisma model name.
 * @template SM Map of named select models.
 */
export type RepoConfig<T, M extends Prisma.ModelName, SM extends Record<string, AnySelect<M>> = Record<string, AnySelect<M>>> = {
    tableName: Uncapitalize<M>;
    pkName: keyof T;
    softRemovekName?: keyof T & string;
    selectModels?: SM;
    defaultSelectModel?: Extract<keyof SM, string>;
    includeModels?: IncludeModels<M>;
    requiredWhere?: WhereModel<M>;
    defaultOrdenation?: OrdenationModel<M>;
    relations?: RepositoryRelations<T>;
    methods?: Record<string, MethodConfig<M, SM>>;
};

/**
 * Final type returned by `.build(prisma)`.
 *
 * Combines dynamic methods, base methods, and custom extensions.
 */
type BuiltRepository<T extends object, M extends Prisma.ModelName, Config extends RepoConfig<T, M, any>, C extends BuildConfig<any> | undefined> = {
    /**
     * Extends the repository with custom methods without losing type inference.
     */
    extend<E>(extensionFunc: (repo: BuiltRepository<T, M, Config, C>) => E): BuiltRepository<T, M, Config, C> & E;

    /**
     * The Prisma Client instance passed to `build`.
     */
    readonly prisma: DbClient;
} & DynamicMethods<T, M, Config, PrismaModelInputs<M>> & InjectedBaseMethods<T, M, Config, C>;

/**
 * Typed repository factory based on the Prisma model configuration.
 */
export declare class VSRepository<T extends object, M extends Prisma.ModelName, const Config extends RepoConfig<T, M, any> = RepoConfig<T, M, any>> {
    /** Original configuration provided to `setupVSRepo`. */
    readonly config: Config;
    /**
     * Creates a configurable instance of `VSRepository`.
     */
    constructor(config: Config);
    /**
     * Builds the final repository with base and dynamic methods.
     */
    build<C extends BuildConfig<keyof ExtractSelectModels<Config>>>(prisma: DbClient, config?: C): BuiltRepository<T, M, Config, C>;
    vsrepocache: never;
}

/**
 * Infers the type of an already-configured repository from a `VSRepository` instance.
 *
 * Also allows manually providing the `BuildConfig` and extensions type.
 */
export type RepositoryOf<TRepo, C extends BuildConfig<any> | undefined = undefined, E = unknown> =
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? Simplify<BuiltRepository<T, M, Config, C> & E>
        : never;

/**
 * Utility type used to validate a repository configuration at compile time.
 */
export type ValidateRepoConfig<T extends object, M extends Prisma.ModelName, Config> = {
    /**
     * Name of the table mapped by Prisma (usually uncapitalized).
     */
    tableName: Uncapitalize<M>;

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
    softRemovekName?: keyof T & string;

    /**
     * Defines named and reusable data projections (selects).
     * Allows creating different views of the same entity (e.g., `public`, `minimal`, `internal`).
     */
    selectModels?: SelectModels<M>;

    /**
     * Defines which select (a key from `selectModels`) will be used automatically
     * when none is specified in the method call.
     * It is highly recommended to define it whenever `selectModels` are used.
     */
    defaultSelectModel?: string;

    /**
     * Defines named and reusable include projections.
     * Similar to selectModels, but resolves Prisma `include` clauses.
     */
    includeModels?: IncludeModels<M>;

    /**
     * Defines global filters that will be automatically applied to all repository queries.
     * Useful for tenant isolation (multi-tenancy) or base restrictions (e.g., `isActive: true`).
     */
    requiredWhere?: WhereModel<M>;

    /**
     * Default ordering automatically injected into all queries that accept `orderBy`,
     * unless the method already has `injectOrdenation` configured or uses the `Ordered` suffix.
     *
     * Useful for ensuring a consistent sort order across the repository without repeating
     * the `order` argument on every call.
     */
    defaultOrdenation?: OrdenationModel<M>;

    /**
     * Configures automatic relation management.
     * When configured, allows the `save`, `saveList`, `patch`, and `patchList` methods 
     * to automatically handle linking, creation, or cascading deletion of related records.
     */
    relations?: RepositoryRelations<T>;

    /**
     * Definition of dynamic repository methods.
     * Behaviors and return types are automatically inferred from the method's name 
     * (e.g., `findOneByEmail`, `findManyPaginated`) or proxied via the `proxyTo` property.
     */
    methods?: {
        [K in keyof (Config extends { methods: infer Meth } ? Meth : {})]: K extends string
            ? MethodConfig<M, Config extends { selectModels: infer SM } ? SM : any> & (K extends ValidMethodPatterns ? {} : { proxyTo: ValidMethodPatterns })
            : never;
    };
};

/**
 * Function to initialize and configure the `repository`.
 * The configuration passed here is what will be read when `.build()` is called.
 */
export declare function setupVSRepo<T extends object, M extends Prisma.ModelName>(): <
    const SM extends Record<string, SelectModel<M>>,
    const Config extends RepoConfig<T, M, SM>
>(
  config: Config & ValidateRepoConfig<T, M, Config>
) => VSRepository<T, M, Config>;
