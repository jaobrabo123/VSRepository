import { Prisma, PrismaClient } from '@vsrepo/prisma/types';

export type DbClient = PrismaClient;
export type DbTransaction = Prisma.TransactionClient;
export type ClientOrTransaction = DbClient | DbTransaction;

export * from './VSRepoError.js';

type OrderPattern = {
    [key: string]: 'asc' | 'desc' | { _count: 'asc' | 'desc' } | OrderPattern;
};

export type PaginationOptions<TCursor = unknown> = {
    skip?: number;
    take?: number;
    cursor?: TCursor;
};

export type OrderOptions = OrderPattern | OrderPattern[];

type ValidMethodPatterns =
    | `existsBy${string}` | `findBy${string}` | `findUniqueBy${string}`
    | `findFirstBy${string}` | `findFirst${string}` | `findManyBy${string}`
    | `findMany${string}` | `createManyAndReturn${string}` | `createMany${string}`
    | `create${string}` | `updateManyAndReturnBy${string}` | `updateManyBy${string}`
    | `updateBy${string}` | `upsertBy${string}` | `deleteManyBy${string}`
    | `deleteBy${string}` | `countBy${string}` | `count${string}`
    | `findWhere${string}` | `findListWhere${string}`;

// Modificadores consolidados em Unions para processamento rápido
type Modifiers =
    | 'NotStartsWith' | 'StartsWith' | 'NotEndsWith' | 'EndsWith'
    | 'NotContains' | 'Contains' | 'LessThanEqual' | 'LessThan'
    | 'GreaterThanEqual' | 'GreaterThan' | 'NotIn' | 'In' | 'Not'
    | 'Insensitive' | 'NotInsensitive' | 'InInsensitive' | 'ContainsInsensitive';

type StripModifier<S extends string> = S extends `${infer Base}${Modifiers}` ? Base : S;

type ExtractFieldName<S extends string> = Uncapitalize<StripModifier<S>>;

type IsArrayFilter<S extends string> = S extends `${string}${'NotIn' | 'In'}` ? true : false;

type ParseRelation<S extends string> =
    S extends `${infer Rel}Without${infer Rest}` ? [Uncapitalize<Rel>, 'isNot', Rest] :
    S extends `${infer Rel}With${infer Rest}` ? [Uncapitalize<Rel>, 'is', Rest] :
    S extends `${infer Rel}Some${infer Rest}` ? [Uncapitalize<Rel>, 'some', Rest] :
    S extends `${infer Rel}Every${infer Rest}` ? [Uncapitalize<Rel>, 'every', Rest] :
    S extends `${infer Rel}None${infer Rest}` ? [Uncapitalize<Rel>, 'none', Rest] : null;

type GetFieldType<T, S extends string, I> = ExtractFieldName<S> extends infer FieldName
    ? FieldName extends keyof T
        ? IsArrayFilter<S> extends true
            ? T[FieldName][]
            : NonNullable<T[FieldName]> extends object | any[]
              ? I extends { whereInput: infer W }
                  ? FieldName extends keyof NonNullable<W> ? NonNullable<W>[FieldName] : T[FieldName]
                  : T[FieldName]
              : T[FieldName]
        : ParseRelation<S> extends [infer Rel extends keyof T, any, infer Rest extends string]
            ? GetFieldType<NonNullable<T[Rel]> extends any[] ? NonNullable<T[Rel]>[number] : NonNullable<T[Rel]>, Rest, unknown>
            : unknown
    : unknown;

// Otimização: Validação O(1) com Union Strings
type NoArgModifiers = 'IsNull' | 'IsNotNull' | 'IsTrue' | 'IsFalse' | 'None' | 'Some' | 'Every' | 'Without';

type IsNoArgModifier<S extends string> = 
    S extends `${string}${'StartsWith' | 'EndsWith'}` ? false :
    S extends `${string}${NoArgModifiers | 'With'}` ? true : 
    false;

