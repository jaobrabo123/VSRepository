import { Prisma, PrismaClient } from '@generated/prisma/client';

/**
 * Primary Prisma client instance used to execute database operations.
 */
export type DbClient = PrismaClient;

/**
 * Prisma transaction client instance.
 * Used when operations need to be grouped within an interactive transaction.
 */
export type DbTransaction = Prisma.TransactionClient;

/**
 * Union of the default Prisma client and the transactional client.
 * Useful for functions that can run either independently or as part of a broader transaction.
 */
export type ClientOrTransaction = DbClient | DbTransaction;

/**
 * Literal types representing the library's internal error codes.
 */
export type VSRepoErrorType = 
    | 'VSREPO_CONFIG'
    | 'VSREPO_BUILD'
    | 'VSREPO_EXTEND'
    | 'VSREPO_RUNTIME';

/**
 * Base class for all errors thrown by the Virtual Schema Repository.
 */
export declare abstract class VSRepoError extends Error {
    /** Internal code used to identify the error category. */
    abstract readonly type: VSRepoErrorType;
    
    constructor(message: string, type: VSRepoErrorType);
}

/**
 * Thrown when an invalid configuration or setup inconsistency is detected
 * before or during repository initialization.
 */
export declare class VSRepoConfigError extends VSRepoError {
    readonly type: 'VSREPO_CONFIG';
    constructor(message: string);
}

/**
 * Thrown when the Prisma instance injection fails or when the repository
 * cannot be finalized through `.build()`.
 */
export declare class VSRepoBuildError extends VSRepoError {
    readonly type: 'VSREPO_BUILD';
    constructor(message: string);
}

/**
 * Thrown when an error occurs while injecting new methods into the
 * repository through `.extend()`.
 */
export declare class VSRepoExtendError extends VSRepoError {
    readonly type: 'VSREPO_EXTEND';
    constructor(message: string);
}

/**
 * Thrown when dynamic operations fail at runtime, such as when invalid
 * arguments are passed to methods.
 */
export declare class VSRepoRuntimeError extends VSRepoError {
    readonly type: 'VSREPO_RUNTIME';
    constructor(message: string);
}

/**
 * Represents the ordering structure for Prisma queries.
 */
type OrderPattern = {
    [key: string]:
        | 'asc'
        | 'desc'
        | { _count: 'asc' | 'desc' }
        | OrderPattern;
};

/**
 * Pagination configuration accepted by the dynamic repository methods.
 * @template TCursor - The type of the field used as the pagination cursor (usually ID or Date).
 */
export type PaginationOptions<TCursor = unknown> = {
    /** Number of records to skip. */
    skip?: number;
    /** Number of records to return. */
    take?: number;
    /** Cursor used for keyset pagination. Indicates where to start taking records. */
    cursor?: TCursor;
};

/**
 * Acceptable ordering format for dynamic methods.
 * Can be a single rule or an array of rules to resolve ties.
 */
export type OrderOptions = OrderPattern | OrderPattern[];

/**
 * The magic string patterns supported by the repository's dynamic method engine.
 * By following these patterns, the repository infers arguments and return types automatically.
 * @example
 * 'findUniqueByEmail'
 * 'findManyByStatusAndCreatedAtOrdered'
 * 'updateManyAndReturnByRole'
 */
type ValidMethodPatterns =
    | `existsBy${string}`
    | `findBy${string}` // <--- NOVO: Suporte ao findBy dinâmico
    | `findUniqueBy${string}`
    | `findFirstBy${string}`
    | `findFirst${string}`
    | `findManyBy${string}`
    | `findMany${string}`
    | `createManyAndReturn${string}`
    | `createMany${string}`
    | `create${string}`
    | `updateManyAndReturnBy${string}`
    | `updateManyBy${string}`
    | `updateBy${string}`
    | `upsertBy${string}`
    | `deleteManyBy${string}`
    | `deleteBy${string}`
    | `countBy${string}`
    | `count${string}`
    | `findWhere${string}`
    | `findListWhere${string}`;

