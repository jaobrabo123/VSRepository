/**
 * ! THIS FILE IS AUTO-GENERATED.
 * ! DO NOT EDIT MANUALLY.
 */
/* eslint-disable */
/* biome-ignore-all lint: generated file */
// @ts-nocheck

import { Prisma, PrismaClient } from '../prisma/client';
import { Decimal, JsonValue } from '@prisma/client/runtime/client';

type WidenField<T> = 
    T extends bigint ? bigint | number :
    T extends Date ? Date | string :
    T extends Decimal ? Decimal | string | number :
    T extends Array<infer U> ? WidenField<U>[] :
    T extends readonly [infer U, infer V] ? [WidenField<U>, WidenField<V>] :
    T;

/**
 * Instância completa do Prisma Client usada para construir repositories.
 */
export type DbClient = PrismaClient;

/**
 * Cliente transacional do Prisma retornado por `prisma.$transaction`.
 */
export type DbTransaction = Prisma.TransactionClient;

/**
 * Aceita tanto o cliente principal do Prisma quanto um cliente de transação.
 */
export type ClientOrTransaction = DbClient | DbTransaction;

export * from './VSRepoError.js';

type OrderPattern = {
    [key: string]: 'asc' | 'desc' | { _count: 'asc' | 'desc' } | OrderPattern;
};

/**
 * Opções de paginação aceitas pelos métodos com sufixo `Paginated`.
 *
 * @template TCursor Tipo do cursor usado pelo modelo Prisma.
 */
export type PaginationOptions<TCursor = unknown> = {
    /** Quantidade de registros a ignorar. */
    skip?: number;
    /** Quantidade máxima de registros retornados. */
    take?: number;
    /** Cursor tipado para paginação baseada em posição. */
    cursor?: TCursor;
};

/**
 * Ordenação aceita pelos métodos do repository.
 *
 * Pode ser uma única ordenação ou uma lista de ordenações encadeadas.
 */
export type OrderOptions = OrderPattern | OrderPattern[];

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
  // Expansão explícita para resolver o problema do 'Insensitive'
  S extends `${infer Base}NotStartsWithInsensitive` ? Base :
  S extends `${infer Base}StartsWithInsensitive` ? Base :
  S extends `${infer Base}NotEndsWithInsensitive` ? Base :
  S extends `${infer Base}EndsWithInsensitive` ? Base :
  S extends `${infer Base}NotContainsInsensitive` ? Base :
  S extends `${infer Base}ContainsInsensitive` ? Base :
  S extends `${infer Base}NotInInsensitive` ? Base :
  S extends `${infer Base}InInsensitive` ? Base :
  S extends `${infer Base}NotInsensitive` ? Base :
  // Modificadores normais
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
type GetOrderByInput<I> = I extends { orderByInput: infer OB } ? OB : OrderOptions;

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

type SelectedModel<M extends Prisma.ModelName, S, SelectModels> = 
    [S] extends [false] 
        ? FullModelType<M>
        : [S] extends [never] 
            ? FullModelType<M> 
            : [S] extends [keyof SelectModels] 
                ? PrecomputedSelects<M, SelectModels>[S]
                : FullModelType<M>;

type CleanFields<R extends string> =
    R extends `${infer F}PaginatedAndOrdered` ? F :
    R extends `${infer F}OrderedAndPaginated` ? F :
    R extends `${infer F}Paginated` ? F :
    R extends `${infer F}Ordered` ? F :
    R extends `${infer F}SkipDuplicates` ? F : R;

/**
 * Opções adicionais aceitas pelos métodos do repository.
 *
 * @template S Chaves disponíveis em `selectModels`.
 */
export type MethodOptions<S> = {
    /**
     * Select model a ser aplicado na operação.
     *
     * @note Use `false` para retornar o payload completo do Prisma, sem select.
     */
    selectModel?: S | false;
    /**
     * Cliente Prisma ou transação que deve executar a operação.
     */
    db?: ClientOrTransaction;
};