type MapToContractTypes<T, Arr extends string[], I> = 
    Arr extends [infer First extends string, ...infer Rest extends string[]]
        ? First extends '' 
            ? MapToContractTypes<T, Rest, I>
            : IsNoArgModifier<First> extends true
                ? MapToContractTypes<T, Rest, I>
                : [GetFieldType<T, First, I>, ...MapToContractTypes<T, Rest, I>]
        : [];

type HasMultipleANDs<S extends string> = S extends `${string}AND${string}AND${string}` ? true : false;

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
        ? First extends '' 
            ? FilterNonEmpty<Rest>
            : [First, ...FilterNonEmpty<Rest>]
        : [];

type ResolveReturnType<M extends string, TSelected> =
    M extends 'existsBy' ? boolean :
    M extends 'createMany' | 'updateManyBy' | 'deleteManyBy' ? { count: number } :
    M extends 'findMany' | 'createManyAndReturn' | 'updateManyAndReturnBy' | 'findListWhere' | 'findByList' ? TSelected[] :
    M extends 'findUnique' | 'findFirst' | 'findWhere' | 'findByOne' ? TSelected | null :
    M extends 'create' | 'updateBy' | 'upsertBy' | 'deleteBy' ? TSelected :
    M extends 'count' ? number : never;

type ExtraArgs<M extends string, R extends string, I> = [
    ...(M extends 'upsertBy' ? [update: I extends { updateInput: infer U } ? U : unknown, create: I extends { createInput: infer C } ? C : unknown]
      : M extends 'create' ? [data: I extends { createInput: infer C } ? C : unknown]
      : M extends 'updateBy' ? [data: I extends { updateInput: infer U } ? U : unknown]
      : M extends 'createMany' | 'createManyAndReturn' ? [data: I extends { createManyInput: infer CM } ? CM : unknown]
      : M extends 'updateManyBy' | 'updateManyAndReturnBy' ? [data: I extends { updateManyInput: infer UM } ? UM : unknown]
      : M extends 'findWhere' | 'findListWhere' ? [where: I extends { whereInput: infer W } ? NonNullable<W> : unknown]
      : []),
    ...(R extends `${string}PaginatedAndOrdered` ? [pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>, order: I extends { orderByInput: infer OB } ? OB : OrderOptions]
      : R extends `${string}OrderedAndPaginated` ? [order: I extends { orderByInput: infer OB } ? OB : OrderOptions, pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>]
      : R extends `${string}Paginated` ? [pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>]
      : R extends `${string}Ordered` ? [order: I extends { orderByInput: infer OB } ? OB : OrderOptions]
      : [])
];

// A resolução do modelo é feita instantaneamente pela Engine nativa do Prisma Client usando `Prisma.Result`.
type PrismaDelegate<M extends Prisma.ModelName> = Uncapitalize<M> extends keyof DbClient ? DbClient[Uncapitalize<M>] : never;

type FullModelType<M extends Prisma.ModelName> = 
  Prisma.Result<PrismaDelegate<M>, {}, 'findMany'> extends Array<infer U> ? U : never;

type SelectedModel<M extends Prisma.ModelName, S, SelectModels> = 
    [S] extends [false] 
        ? FullModelType<M>
        : [S] extends [never] 
            ? FullModelType<M> 
            : [S] extends [keyof SelectModels] 
                ? (Prisma.Result<PrismaDelegate<M>, { select: SelectModels[S] }, 'findMany'> extends Array<infer U> ? U : never)
                : FullModelType<M>;

type CleanFields<R extends string> =
    R extends `${infer F}PaginatedAndOrdered` ? F :
    R extends `${infer F}OrderedAndPaginated` ? F :
    R extends `${infer F}Paginated` ? F :
    R extends `${infer F}Ordered` ? F :
    R extends `${infer F}SkipDuplicates` ? F : R;

export type MethodOptions<S> = { selectModel?: S | false; db?: ClientOrTransaction };
export type MethodOptionsModel<T> = MethodOptions<keyof T | false>;