type Split<S extends string, D extends string> = string extends S
    ? string[]
    : S extends ''
      ? []
      : S extends `${infer T}${D}${infer U}`
        ? [T, ...Split<U, D>]
        : [S];

/**
 * Supported field modifiers for dynamic `By` methods.
 * Appending these to a field name changes the resulting Prisma where clause.
 * @example 'findManyByAgeGreaterThan'
 * @example 'findManyByNameStartsWithInsensitive'
 */
type Modifiers =
    | 'NotStartsWith'
    | 'StartsWith'
    | 'NotEndsWith'
    | 'EndsWith'
    | 'NotContains'
    | 'Contains'
    | 'LessThanEqual'
    | 'LessThan'
    | 'GreaterThanEqual'
    | 'GreaterThan'
    | 'NotIn'
    | 'In'
    | 'Not';

type ExtractFieldName<S extends string, T> =
    Uncapitalize<S> extends keyof T
        ? Uncapitalize<S>
        : S extends `NotInsensitive${infer Rest}`
          ? ExtractFieldName<Rest, T>
          : S extends `Insensitive${infer Rest}`
            ? ExtractFieldName<Rest, T>
            : S extends `NotIn${infer Rest}`
              ? ExtractFieldName<Rest, T>
              : S extends `In${infer Rest}`
                ? ExtractFieldName<Rest, T>
                : S extends `Not${infer Rest}`
                  ? ExtractFieldName<Rest, T>
                  : S extends `GreaterThanEqual${infer Rest}`
                    ? ExtractFieldName<Rest, T>
                    : S extends `LessThanEqual${infer Rest}`
                      ? ExtractFieldName<Rest, T>
                      : S extends `${infer Rest}NotStartsWith`
                        ? ExtractFieldName<Rest, T>
                        : S extends `${infer Rest}NotEndsWith`
                          ? ExtractFieldName<Rest, T>
                          : S extends `${infer Rest}NotContains`
                            ? ExtractFieldName<Rest, T>
                            : S extends `${infer Rest}InInsensitive`
                              ? ExtractFieldName<Rest, T>
                              : S extends `${infer Rest}NotInsensitive`
                                ? ExtractFieldName<Rest, T>
                                : S extends `${infer Rest}ContainsInsensitive`
                                  ? ExtractFieldName<Rest, T>
                                  : S extends `${infer Rest}GreaterThanEqual`
                                    ? ExtractFieldName<Rest, T>
                                    : S extends `${infer Rest}LessThanEqual`
                                      ? ExtractFieldName<Rest, T>
                                      : S extends `${infer Rest}NotIn`
                                        ? ExtractFieldName<Rest, T>
                                        : S extends `${infer Rest}Insensitive`
                                          ? ExtractFieldName<Rest, T>
                                          : S extends `${Modifiers}${infer Rest}`
                                            ? ExtractFieldName<Rest, T>
                                            : S extends `${infer Rest}${Modifiers}`
                                              ? ExtractFieldName<Rest, T>
                                              : S;

type IsArrayFilter<S extends string> = S extends `${string}NotIn`
    ? true
    : S extends `${string}In`
      ? true
      : S extends `NotIn${infer Rest}`
        ? Rest extends `sensitive${string}`
            ? false
            : Rest extends ''
              ? false
              : true
        : S extends `In${infer Rest}`
          ? Rest extends `sensitive${string}`
              ? false
              : Rest extends ''
                ? false
                : true
          : false;

type GetFieldType<T, S extends string, I> = ExtractFieldName<S, T> extends infer FieldName
    ? FieldName extends keyof T
        ? IsArrayFilter<S> extends true
            ? T[FieldName][]
            : NonNullable<T[FieldName]> extends any[]
              ? I extends { whereInput: infer W }
                    ? FieldName extends keyof NonNullable<W>
                        ? NonNullable<W>[FieldName]
                        : T[FieldName]
                    : T[FieldName]
              : NonNullable<T[FieldName]> extends object
                ? I extends { whereInput: infer W }
                    ? FieldName extends keyof NonNullable<W>
                        ? NonNullable<W>[FieldName]
                        : T[FieldName]
                    : T[FieldName]
                : T[FieldName]
        : unknown
    : any;