/**
 * Versão de `MethodOptions` derivada diretamente de uma instância configurada de `VSRepository`.
 *
 * @template TRepo Instância de `VSRepository` configurada (use `typeof meuVSRepo`).
 *
 * @example
 * const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()(config);
 * type Opts = MethodOptionsModel<typeof usuarioVSRepo>;
 */
export type MethodOptionsModel<TRepo> =
    TRepo extends VSRepository<any, any, infer Config>
        ? MethodOptions<keyof ExtractSelectModels<Config> | false>
        : never;

type MethodFn<MethodName extends string, T, M extends Prisma.ModelName, R extends string, SelectModels, DefaultSelect extends keyof SelectModels | false, I> = 
    <S extends keyof SelectModels | false = DefaultSelect>(...args: [...ExtractFields<T, CleanFields<R>, I>, ...ExtraArgs<MethodName, R, I>, options?: MethodOptions<S>]) => Promise<ResolveReturnType<MethodName, SelectedModel<M, S, SelectModels>>>;

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

type MethodFactory<T, M extends Prisma.ModelName, K extends string, SelectModels, DefaultSelect extends keyof SelectModels | false, I, MethodConf> = 
    K extends `findWhere${string}`
        ? {
            /** @deprecated Use findOneWhere em seu lugar. */
            <S extends keyof SelectModels | false = DefaultSelect>(...args: [...ExtractFields<T, CleanFields<ExtractPatternBase<K>>, I>, ...ExtraArgs<GetMappedMethod<K, MethodConf>, ExtractPatternBase<K>, I>, options?: MethodOptions<S>]): Promise<ResolveReturnType<GetMappedMethod<K, MethodConf>, SelectedModel<M, S, SelectModels>>>;
          }
        : MethodFn<GetMappedMethod<K, MethodConf>, T, M, ExtractPatternBase<K>, SelectModels, DefaultSelect, I>;

type ResolveSelectModel<MethodConf, GlobalConf, SelectModels> = 
    MethodConf extends { selectModel: infer S } ? (S extends false ? false : S extends keyof SelectModels ? S : never) : 
    GlobalConf extends { defaultSelectModel: infer D } ? (D extends keyof SelectModels ? D : never) : never;

type ExtractPkName<T, Config> = Config extends { pkName: infer PK } ? (PK extends keyof T ? PK : never) : never;
type ExtractSelectModels<Config> = Config extends { selectModels: infer SM } ? SM : {};
type ExtractDefaultSelect<Config> = Config extends { defaultSelectModel: infer D } ? D : never;
type ExtractRelations<Config> = Config extends { relations: infer R } ? (R extends object ? R : {}) : {};

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
                      ? MethodFactory<T, M, ResolvedKey, ExtractSelectModels<Config>, ResolveSelectModel<Methods[K], Config, ExtractSelectModels<Config>>, I, Methods[K]>
                      : never
                  : never
              : never;
      }
    : {};

/**
 * Agrupa os principais tipos de input do Prisma derivados de um modelo.
 *
 * @template M Nome do modelo Prisma.
 */
export type PrismaModelInputs<M extends Prisma.ModelName> = {
    /** Tipo do argumento `select` usado em consultas do modelo. */
    select: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];
    /** Tipo do `data` usado em `create`. */
    createInput: Prisma.TypeMap['model'][M]['operations']['create']['args']['data'];
    /** Tipo do `data` usado em `createMany`. */
    createManyInput: Prisma.TypeMap['model'][M]['operations']['createMany']['args']['data'];
    /** Tipo do `data` usado em `update`. */
    updateInput: Prisma.TypeMap['model'][M]['operations']['update']['args']['data'];
    /** Tipo do `data` usado em `updateMany`. */
    updateManyInput: Prisma.TypeMap['model'][M]['operations']['updateMany']['args']['data'];
    /** Tipo do `where` usado nas buscas do modelo. */
    whereInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['where'];
    /** Tipo do `orderBy` usado nas buscas do modelo. */
    orderByInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['orderBy'];
    /** Tipo do cursor usado nas buscas do modelo. */
    cursorInput: Prisma.TypeMap['model'][M]['operations']['findMany']['args']['cursor'];
    /** Tipo do payload `create` usado em `upsert`. */
    upsertCreateInput: Prisma.TypeMap['model'][M]['operations']['upsert']['args']['create'];
    /** Tipo do payload `update` usado em `upsert`. */
    upsertUpdateInput: Prisma.TypeMap['model'][M]['operations']['upsert']['args']['update'];
};