type MethodFn<MethodName extends string, T, M extends Prisma.ModelName, R extends string, SelectModels, DefaultSelect extends keyof SelectModels | false, I> = 
    <S extends keyof SelectModels | false = DefaultSelect>(...args: [...ExtractFields<T, CleanFields<R>, I>, ...ExtraArgs<MethodName, R, I>, options?: MethodOptions<S>]) => Promise<ResolveReturnType<MethodName, SelectedModel<M, S, SelectModels>>>;

// Otimização: Achatamento da inferência de padrões
type GetMappedMethod<K extends string, MethodConf> = 
    K extends `findBy${string}` ? (MethodConf extends { fbMode: 'one' } ? 'findByOne' : 'findByList') :
    K extends `existsBy${string}` ? 'existsBy' :
    K extends `findUniqueBy${string}` ? 'findUnique' :
    K extends `findFirstBy${string}` | `findFirst${string}` ? 'findFirst' :
    K extends `findManyBy${string}` | `findMany${string}` ? 'findMany' :
    K extends `createManyAndReturn${string}` ? 'createManyAndReturn' :
    K extends `createMany${string}` ? 'createMany' :
    K extends `create${string}` ? 'create' : // Precisa ficar depois dos createMany
    K extends `updateManyAndReturnBy${string}` ? 'updateManyAndReturnBy' :
    K extends `updateManyBy${string}` ? 'updateManyBy' :
    K extends `updateBy${string}` ? 'updateBy' : // Precisa ficar depois dos updateMany
    K extends `upsertBy${string}` ? 'upsertBy' :
    K extends `deleteManyBy${string}` ? 'deleteManyBy' :
    K extends `deleteBy${string}` ? 'deleteBy' : // Precisa ficar depois do deleteMany
    K extends `countBy${string}` | `count${string}` ? 'count' :
    K extends `findListWhere${string}` ? 'findListWhere' :
    K extends `findWhere${string}` ? 'findWhere' :
    never;

type ExtractPatternBase<K extends string> = 
    K extends `${string}By${infer R}` ? R :
    K extends `findFirst${infer R}` | `findMany${infer R}` | `createManyAndReturn${infer R}` | `createMany${infer R}` | `create${infer R}` | `count${infer R}` | `findWhere${infer R}` | `findListWhere${infer R}` ? R : '';

type MethodFactory<T, M extends Prisma.ModelName, K extends string, SelectModels, DefaultSelect extends keyof SelectModels | false, I, MethodConf> = 
    MethodFn<GetMappedMethod<K, MethodConf>, T, M, ExtractPatternBase<K>, SelectModels, DefaultSelect, I>;

type ResolveSelectModel<MethodConf, GlobalConf, SelectModels> = 
    MethodConf extends { selectModel: infer S } ? (S extends false ? false : S extends keyof SelectModels ? S : never) : 
    GlobalConf extends { defaultSelectModel: infer D } ? (D extends keyof SelectModels ? D : never) : never;

type ExtractPkName<T, Config> = Config extends { pkName: infer PK } ? (PK extends keyof T ? PK : never) : never;
type ExtractSelectModels<Config> = Config extends { selectModels: infer SM } ? SM : {};
type ExtractDefaultSelect<Config> = Config extends { defaultSelectModel: infer D } ? D : never;
type ExtractRelations<Config> = Config extends { relations: infer R } ? (R extends object ? R : {}) : {};

type DynamicMethods<T, M extends Prisma.ModelName, Config, I> = Config extends { methods: infer Methods }
    ? {
          [K in keyof Methods as Methods[K] extends { map: true } ? K : never]: K extends string
              ? MethodFactory<T, M, Methods[K] extends { proxyTo: infer P extends string } ? P : K, ExtractSelectModels<Config>, ResolveSelectModel<Methods[K], Config, ExtractSelectModels<Config>>, I, Methods[K]>
              : never;
      }
    : {};

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

export type SelectModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['select'];
export type SelectModels<M extends Prisma.ModelName> = Record<string, SelectModel<M>>;
export type WhereModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['whereInput'];
export type OrdenationModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['orderByInput'];
export type PaginationModel<M extends Prisma.ModelName> = PaginationOptions<PrismaModelInputs<M>['cursorInput']>;
export type ModelUpsertInput<M extends Prisma.ModelName> = PrismaModelInputs<M>['upsertCreateInput'];