type MapToContractTypes<T, Arr extends any[], I> = Arr extends [
    infer First extends string,
    ...infer Rest,
]
    ? [GetFieldType<T, First, I>, ...MapToContractTypes<T, Rest, I>]
    : [];

type ExtractAnds<T, S extends string, I> = MapToContractTypes<T, Split<S, 'And'>, I>;

type ExtractOrsTuple<T, Arr extends string[], I> = Arr extends [
    infer First extends string,
    ...infer Rest extends string[],
]
    ? [...ExtractAnds<T, First, I>, ...ExtractOrsTuple<T, Rest, I>]
    : [];

type ExtractFields<T, R extends string, I> = R extends ''
    ? []
    : ExtractOrsTuple<T, Split<R, 'Or'>, I>;

type ResolveReturnType<M extends string, TSelected> =
    M extends 'existsBy'
        ? boolean
        : M extends 'createMany' | 'updateManyBy' | 'deleteManyBy'
          ? { count: number }
          // NOVO: 'findByList' mapeado para array
          : M extends 'findMany' | 'createManyAndReturn' | 'updateManyAndReturnBy' | 'findListWhere' | 'findByList'
            ? TSelected[]
            // NOVO: 'findByOne' mapeado para objeto ou null
            : M extends 'findUnique' | 'findFirst' | 'findWhere' | 'findByOne'
              ? TSelected | null
              : M extends 'create' | 'updateBy' | 'upsertBy' | 'deleteBy'
                ? TSelected
                : M extends 'count'
                  ? number
                  : never;

type ExtraArgs<M extends string, R extends string, I> = [
    ...(
        M extends 'upsertBy'
            ? [
                  update: I extends { updateInput: infer U } ? U : unknown,
                  create: I extends { createInput: infer C } ? C : unknown,
              ]
            : M extends 'create'
              ? [data: I extends { createInput: infer C } ? C : unknown]
              : M extends 'updateBy'
                ? [data: I extends { updateInput: infer U } ? U : unknown]
                : M extends 'createMany' | 'createManyAndReturn'
                  ? [data: I extends { createManyInput: infer CM } ? CM : unknown]
                  : M extends 'updateManyBy' | 'updateManyAndReturnBy'
                    ? [data: I extends { updateManyInput: infer UM } ? UM : unknown]
                    : M extends 'findWhere' | 'findListWhere'
                      ? [where: I extends { whereInput: infer W } ? NonNullable<W> : unknown]
                      : []
    ),
    ...(
        R extends `${string}PaginatedAndOrdered`
            ? [
                  pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>,
                  order: I extends { orderByInput: infer OB } ? OB : OrderOptions,
              ]
            : R extends `${string}OrderedAndPaginated`
              ? [
                    order: I extends { orderByInput: infer OB } ? OB : OrderOptions,
                    pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>,
                ]
              : R extends `${string}Paginated`
                ? [pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>]
                : R extends `${string}Ordered`
                  ? [order: I extends { orderByInput: infer OB } ? OB : OrderOptions]
                  : []
    ),
];

type SelectedModel<T, S extends keyof SelectModels, SelectModels> = {
    [K in keyof T as K extends keyof SelectModels[S] ? K : never]: T[K];
};

type CleanFields<R extends string> =
    R extends `${infer F}PaginatedAndOrdered`
        ? F
        : R extends `${infer F}OrderedAndPaginated`
          ? F
          : R extends `${infer F}Paginated`
            ? F
            : R extends `${infer F}Ordered`
              ? F
              : R extends `${infer F}SkipDuplicates`
                ? F
                : R;

type MethodFn<
    M extends string,
    T,
    R extends string,
    SelectModels,
    DefaultSelect extends keyof SelectModels,
    I,
> = <S extends keyof SelectModels = DefaultSelect>(
    ...args: [
        ...ExtractFields<T, CleanFields<R>, I>,
        ...ExtraArgs<M, R, I>,
        options?: { selectModel?: S; db?: ClientOrTransaction },
    ]
) => Promise<ResolveReturnType<M, SelectedModel<T, S, SelectModels>>>;