/**
 * Tipo do objeto `select` de um modelo Prisma.
 */
export type SelectModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['select'];

/**
 * Mapa de selects nomeados e reutilizáveis para um modelo Prisma.
 */
export type SelectModels<M extends Prisma.ModelName> = Record<string, SelectModel<M>>;

/**
 * Tipo do objeto `where` de um modelo Prisma.
 */
export type WhereModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['whereInput'];

/**
 * Tipo do objeto `orderBy` de um modelo Prisma.
 */
export type OrdenationModel<M extends Prisma.ModelName> = PrismaModelInputs<M>['orderByInput'];

/**
 * Opções de paginação com cursor tipado para um modelo Prisma.
 */
export type PaginationModel<M extends Prisma.ModelName> = PaginationOptions<PrismaModelInputs<M>['cursorInput']>;

/**
 * Payload base usado para criar um registro no `save`/`upsert` do modelo.
 */
export type ModelUpsertInput<M extends Prisma.ModelName> = PrismaModelInputs<M>['upsertCreateInput'];

/**
 * Configuração de um método dinâmico definido em `methods`.
 *
 * @template M Nome do modelo Prisma.
 * @template SelectModels Mapa de select models disponíveis no repository.
 */
export type MethodConfig<M extends Prisma.ModelName, SelectModels = any> = {
    /** Define se o método será exposto no repository. */
    readonly map: boolean;
    /** Sobrescreve o `defaultSelectModel` apenas para este método. */
    readonly selectModel?: string | false;
    /** Controla se o método combina (`extending`) ou sobrescreve (`overwrite`) o `requiredWhere`. */
    readonly whereType?: 'overwrite' | 'extending';
    /** Redireciona a lógica para outro padrão de método válido. */
    readonly proxyTo?: ValidMethodPatterns;
    /** Adiciona um `where` extra além do `requiredWhere`. */
    readonly pushWhere?: WhereModel<M>;
    /** 
     * Define se `findBy` retorna um item (`one`) ou uma lista (`list`).
     * @deprecated Use findOneBy se só quiser retornar um.
     */
    readonly fbMode?: 'one' | 'list';
    /** Injeta uma ordenação fixa automaticamente na query. */
    readonly injectOrdenation?: OrdenationModel<M>;
    /** Injeta uma paginação fixa automaticamente na query. */
    readonly injectPagination?: PaginationModel<M>;
};

type BaseMethodConfig<TSelectKeys extends PropertyKey = string> = {
    /** Ativa ou desativa o método base no `build`. */
    active?: boolean;
    /** Select model padrão usado pelo método base. */
    defaultSelect?: TSelectKeys;
    /** Ignora o `requiredWhere`. */
    ignoreRequiredWhere?: boolean;
};

/**
 * Configuração aplicada durante o `.build(prisma, config?)`.
 *
 * @template TSelectKeys Chaves válidas de `selectModels`.
 */