export type MethodConfig<M extends Prisma.ModelName, SelectModels = any> = {
    readonly map: boolean;
    readonly selectModel?: keyof SelectModels | false;
    readonly whereType?: 'overwrite' | 'extending';
    readonly proxyTo?: ValidMethodPatterns;
    readonly pushWhere?: WhereModel<M>;
    readonly fbMode?: 'one' | 'list';
    readonly injectOrdenation?: OrdenationModel<M>;
    readonly injectPagination?: PaginationModel<M>;
};

type BaseMethodConfig<TSelectKeys extends PropertyKey = string> = {
    active?: boolean;
    defaultSelect?: TSelectKeys;
    ignoreRequiredWhere?: boolean;
};

export type BuildConfig<TSelectKeys extends PropertyKey = string> = {
    freeze?: boolean;
    showWorking?: boolean;
    baseMethods?: {
        get?: BaseMethodConfig<TSelectKeys>;
        remove?: BaseMethodConfig<TSelectKeys>;
        save?: BaseMethodConfig<TSelectKeys>;
    };
};

type ResolveMethodDefaultSelect<Config, C, Method extends 'get' | 'remove' | 'save', TSelects = ExtractSelectModels<Config>> =
    C extends { baseMethods?: { [_ in Method]?: { defaultSelect?: infer D } } }
        ? D extends keyof TSelects 
            ? D 
            : ExtractDefaultSelect<Config> extends keyof TSelects 
                ? ExtractDefaultSelect<Config> 
                : false
        : ExtractDefaultSelect<Config> extends keyof TSelects 
            ? ExtractDefaultSelect<Config> 
            : false;

type ResolveCurrentReturn<M extends Prisma.ModelName, Models, S, D> = 
    [S] extends [false] 
        ? FullModelType<M> 
        : [S] extends [never] 
            ? ([D] extends [never] ? FullModelType<M> : SelectedModel<M, D, Models>)
            : SelectedModel<M, S, Models>;

type RefineSaveResult<R, O> = { [K in keyof R]: K extends keyof O ? (O[K] extends null ? R[K] : NonNullable<R[K]>) : R[K]; };

type InjectedGet<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { get: { active: false } } } ? {} : {
    get<S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'get', TSelects>>(
        pk: T[TPk extends keyof T ? TPk : never], options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault> | null>;
};

type InjectedRemove<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { remove: { active: false } } } ? {} : {
    remove<S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'remove', TSelects>>(
        pk: T[TPk extends keyof T ? TPk : never], options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault>>;
};

export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
type ExtractUnionProp<T, K extends PropertyKey> = T extends any ? (K extends keyof T ? T[K] : never) : never;

type ExtractNestedCreateInput<M extends Prisma.ModelName, K extends PropertyKey> = 
    NonNullable<ExtractUnionProp<PrismaModelInputs<M>['createInput'], K>> extends { create?: infer C } 
        ? Exclude<C, any[]> 
        : never;

type RelationPayload<TField, TRelationConfig, M extends Prisma.ModelName, K extends PropertyKey> = NonNullable<TField> extends any[]
    ? (ExtractNestedCreateInput<M, K>)[]
    : NonNullable<TField> extends object
      ? ExtractNestedCreateInput<M, K> | (TRelationConfig extends { mode: 'oto'; restriction: 'set' } | { mode: 'mto'; nullAble: true } ? null : never)
      : never;

export type UpsertWithRelations<T, M extends Prisma.ModelName, TRelations> = 
    DistributiveOmit<ModelUpsertInput<M>, keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationPayload<T[K], TRelations[K], M, K>;
    };

type InjectedSave<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TRelations = ExtractRelations<Config>
> = C extends { baseMethods: { save: { active: false } } } ? {} : {
    save<
        O extends UpsertWithRelations<T, M, TRelations>, 
        S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'save', TSelects>
    >(
        obj: O & UpsertWithRelations<T, M, TRelations>, 
        options?: MethodOptions<S>
    ): Promise<RefineSaveResult<ResolveCurrentReturn<M, TSelects, S, TDefault>, O>>;
};