type MethodFactory<
    T,
    K extends string,
    SelectModels,
    DefaultSelect extends keyof SelectModels,
    I,
    MethodConf // <--- NOVO: Recebe as configs do método para ler o fbMode
> = K extends `existsBy${infer R}`
    ? MethodFn<'existsBy', T, R, SelectModels, DefaultSelect, I>
    : K extends `findBy${infer R}` // <--- NOVO: Resolve o tipo de retorno baseado no fbMode
      ? MethodFn<MethodConf extends { fbMode: 'one' } ? 'findByOne' : 'findByList', T, R, SelectModels, DefaultSelect, I>
      : K extends `findUniqueBy${infer R}`
        ? MethodFn<'findUnique', T, R, SelectModels, DefaultSelect, I>
        : K extends `findFirstBy${infer R}`
          ? MethodFn<'findFirst', T, R, SelectModels, DefaultSelect, I>
          : K extends `findFirst${infer R}`
            ? MethodFn<'findFirst', T, R, SelectModels, DefaultSelect, I>
            : K extends `findManyBy${infer R}`
              ? MethodFn<'findMany', T, R, SelectModels, DefaultSelect, I>
              : K extends `findMany${infer R}`
                ? MethodFn<'findMany', T, R, SelectModels, DefaultSelect, I>
                : K extends `createManyAndReturn${infer R}`
                  ? MethodFn<'createManyAndReturn', T, R, SelectModels, DefaultSelect, I>
                  : K extends `createMany${infer R}`
                    ? MethodFn<'createMany', T, R, SelectModels, DefaultSelect, I>
                    : K extends `create${infer R}`
                      ? MethodFn<'create', T, R, SelectModels, DefaultSelect, I>
                      : K extends `updateManyAndReturnBy${infer R}`
                        ? MethodFn<'updateManyAndReturnBy', T, R, SelectModels, DefaultSelect, I>
                        : K extends `updateManyBy${infer R}`
                          ? MethodFn<'updateManyBy', T, R, SelectModels, DefaultSelect, I>
                          : K extends `updateBy${infer R}`
                            ? MethodFn<'updateBy', T, R, SelectModels, DefaultSelect, I>
                            : K extends `upsertBy${infer R}`
                              ? MethodFn<'upsertBy', T, R, SelectModels, DefaultSelect, I>
                              : K extends `deleteManyBy${infer R}`
                                ? MethodFn<'deleteManyBy', T, R, SelectModels, DefaultSelect, I>
                                : K extends `deleteBy${infer R}`
                                  ? MethodFn<'deleteBy', T, R, SelectModels, DefaultSelect, I>
                                  : K extends `countBy${infer R}`
                                    ? MethodFn<'count', T, R, SelectModels, DefaultSelect, I>
                                    : K extends `count${infer R}`
                                      ? MethodFn<'count', T, R, SelectModels, DefaultSelect, I>
                                      : K extends `findWhere${infer R}`
                                        ? MethodFn<'findWhere', T, R, SelectModels, DefaultSelect, I>
                                        : K extends `findListWhere${infer R}`
                                          ? MethodFn<'findListWhere', T, R, SelectModels, DefaultSelect, I>
                                          : never;

type ResolveSelectModel<MethodConf, GlobalConf, SelectModels> = MethodConf extends {
    selectModel: infer S;
}
    ? S extends keyof SelectModels
        ? S
        : GlobalConf extends { defaultSelectModel: infer D }
          ? D extends keyof SelectModels
              ? D
              : never
          : never
    : GlobalConf extends { defaultSelectModel: infer D }
      ? D extends keyof SelectModels
          ? D
          : never
      : never;

type ExtractPkName<T, Config> = Config extends { pkName: infer PK }
    ? PK extends keyof T
        ? PK
        : never
    : never;

type ExtractSelectModels<Config> = Config extends { selectModels: infer SM } ? SM : {};