export type BuildConfig<TSelectKeys extends PropertyKey = string> = {
    /** Congela o objeto final do repository. */
    freeze?: boolean;
    /** Exibe logs internos de funcionamento no console. */
    showWorking?: boolean;
    /** Personaliza o comportamento dos métodos base automáticos. */
    baseMethods?: {
        /** Configuração do método `get`. */
        get?: BaseMethodConfig<TSelectKeys>;
        /** Configuração do método `getOrThrow`. */
        getOrThrow?: BaseMethodConfig<TSelectKeys>;
        /** Configuração do método `remove`. */
        remove?: BaseMethodConfig<TSelectKeys>;
        /** Configuração do método `save`. */
        save?: BaseMethodConfig<TSelectKeys>;
        /** Configuração do método `patch`. */
        patch?: BaseMethodConfig<TSelectKeys>;
        /** Configuração do método `removeList` (exclusão em lote). Não aceita select. */
        removeList?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
        /** Configuração do método `getAll` (listagem total). */
        getAll?: BaseMethodConfig<TSelectKeys>;
        /** Configuração do método `total` (contagem). Não aceita select. */
        total?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
        /** Configuração do método `has` (verificação de existência). Não aceita select. */
        has?: Omit<BaseMethodConfig<TSelectKeys>, 'defaultSelect'>;
    };
};

type ResolveMethodDefaultSelect<Config, C, Method extends 'get' | 'getOrThrow' | 'remove' | 'save' | 'getAll' | 'patch', TSelects = ExtractSelectModels<Config>> =
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

type InjectedGet<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { get: { active: false } } } ? {} : {
    /**
     * Busca um registro pela chave primária (PK).
     * @param pk Chave primária do registro.
     * @param options Opções adicionais (por exemplo `selectModel` ou `db`).
     * @returns O registro selecionado ou `null` se não encontrado.
     */
    get<S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'get', TSelects>>(
        pk: WidenField<T[TPk extends keyof T ? TPk : never]>, options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault> | null>;
};

type InjectedGetOrThrow<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { getOrThrow: { active: false } } } ? {} : {
    /**
     * Busca um registro pela chave primária (PK) e lança erro se não encontrado.
     * @param pk Chave primária do registro.
     * @param options Opções adicionais (por exemplo `selectModel` ou `db`).
     * @returns O registro selecionado.
     */
    getOrThrow<S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'getOrThrow', TSelects>>(
        pk: WidenField<T[TPk extends keyof T ? TPk : never]>, options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault>>;
};

type InjectedRemove<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { remove: { active: false } } } ? {} : {
    /**
     * Remove um registro identificado pela chave primária (PK).
     * @param pk Chave primária do registro a ser removido.
     * @param options Opções adicionais (por exemplo `selectModel` ou `db`).
     * @returns O registro removido.
     */
    remove<S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'remove', TSelects>>(
        pk: WidenField<T[TPk extends keyof T ? TPk : never]>, options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault>>;
};

/**
 * Versão distributiva de `Omit`, preservando unions ao remover propriedades.
 */
type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;
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

/**
 * Payload aceito pelo `save` quando o repository possui relações configuradas.
 *
 * Substitui os campos relacionais pelo formato compatível com os modos
 * configurados em `relations`.
 */
type UpsertWithRelations<T, M extends Prisma.ModelName, TRelations> = 
    DistributiveOmit<ModelUpsertInput<M>, keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationPayload<T[K], TRelations[K], M, K>;
    };

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
    ? (ExtractNestedUpdateInput<M, K>)[]
    : NonNullable<TField> extends object
      ? ExtractNestedUpdateInput<M, K> | (TRelationConfig extends { mode: 'oto'; restriction: 'set' } | { mode: 'mto'; nullAble: true } ? null : never)
      : never;

/**
 * Payload aceito pelo `patch` quando o repository possui relações configuradas.
 *
 * Substitui os campos relacionais pelo formato compatível com os modos
 * configurados em `relations` para fluxos de Update.
 */
type UpdateWithRelations<T, M extends Prisma.ModelName, TRelations> = 
    DistributiveOmit<PrismaModelInputs<M>['updateInput'], keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationUpdatePayload<T[K], TRelations[K], M, K>;
    };

/**
 * Extrai o tipo de payload do método `save` a partir de uma instância de VSRepository configurada.
 */
export type SaveObject<TInput, TRepo> = 
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? (Config extends { relations: infer R } ? (R extends object ? R : {}) : {}) extends infer TRelations
            ? DistributiveOmit<TInput, keyof TRelations> & {
                  [K in Extract<keyof TRelations, keyof T>]?: RelationPayload<T[K], TRelations[K], M, K>;
              }
            : never
        : never;

