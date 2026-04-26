import { Prisma, PrismaClient } from '@generated/prisma/client';

/**
 * Cliente Prisma principal utilizado pelo repositório.
 */
export type DbClient = PrismaClient;

/**
 * Cliente Prisma de transação utilizado pelo repositório.
 */
export type DbTransaction = Prisma.TransactionClient;

/**
 * União entre cliente Prisma padrão e cliente transacional.
 */
export type ClientOrTransaction = DbClient | DbTransaction;

type OrderPattern = {
    [key: string]:
        | 'asc'
        | 'desc'
        | { _count: 'asc' | 'desc' }
        | OrderPattern;
};

/**
 * Opções de paginação aceitas pelos métodos dinâmicos.
 */
export type PaginationOptions<TCursor = unknown> = {
    skip?: number;
    take?: number;
    cursor?: TCursor;
};

/**
 * Formato aceito para ordenação dos métodos dinâmicos.
 */
export type OrderOptions = OrderPattern | OrderPattern[];

type ValidMethodPatterns =
    | `existsBy${string}`
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
          : M extends 'findMany' | 'createManyAndReturn' | 'updateManyAndReturnBy' | 'findListWhere'
            ? TSelected[]
            : M extends 'findUnique' | 'findFirst' | 'findWhere'
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
    ...args: [...ExtractFields<T, CleanFields<R>, I>, ...ExtraArgs<M, R, I>, db?: ClientOrTransaction]
) => Promise<ResolveReturnType<M, SelectedModel<T, S, SelectModels>>>;

type MethodFactory<
    T,
    K extends string,
    SelectModels,
    DefaultSelect extends keyof SelectModels,
    I,
> = K extends `existsBy${infer R}`
    ? MethodFn<'existsBy', T, R, SelectModels, DefaultSelect, I>
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
                        I
                    >
                  : MethodFactory<
                        T,
                        K,
                        ExtractSelectModels<Config>,
                        ResolveSelectModel<Methods[K], Config, ExtractSelectModels<Config>>,
                        I
                    >
              : never;
      }
    : {};

/**
 * Mapeia os principais tipos de entrada do Prisma para um model específico.
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
 * Tipo `select` de um model Prisma.
 */
export type SelectModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['select'];

/**
 * Tipo `where` de um model Prisma.
 */
export type WhereModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['whereInput'];

/**
 * Coleção nomeada de modelos de seleção para um model Prisma.
 */
export type SelectModels<M extends Prisma.ModelName> = Record<string, SelectModel<M>>;

/**
 * Entrada válida para operações de upsert de um model Prisma.
 */
export type ModelUpsertInput<M extends Prisma.ModelName> =
    | PrismaModelInputs<M>['upsertCreateInput']
    | PrismaModelInputs<M>['upsertUpdateInput'];

/**
 * Configuração de um método customizado do repositório.
 */
export type MethodConfig<M extends Prisma.ModelName, SelectModels = any> = {
    readonly map: boolean;
    readonly selectModel?: keyof SelectModels;
    readonly whereType?: 'overwrite' | 'extending';
    readonly proxyTo?: ValidMethodPatterns;
    readonly pushWhere?: WhereModel<M>;
};

type BaseMethodConfig<TSelectKeys extends PropertyKey = string> = {
    active?: boolean;
    defaultSelect?: TSelectKeys;
    ignoreRequiredWhere?: boolean;
};

/**
 * Configuração de build da instância materializada do repositório.
 */
export type BuildConfig<TSelectKeys extends PropertyKey = string> = {
    freeze?: boolean;
    showWorking?: boolean;
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
 * Entrada de upsert estendida com suporte às relações configuradas do repositório.
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
 * Extrai a configuração possível de relacionamento a partir de um campo do model.
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
 * Mapa de relações configuráveis inferidas a partir de um tipo de entidade.
 */
export type RepositoryRelations<T> = {
    [K in keyof T as ExtractRelationConfig<T[K]> extends never ? never : K]?: ExtractRelationConfig<T[K]>;
};

type AnySelect<M extends Prisma.ModelName> =
    Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];

/**
 * Configuração estática usada para declarar um repositório.
 */
export type RepoConfig<
    T,
    M extends Prisma.ModelName,
    SM extends Record<string, AnySelect<M>> = Record<string, AnySelect<M>>,
> = {
    tableName: Uncapitalize<M>;
    pkName: keyof T;
    selectModels?: SM;
    defaultSelectModel?: keyof SM;
    requiredWhere?: WhereModel<M>;
    relations?: RepositoryRelations<T>;
    methods?: Record<string, MethodConfig<M, SM>>;
};

/**
 * Instância final do repositório, com métodos dinâmicos e base já materializados.
 */
export type BuiltRepository<
    T extends object,
    M extends Prisma.ModelName,
    Config extends RepoConfig<T, M>,
    C extends BuildConfig<keyof ExtractSelectModels<Config>> | undefined,
> = {
    /**
     * Estende o repositório instanciado com métodos e funções customizadas.
     * Recebe a instância atual como argumento para facilitar o acesso sem depender do `this`.
     */
    extend<E>(extensionFunc: (repo: BuiltRepository<T, M, Config, C>) => E): BuiltRepository<T, M, Config, C> & E;
} & DynamicMethods<T, Config, PrismaModelInputs<M>>
    & InjectedBaseMethods<T, M, Config, C>;

/**
 * Declaração principal da classe de repositório.
 */
export declare class VSRepository<
    T extends object,
    M extends Prisma.ModelName,
    const Config extends RepoConfig<T, M> = RepoConfig<T, M>,
> {
    readonly config: Config;

    constructor(config: Config);

    build<C extends BuildConfig<keyof ExtractSelectModels<Config>>>(
        prisma: DbClient,
        config?: C,
    ): BuiltRepository<T, M, Config, C>;

    vsrepocache: never;
}

/**
 * Espelho de validação que força o `Config` a respeitar as regras derivadas da própria configuração.
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
 * Factory currificada para instanciar um repositório preservando inferência literal da configuração.
 */
export declare function setupVSRepo<T extends object, M extends Prisma.ModelName>(): <
    const SM extends Record<string, SelectModel<M>>,
    const Config extends RepoConfig<T, M, SM>,
>(
    config: Config extends ValidateRepoConfig<T, M, Config> ? Config : ValidateRepoConfig<T, M, Config>,
) => VSRepository<T, M, Config>;