type ExtractDefaultSelect<Config> = Config extends { defaultSelectModel: infer D } ? D : never;

type ExtractRelations<Config> = Config extends { relations: infer R }
    ? R extends object
        ? R
        : {}
    : {};

type DynamicMethods<T, Config, I> = Config extends { methods: infer Methods }
    ? {
          [K in keyof Methods as Methods[K] extends { map: true } ? K : never]: K extends string
              ? Methods[K] extends { proxyTo: infer P extends string }
                  ? MethodFactory<
                        T,
                        P,
                        ExtractSelectModels<Config>,
                        ResolveSelectModel<Methods[K], Config, ExtractSelectModels<Config>>,
                        I,
                        Methods[K] // <--- NOVO: Repassa o objeto de configuração do método
                    >
                  : MethodFactory<
                        T,
                        K,
                        ExtractSelectModels<Config>,
                        ResolveSelectModel<Methods[K], Config, ExtractSelectModels<Config>>,
                        I,
                        Methods[K] // <--- NOVO: Repassa o objeto de configuração do método
                    >
              : never;
      }
    : {};

/**
 * Helper type that extracts the exact Prisma arguments/inputs for a specific Model.
 * Provides type safety by linking generic repository methods directly to Prisma's generated types.
 * @template M - The Prisma model name (e.g., 'User', 'Post').
 */
export type PrismaModelInputs<M extends Prisma.ModelName> = {
    select: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];
    createInput: Prisma.TypeMap['model'][M]['operations']['create']['args']['data'];
    createManyInput: Prisma.TypeMap['model'][M]['operations']['createMany']['args']['data'];
    updateInput: Prisma.TypeMap['model'][M]['operations']['update']['args']['data'];
    updateManyInput: Prisma.TypeMap['model'][M]['operations']['updateMany']['args']['data'];
    whereInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['where'];
    orderByInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['orderBy'];
    cursorInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['cursor'];
    upsertCreateInput: Prisma.TypeMap['model'][M]['operations']['upsert']['args']['create'];
    upsertUpdateInput: Prisma.TypeMap['model'][M]['operations']['upsert']['args']['update'];
};

/**
 * Represents the native Prisma `select` configuration object for a specific model.
 * Defines which columns/relations should be returned from the database.
 */
export type SelectModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['select'];

/**
 * Represents the native Prisma `where` clause object for filtering a specific model.
 */
export type WhereModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['whereInput'];

/**
 * A dictionary of pre-defined selection models (views) for a repository.
 * Keys are alias names (e.g., 'basic', 'withRelations') and values are the Prisma `select` objects.
 */
export type SelectModels<M extends Prisma.ModelName> = Record<string, SelectModel<M>>;

/**
 * Valid data input to execute an `upsert` operation for a specific Prisma model.
 * Can be either the creation payload or the update payload.
 */
export type ModelUpsertInput<M extends Prisma.ModelName> =
    | PrismaModelInputs<M>['upsertCreateInput']
    | PrismaModelInputs<M>['upsertUpdateInput'];

/**
 * Configuration options for generating a custom dynamic repository method.
 * @template M - Prisma model name.
 * @template SelectModels - Dictionary of available selection models.
 */
export type MethodConfig<M extends Prisma.ModelName, SelectModels = any> = {
    /** Whether this method should be mapped and injected into the final repository instance. */
    readonly map: boolean;
    /** Enforce a specific return structure using a pre-defined select model key. */
    readonly selectModel?: keyof SelectModels;
    /** Determines if the dynamically pushed where clause overwrites or extends the user-provided one. */
    readonly whereType?: 'overwrite' | 'extending';
    /** * Allows renaming a magic pattern method for cleaner usage. 
     * @example { 'getByName': { map: true, proxyTo: 'findFirstByNameContainsInsensitive' } } 
     */
    readonly proxyTo?: ValidMethodPatterns;
    /** Hardcoded Prisma where clause that will always be injected when this method is called. */
    readonly pushWhere?: WhereModel<M>;
    /**
     * Defines the return type structure for the 'findBy' method.
     * 'one' resolves the Promise to `TModel | null`.
     * 'list' resolves the Promise to `TModel[]`.
     * Defaults to 'list' if omitted.
     */
    readonly fbMode?: 'one' | 'list';
};