/**
 * Extrai o tipo de payload do método `patch` a partir de uma instância de VSRepository configurada.
 */
export type PatchObject<TInput, TRepo> = 
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? (Config extends { relations: infer R } ? (R extends object ? R : {}) : {}) extends infer TRelations
            ? DistributiveOmit<TInput, keyof TRelations> & {
                  [K in Extract<keyof TRelations, keyof T>]?: RelationUpdatePayload<T[K], TRelations[K], M, K>;
              }
            : never
        : never;

type InjectedSave<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TRelations = ExtractRelations<Config>
> = C extends { baseMethods: { save: { active: false } } } ? {} : {
    /**
     * Insere ou atualiza (save/upsert) um registro, aceita os campos de relações definidas nas `relations`.
     * @param obj Payload para criação/atualização.
     * @param options Opções adicionais (por exemplo `selectModel` ou `db`).
     * @returns O registro salvo com tipos refinados conforme a entrada.
     */
    save<
        O,
        S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'save', TSelects>
    >(
        obj: O & UpsertWithRelations<T, M, TRelations>,
        options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault>>;
};

type InjectedPatch<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    TPk = ExtractPkName<T, Config>,
    TRelations = ExtractRelations<Config>
> = C extends { baseMethods: { patch: { active: false } } } ? {} : {
    /**
     * Atualiza parcialmente (patch) um registro existente pela chave primária (PK), aceita os campos de relações definidas nas `relations`.
     * @param pk Chave primária do registro.
     * @param obj Objeto parcial com os campos a atualizar.
     * @param options Opções adicionais (por exemplo `selectModel` ou `db`).
     * @returns O registro atualizado refinado conforme a entrada.
     */
    patch<
        O,
        S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'patch', TSelects>
    >(
        pk: WidenField<T[TPk extends keyof T ? TPk : never]>,
        obj: O & UpdateWithRelations<T, M, TRelations>,
        options?: MethodOptions<S>
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault>>;
};

type InjectedRemoveList<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { removeList: { active: false } } } ? {} : {
    /**
     * Remove múltiplos registros pelas suas chaves primárias.
     * @param pks Lista de chaves primárias a remover.
     * @param options Opções adicionais (por exemplo `db`).
     * @returns Objeto com a contagem de registros removidos.
     */
    removeList(
        pks: WidenField<T[TPk extends keyof T ? TPk : never]>[], 
        options?: { db?: ClientOrTransaction }
    ): Promise<{ count: number }>;
};

type InjectedGetAll<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TSelects = ExtractSelectModels<Config>,
    TDefault = ExtractDefaultSelect<Config>,
    I = PrismaModelInputs<M>
> = C extends { baseMethods: { getAll: { active: false } } } ? {} : {
    /**
     * Busca todos os registros (respeita `requiredWhere` quando aplicado).
     * @param options Opções adicionais, incluindo paginação, ordenação e `db`/`selectModel`.
     * @returns Lista dos registros encontrados`.
     */
    getAll<S extends keyof TSelects | false = ResolveMethodDefaultSelect<Config, C, 'getAll', TSelects>>(
        options?: MethodOptions<S> & { 
            pagination?: PaginationOptions<I extends { cursorInput: infer Curs } ? Curs : unknown>;
            order?: I extends { orderByInput: infer OB } ? OB : OrderOptions;
        }
    ): Promise<ResolveCurrentReturn<M, TSelects, S, TDefault>[]>;
};

type InjectedTotal<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined
> = C extends { baseMethods: { total: { active: false } } } ? {} : {
    /**
     * Retorna a quantidade total de registros, respeitando `requiredWhere` quando aplicado.
     * @param options Opções adicionais (por exemplo `db`).
     * @returns Número total de registros.
     */
    total(options?: { db?: ClientOrTransaction }): Promise<number>;
};

type InjectedHas<
    T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined,
    TPk = ExtractPkName<T, Config>
> = C extends { baseMethods: { has: { active: false } } } ? {} : {
    /**
     * Verifica se um registro existe pela chave primária (PK).
     * @param pk Chave primária a verificar.
     * @param options Opções adicionais (por exemplo `db`).
     * @returns `true` se existir, caso contrário `false`.
     */
    has(
        pk: WidenField<T[TPk extends keyof T ? TPk : never]>, 
        options?: { db?: ClientOrTransaction }
    ): Promise<boolean>;
};

type InjectedBaseMethods<T, M extends Prisma.ModelName, Config, C extends BuildConfig<any> | undefined> = 
    InjectedGet<T, M, Config, C> & 
    InjectedGetOrThrow<T, M, Config, C> & 
    InjectedRemove<T, M, Config, C> & 
    InjectedSave<T, M, Config, C> &
    InjectedPatch<T, M, Config, C> &
    InjectedRemoveList<T, M, Config, C> &
    InjectedGetAll<T, M, Config, C> &
    InjectedTotal<T, M, Config, C> &
    InjectedHas<T, M, Config, C>;

/**
 * Configuração de relação para One-to-Many ou Many-to-Many.
 *
 * @template TItem O tipo da entidade relacionada.
 */
export type ManyRelationConfig<TItem> = {
    /** A chave primária (Primary Key) do entidade relacionada. */
    pk: keyof TItem;
    /** Tipo de relação: `otm` (One-to-Many) ou `mtm` (Many-to-Many). */
    mode: 'otm' | 'mtm';
    /** Comportamento de mutação: `set` (substitui tudo) ou `add` (adiciona aos existentes). */
    restriction: 'set' | 'add';
};

/**
 * Configuração de relação One-to-One.
 *
 * @template TItem O tipo da entidade relacionada.
 */
export type OneToOneRelationConfig<TItem> = {
    /** A chave primária (Primary Key) do entidade relacionada. */
    pk: keyof TItem;
    /** Tipo de relação: `oto` (One-to-One). */
    mode: 'oto';
    /** Comportamento de mutação permitido para salvar. */
    restriction: 'set' | 'add';
};

/**
 * Configuração de relação Many-to-One.
 *
 * @template TItem O tipo da entidade relacionada.
 */
export type ManyToOneRelationConfig<TItem> = {
    /** A chave primária (Primary Key) da entidade relacionada. */
    pk: keyof TItem;
    /** Tipo de relação: `mto` (Many-to-One). */
    mode: 'mto';
    /** Comportamento de mutação permitido para salvar. */
    restriction: 'set' | 'add';
    /** Habilita a possibilidade de desvincular a relação, tornando a chave estrangeira nula. */
    nullAble?: boolean;
};

/**
 * Infere automaticamente a configuração de relação possível a partir de um campo.
 */
export type ExtractRelationConfig<TField> = NonNullable<TField> extends infer NonNull
    ? NonNull extends Date | Buffer | Uint8Array | Decimal | JsonValue ? never
    : NonNull extends any[] ? (NonNull[number] extends object ? ManyRelationConfig<NonNull[number]> : never)
    : NonNull extends object ? (OneToOneRelationConfig<NonNull> | ManyToOneRelationConfig<NonNull>)
    : never
    : never;

/**
 * Mapa das relações configuráveis de um tipo de entidade.
 */
export type RepositoryRelations<T> = {
    [K in keyof T as ExtractRelationConfig<T[K]> extends never ? never : K]?: ExtractRelationConfig<T[K]>;
};

type AnySelect<M extends Prisma.ModelName> = Prisma.TypeMap['model'][M]['operations']['findMany']['args']['select'];

/**
 * Configuração principal usada em `setupVSRepo<T, M>()(config)`.
 *
 * @template T Tipo da entidade manipulada pelo repository.
 * @template M Nome do modelo Prisma.
 * @template SM Mapa de select models nomeados.
 */
export type RepoConfig<T, M extends Prisma.ModelName, SM extends Record<string, AnySelect<M>> = Record<string, AnySelect<M>>> = {
    tableName: Uncapitalize<M>;
    pkName: keyof T;
    selectModels?: SM;
    defaultSelectModel?: Extract<keyof SM, string>;
    requiredWhere?: WhereModel<M>;
    relations?: RepositoryRelations<T>;
    methods?: Record<string, MethodConfig<M, SM>>;
};

/**
 * Tipo final retornado por `.build(prisma)`.
 *
 * Combina métodos dinâmicos, métodos base e extensões personalizadas.
 */
type BuiltRepository<T extends object, M extends Prisma.ModelName, Config extends RepoConfig<T, M, any>, C extends BuildConfig<any> | undefined> = {
    /**
     * Estende o repository com métodos personalizados sem perder a tipagem.
     */
    extend<E>(extensionFunc: (repo: BuiltRepository<T, M, Config, C>) => E): BuiltRepository<T, M, Config, C> & E;

    /**
     * Instância do Prisma Client passada no `build`.
     */
    readonly prisma: DbClient;
} & DynamicMethods<T, M, Config, PrismaModelInputs<M>> & InjectedBaseMethods<T, M, Config, C>;

/**
 * Fábrica tipada de repositories baseada na configuração do modelo Prisma.
 */
export declare class VSRepository<T extends object, M extends Prisma.ModelName, const Config extends RepoConfig<T, M, any> = RepoConfig<T, M, any>> {
    /** Configuração original informada no `setupVSRepo`. */
    readonly config: Config;
    /**
     * Cria uma instância configurável de `VSRepository`.
     */
    constructor(config: Config);
    /**
     * Constrói o repository final com os métodos base e dinâmicos.
     */
    build<C extends BuildConfig<keyof ExtractSelectModels<Config>>>(prisma: DbClient, config?: C): BuiltRepository<T, M, Config, C>;
    vsrepocache: never;
}

/**
 * Infere o tipo de um repository já configurado a partir de uma instância de `VSRepository`.
 *
 * Também permite informar manualmente o `BuildConfig` e o tipo de extensões.
 */
export type RepositoryOf<TRepo, C extends BuildConfig<any> | undefined = undefined, E = unknown> =
    TRepo extends VSRepository<infer T, infer M, infer Config>
        ? BuiltRepository<T, M, Config, C> & E
        : never;

/**
 * Tipo utilitário usado para validar a configuração de um repository em tempo de compilação.
 */
export type ValidateRepoConfig<T extends object, M extends Prisma.ModelName, Config> = {
    /** Nome da tabela/modelo no Prisma. */
    tableName: Uncapitalize<M>;
    /** Nome da chave primária da entidade. */
    pkName: keyof T;
    /** Mapa de select models disponíveis. */
    selectModels?: SelectModels<M>;
    /** Select model padrão. Deve ser uma chave dos `selectModels`. */
    defaultSelectModel?: string;
    /** Filtros globais aplicados às queries do repository. */
    requiredWhere?: WhereModel<M>;
    /** Relações gerenciadas automaticamente pelo `save` e pelo `patch`. */
    relations?: RepositoryRelations<T>;
    /** Mapa dos métodos dinâmicos e suas configurações. */
    methods?: {
        [K in keyof (Config extends { methods: infer Meth } ? Meth : {})]: K extends string
            ? MethodConfig<M, Config extends { selectModels: infer SM } ? SM : any> & (K extends ValidMethodPatterns ? {} : { proxyTo: ValidMethodPatterns })
            : never;
    };
};

/**
 * Função para inicializar e configurar o `repository`.
 * As configurações passadas nele são as que serão lidas ao executar o `.build()`.
 */
export declare function setupVSRepo<T extends object, M extends Prisma.ModelName>(): <
    const SM extends Record<string, SelectModel<M>>,
    const Config extends RepoConfig<T, M, SM>
>(
  config: Config & ValidateRepoConfig<T, M, Config>
) => VSRepository<T, M, Config>;