type InjectedBaseMethods<T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined> = 
    InjectedGet<T, M, Config, C> & 
    InjectedRemove<T, M, Config, C> & 
    InjectedSave<T, M, Config, C>;

export type ExtractRelationConfig<TField> = NonNullable<TField> extends infer NonNull
    ? NonNull extends Date | Buffer | Uint8Array ? never
    : NonNull extends any[] ? (NonNull[number] extends object ? { pk: keyof NonNull[number]; mode: 'otm' | 'mtm'; restriction: 'set' | 'add' } : never)
    : NonNull extends object ? ({ pk: keyof NonNull; mode: 'oto'; restriction: 'set' | 'add' } | { pk: keyof NonNull; mode: 'mto'; restriction: 'set' | 'add'; nullAble?: boolean })
    : never
    : never;

export type RepositoryRelations<T> = {
    [K in keyof T as ExtractRelationConfig<T[K]> extends never ? never : K]?: ExtractRelationConfig<T[K]>;
};

type AnySelect<M extends Prisma.ModelName> = Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];

export type RepoConfig<T, M extends Prisma.ModelName, SM extends Record<string, AnySelect<M>> = Record<string, AnySelect<M>>> = {
    tableName: Uncapitalize<M>;
    pkName: keyof T;
    selectModels?: SM;
    defaultSelectModel?: Extract<keyof SM, string>;
    requiredWhere?: WhereModel<M>;
    relations?: RepositoryRelations<T>;
    methods?: Record<string, MethodConfig<M, SM>>;
};

export type BuiltRepository<T extends object, M extends Prisma.ModelName, Config extends RepoConfig<T, M, any>, C extends BuildConfig<any> | undefined> = {
    extend<E>(extensionFunc: (repo: BuiltRepository<T, M, Config, C>) => E): BuiltRepository<T, M, Config, C> & E;
} & DynamicMethods<T, M, Config, PrismaModelInputs<M>> & InjectedBaseMethods<T, M, Config, C>;

export declare class VSRepository<T extends object, M extends Prisma.ModelName, const Config extends RepoConfig<T, M, any> = RepoConfig<T, M, any>> {
    readonly config: Config;
    constructor(config: Config);
    build<C extends BuildConfig<any>>(prisma: DbClient, config?: C): BuiltRepository<T, M, Config, C>;
    vsrepocache: never;
}

export type RepositoryOf<TRepo, C extends BuildConfig<any> | undefined = undefined, E = unknown> =
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? BuiltRepository<T, M, Config, C> & E
        : never;

export type ValidateRepoConfig<T extends object, M extends Prisma.ModelName, Config> = {
    tableName: Uncapitalize<M>;
    pkName: keyof T;
    selectModels?: SelectModels<M>;
    defaultSelectModel?: Config extends { selectModels: infer SM } ? (keyof SM extends never ? string : Extract<keyof SM, string>) : string;
    requiredWhere?: WhereModel<M>;
    relations?: RepositoryRelations<T>;
    methods?: {
        [K in keyof (Config extends { methods: infer Meth } ? Meth : {})]: K extends string
            ? HasMultipleANDs<K> extends true
                ? MethodConfig<M, Config extends { selectModels: infer SM } ? SM : any> & { proxyTo: ValidMethodPatterns }
                : MethodConfig<M, Config extends { selectModels: infer SM } ? SM : any> & (K extends ValidMethodPatterns ? {} : { proxyTo: ValidMethodPatterns })
            : never;
    };
};

export declare function setupVSRepo<T extends object, M extends Prisma.ModelName>(): <
    const SM extends Record<string, SelectModel<M>>,
    const Config extends RepoConfig<T, M, SM>
>(
  config: Config extends ValidateRepoConfig<T, M, Config> 
    ? Config 
    : ValidateRepoConfig<T, M, Config>
) => VSRepository<T, M, Config>;