type BaseMethodConfig<TSelectKeys extends PropertyKey = string> = {
    /** Toggle the injection of this base method (defaults to true). */
    active?: boolean;
    /** Default select model alias to be used when returning data from this method. */
    defaultSelect?: TSelectKeys;
    /** If true, bypasses the `requiredWhere` global config for this specific method. */
    ignoreRequiredWhere?: boolean;
};

/**
 * Final build configuration applied when instantiating the repository.
 * Adjusts how base methods (`get`, `remove`, `save`) behave.
 */
export type BuildConfig<TSelectKeys extends PropertyKey = string> = {
    /** If true, calls `Object.freeze` on the repository instance to prevent mutations. */
    freeze?: boolean;
    /** If true, enables debug logging indicating that operations are running. */
    showWorking?: boolean;
    /** Granular configuration for the standard base methods. */
    baseMethods?: {
        get?: BaseMethodConfig<TSelectKeys>;
        remove?: BaseMethodConfig<TSelectKeys>;
        save?: BaseMethodConfig<TSelectKeys>;
    };
};

type GetMethodConfig<C, Method extends 'get' | 'remove' | 'save'> = C extends {
    baseMethods: Record<Method, infer MConfig>;
}
    ? MConfig
    : {};

type ResolveMethodDefaultSelect<Config, C, Method extends 'get' | 'remove' | 'save'> =
    GetMethodConfig<C, Method> extends { defaultSelect: infer D }
        ? D extends keyof ExtractSelectModels<Config>
            ? D
            : ExtractDefaultSelect<Config>
        : ExtractDefaultSelect<Config>;

type ResolveCurrentReturn<T, Models, S, D> = S extends keyof Models
    ? SelectedModel<T, S, Models>
    : D extends keyof Models
      ? SelectedModel<T, D, Models>
      : T;

type RefineSaveResult<R, O> = {
    [K in keyof R]: K extends keyof O ? (O[K] extends null ? R[K] : NonNullable<R[K]>) : R[K];
};

type InjectedGet<T, Config, C extends BuildConfig<any> | undefined> = C extends {
    baseMethods: { get: { active: false } };
}
    ? {}
    : {
          /**
           * Fetches a single record by its primary key.
           * @param pk The primary key value (e.g., ID).
           * @param options Execution options, including the `selectModel` to format the return type.
           */
          get<S extends keyof ExtractSelectModels<Config> = ResolveMethodDefaultSelect<Config, C, 'get'>>(
              pk: T[ExtractPkName<T, Config>],
              options?: { selectModel?: S; db?: ClientOrTransaction },
          ): Promise<ResolveCurrentReturn<T, ExtractSelectModels<Config>, S, ExtractDefaultSelect<Config>>>;
      };

type InjectedRemove<T, Config, C extends BuildConfig<any> | undefined> = C extends {
    baseMethods: { remove: { active: false } };
}
    ? {}
    : {
          /**
           * Deletes a single record by its primary key.
           * @param pk The primary key value of the record to delete.
           * @param options Execution options, including the `selectModel` to format the return type of the deleted record.
           */
          remove<
              S extends keyof ExtractSelectModels<Config> = ResolveMethodDefaultSelect<Config, C, 'remove'>,
          >(
              pk: T[ExtractPkName<T, Config>],
              options?: { selectModel?: S; db?: ClientOrTransaction },
          ): Promise<ResolveCurrentReturn<T, ExtractSelectModels<Config>, S, ExtractDefaultSelect<Config>>>;
      };

type InjectedSave<T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined> = C extends {
    baseMethods: { save: { active: false } };
}
    ? {}
    : {
          /**
           * Performs an Upsert (Update or Insert) operation seamlessly.
           * Includes automatic handling of nested relations based on the repository config.
           * @param obj The entity payload. If the PK is present, it updates; otherwise, it creates.
           * @param options Execution options, including the `selectModel` to format the return type.
           */
          save<
              O extends UpsertWithRelations<T, M, ExtractRelations<Config>>,
              S extends keyof ExtractSelectModels<Config> = ResolveMethodDefaultSelect<Config, C, 'save'>,
          >(
              obj: O,
              options?: { selectModel?: S; db?: ClientOrTransaction },
          ): Promise<
              RefineSaveResult<
                  ResolveCurrentReturn<T, ExtractSelectModels<Config>, S, ExtractDefaultSelect<Config>>,
                  O
              >
          >;
      };

type DistributiveOmit<TObj, K extends keyof any> = TObj extends any ? Omit<TObj, K> : never;

type RelationPayload<TField, TRelationConfig> = NonNullable<TField> extends (infer U)[]
    ? Partial<U>[]
    : NonNullable<TField> extends object
      ? | Partial<NonNullable<TField>>
        | (TRelationConfig extends { mode: 'oto'; restriction: 'set' }
              ? null
              : TRelationConfig extends { mode: 'mto'; nullAble: true }
                ? null
                : never)
      : never;

/**
 * Extended Prisma upsert input that automatically includes support for the 
 * nested relations explicitly configured in the repository's setup.
 */
export type UpsertWithRelations<T, M extends Prisma.ModelName, TRelations> =
    DistributiveOmit<ModelUpsertInput<M>, keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationPayload<T[K], TRelations[K]>;
    };

type InjectedBaseMethods<
    T,
    M extends Prisma.ModelName,
    Config,
    C extends BuildConfig | undefined,
> = InjectedGet<T, Config, C> & InjectedRemove<T, Config, C> & InjectedSave<T, M, Config, C>;

type IsPrismaScalarObject<TType> = TType extends Date | Buffer | Uint8Array ? true : false;

/**
 * Extracts and maps the possible relation behaviors (e.g., One-to-Many, Many-to-Many) 
 * directly from the Prisma entity's TypeScript definitions.
 */
export type ExtractRelationConfig<TField> = NonNullable<TField> extends (infer U)[]
    ? IsPrismaScalarObject<U> extends true
        ? never
        : U extends object
          ? { pk: keyof U; mode: 'otm' | 'mtm'; restriction: 'set' | 'add' }
          : never
    : IsPrismaScalarObject<NonNullable<TField>> extends true
      ? never
      : NonNullable<TField> extends object
        ?
              | { pk: keyof NonNullable<TField>; mode: 'oto'; restriction: 'set' | 'add' }
              | {
                    pk: keyof NonNullable<TField>;
                    mode: 'mto';
                    restriction: 'set' | 'add';
                    nullAble?: boolean;
                }
        : never;

/**
 * A mapped type defining the allowed relation behaviors for the base entity `T`.
 * Enables precise control over how nested records are updated/created during a `save()` call.
 */
export type RepositoryRelations<T> = {
    [K in keyof T as ExtractRelationConfig<T[K]> extends never ? never : K]?: ExtractRelationConfig<T[K]>;
};

type AnySelect<M extends Prisma.ModelName> =
    Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];

/**
 * The core configuration object required to define a new VSRepository.
 * @template T - The mapped entity type.
 * @template M - The Prisma model name.
 * @template SM - Inferred type of the custom select models dictionary.
 */
export type RepoConfig<
    T,
    M extends Prisma.ModelName,
    SM extends Record<string, AnySelect<M>> = Record<string, AnySelect<M>>,
> = {
    /** The actual Prisma model name (lowercase). E.g., 'user'. */
    tableName: Uncapitalize<M>;
    /** The primary key field name of the entity. Usually 'id'. */
    pkName: keyof T;
    /** Named partial views of the model for specific returns. */
    selectModels?: SM;
    /** The fallback select model used if none is requested at execution time. */
    defaultSelectModel?: keyof SM;
    /** A hardcoded global where clause applied to every read/write operation (e.g., `{ deletedAt: null }`). */
    requiredWhere?: WhereModel<M>;
    /** Configuration mapping for cascading nested relations on `save()`. */
    relations?: RepositoryRelations<T>;
    /** Dictionary of dynamically generated methods mapped by their magic string names. */
    methods?: Record<string, MethodConfig<M, SM>>;
};

/**
 * The fully materialized repository instance. 
 * Combines standard base methods, dynamic magic methods, and custom extended methods.
 */
export type BuiltRepository<
    T extends object,
    M extends Prisma.ModelName,
    Config extends RepoConfig<T, M>,
    C extends BuildConfig<keyof ExtractSelectModels<Config>> | undefined,
> = {
    /**
     * Fluent API to attach custom methods to the repository instance.
     * Receives the current repository as a parameter, making it easy to build logic without `this` bindings.
     * @param extensionFunc A callback that receives the built repository and returns an object with custom methods.
     * @returns A newly typed repository containing all previous methods plus the custom extensions.
     */
    extend<E>(extensionFunc: (repo: BuiltRepository<T, M, Config, C>) => E): BuiltRepository<T, M, Config, C> & E;
} & DynamicMethods<T, Config, PrismaModelInputs<M>>
    & InjectedBaseMethods<T, M, Config, C>;

/**
 * The foundational class for the Virtual Schema Repository framework.
 * Do not instantiate directly; use `setupVSRepo()` instead for correct generic literal inference.
 */
export declare class VSRepository<
    T extends object,
    M extends Prisma.ModelName,
    const Config extends RepoConfig<T, M> = RepoConfig<T, M>,
> {
    readonly config: Config;

    constructor(config: Config);

    /**
     * Bootstraps and materializes the repository using a Prisma client instance.
     * @param prisma The active PrismaClient instance to attach to this repository.
     * @param config Optional behavior flags like `freeze` or overriding base method options.
     * @returns The fully typed repository ready for database interactions.
     */
    build<C extends BuildConfig<keyof ExtractSelectModels<Config>>>(
        prisma: DbClient,
        config?: C,
    ): BuiltRepository<T, M, Config, C>;

    /** Internal type marker. Never directly accessed. */
    vsrepocache: never;
}

/**
 * Validation mirror that forces `Config` to strictly adhere to the types derived 
 * from the Prisma model defined. Helps catch typos in field names during configuration.
 */
export type ValidateRepoConfig<T extends object, M extends Prisma.ModelName, Config> = {
    tableName: Uncapitalize<M>;
    pkName: keyof T;
    selectModels?: SelectModels<M>;
    defaultSelectModel?: Config extends { selectModels: infer SM }
        ? keyof SM extends never
            ? string
            : keyof SM
        : string;
    requiredWhere?: WhereModel<M>;
    relations?: RepositoryRelations<T>;
    methods?: {
        [K in keyof (Config extends { methods: infer Meth } ? Meth : {})]: K extends ValidMethodPatterns
            ? MethodConfig<M, Config extends { selectModels: infer SM } ? SM : any>
            : MethodConfig<M, Config extends { selectModels: infer SM } ? SM : any> & {
                  proxyTo: ValidMethodPatterns;
              };
    };
};

/**
 * High-order curried factory function used to declare repositories.
 * The currying mechanism (`()()`) forces TypeScript to infer the configuration object 
 * as `const` literals, which allows the dynamic method engine to type-check magic strings safely.
 * @template T - The Prisma generated entity type (e.g., `User`).
 * @template M - The literal string of the Prisma ModelName (e.g., `'User'`).
 * @example
 * const UserRepository = setupVSRepo<User, 'User'>()({
 * tableName: 'user',
 * pkName: 'id',
 * methods: {
 * findUniqueByEmail: { map: true }
 * }
 * });
 */
export declare function setupVSRepo<T extends object, M extends Prisma.ModelName>(): <
    const SM extends Record<string, SelectModel<M>>,
    const Config extends RepoConfig<T, M, SM>,
>(
    config: Config extends ValidateRepoConfig<T, M, Config> ? Config : ValidateRepoConfig<T, M, Config>,
) => VSRepository<T, M, Config>;
