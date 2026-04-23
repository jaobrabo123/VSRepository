import { PrismaClient, Prisma } from './generated/prisma/client';

export type DbClient = PrismaClient;
export type DbTransaction = Prisma.TransactionClient;
export type ClientOrTransaction = DbClient | DbTransaction;

type OrderPattern = {
    [key: string]: 
        | 'asc'
        | 'desc'
        | { _count: 'asc' | 'desc' }
        | OrderPattern;
}

export type PaginationOptions<TCursor = unknown> = { 
    skip?: number; 
    take?: number; 
    cursor?: TCursor; 
};
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
    | `count${string}`;

// --- Utilitários de String e Parsing ---

type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

type Modifiers = 
    | 'NotStartsWith' | 'StartsWith' 
    | 'NotEndsWith' | 'EndsWith' | 'NotContains' 
    | 'Contains' | 'LessThanEqual' | 'LessThan' 
    | 'GreaterThanEqual' | 'GreaterThan' | 'NotIn' 
    | 'In' | 'Not';

type ExtractFieldName<S extends string, T> = 
    Uncapitalize<S> extends keyof T 
        ? Uncapitalize<S> 
        : S extends `NotInsensitive${infer Rest}` ? ExtractFieldName<Rest, T>
        : S extends `Insensitive${infer Rest}` ? ExtractFieldName<Rest, T>
        : S extends `NotIn${infer Rest}` ? ExtractFieldName<Rest, T>
        // Se for In + sensitive, pula o In e continua de sensitive (que cairá no Insensitive acima)
        : S extends `In${infer Rest}` ? ExtractFieldName<Rest, T> 
        : S extends `Not${infer Rest}` ? ExtractFieldName<Rest, T>
        : S extends `GreaterThanEqual${infer Rest}` ? ExtractFieldName<Rest, T>
        : S extends `LessThanEqual${infer Rest}` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}NotStartsWith` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}NotEndsWith` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}NotContains` ? ExtractFieldName<Rest, T>
        
        // 2. Sufixos Compostos
        : S extends `${infer Rest}InInsensitive` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}NotInsensitive` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}ContainsInsensitive` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}GreaterThanEqual` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}LessThanEqual` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}NotIn` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}Insensitive` ? ExtractFieldName<Rest, T>

        // 3. Modificadores Atômicos
        : S extends `${Modifiers}${infer Rest}` ? ExtractFieldName<Rest, T>
        : S extends `${infer Rest}${Modifiers}` ? ExtractFieldName<Rest, T>
        : S;

type IsArrayFilter<S extends string> = 
    // 1. Sufixos (Ex: NomeIn, IdNotIn)
    S extends `${string}NotIn` ? true :
    S extends `${string}In` ? true : 
    // 2. Prefixos (Aqui evitamos o falso positivo do NotInsensitive)
    S extends `NotIn${infer Rest}` 
        ? (Rest extends `sensitive${string}` ? false : (Rest extends "" ? false : true)) 
        : S extends `In${infer Rest}` 
            ? (Rest extends `sensitive${string}` ? false : (Rest extends "" ? false : true)) 
            : false;

type GetFieldType<T, S extends string> = 
    ExtractFieldName<S, T> extends infer FieldName 
        ? FieldName extends keyof T
            ? (IsArrayFilter<S> extends true ? T[FieldName][] : T[FieldName])
            : unknown 
        : any;

type MapToContractTypes<T, Arr extends any[]> = 
    Arr extends [infer First extends string, ...infer Rest]
        ? [GetFieldType<T, First>, ...MapToContractTypes<T, Rest>]
        : [];

type ExtractAnds<T, S extends string> = MapToContractTypes<T, Split<S, 'And'>>;

type ExtractOrsTuple<T, Arr extends string[]> =
    Arr extends [infer First extends string, ...infer Rest extends string[]]
    ? [...ExtractAnds<T, First>, ...ExtractOrsTuple<T, Rest>]
    : [];

type ExtractFields<T, R extends string> = 
    R extends "" ? [] : ExtractOrsTuple<T, Split<R, 'Or'>>;

// --- Lógica de Retorno ---

type ResolveReturnType<M extends string, T_Selected> =
    M extends "existsBy" ? boolean : // <-- Agora promete um boolean
    M extends "createMany" | "updateManyBy" | "deleteManyBy" ? { count: number } :
    M extends "findMany" | "createManyAndReturn" | "updateManyAndReturnBy" ? T_Selected[] :
    M extends "findUnique" | "findFirst" ? T_Selected | null :
    M extends "create" | "updateBy" | "upsertBy" | "deleteBy" ? T_Selected :
    M extends "count" ? number :
    never;

type ExtraArgs<M extends string, R extends string, I> = [
    ...(M extends "upsertBy" 
        ? [update: I extends { updateInput: infer U } ? U : unknown, create: I extends { createInput: infer C } ? C : unknown] : 
       M extends "create" 
        ? [data: I extends { createInput: infer C } ? C : unknown] :
       M extends "updateBy" 
        ? [data: I extends { updateInput: infer U } ? U : unknown] :
       M extends "createMany" | "createManyAndReturn" 
        ? [data: I extends { createManyInput: infer CM } ? CM | CM[] : unknown] :
       M extends "updateManyBy" | "updateManyAndReturnBy" 
        ? [data: I extends { updateManyInput: infer UM } ? UM | UM[] : unknown] : 
       []),
    ...(R extends `${string}PaginatedAndOrdered` ? [
        pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>, 
        order: I extends { orderByInput: infer OB } ? OB | OB[] : OrderOptions
    ] :
       R extends `${string}OrderedAndPaginated` ? [
        order: I extends { orderByInput: infer OB } ? OB | OB[] : OrderOptions, 
        pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>
    ] :
       R extends `${string}Paginated` ? [
        pagination: PaginationOptions<I extends { cursorInput: infer C } ? C : unknown>
    ] :
       R extends `${string}Ordered` ? [
        order: I extends { orderByInput: infer OB } ? OB | OB[] : OrderOptions
    ] : [])
];

type SelectedModel<T, S extends keyof SelectModels, SelectModels> = 
    { [K in keyof T as K extends keyof SelectModels[S] ? K : never]: T[K] };

type CleanFields<R extends string> = 
    R extends `${infer F}PaginatedAndOrdered` ? F :
    R extends `${infer F}OrderedAndPaginated` ? F :
    R extends `${infer F}Paginated` ? F :
    R extends `${infer F}Ordered` ? F :
    R extends `${infer F}SkipDuplicates` ? F : R;

type MethodFn<M extends string, T, R extends string, SelectModels, DefaultSelect extends keyof SelectModels, I> = 
    <S extends keyof SelectModels = DefaultSelect>(...args: [
        ...ExtractFields<T, CleanFields<R>>, 
        ...ExtraArgs<M, R, I>,
        db?: ClientOrTransaction
    ]) => Promise<ResolveReturnType<M, SelectedModel<T, S, SelectModels>>>;

type MethodFactory<T, K extends string, SelectModels, DefaultSelect extends keyof SelectModels, I> =
    K extends `existsBy${infer R}` ? MethodFn<"existsBy", T, R, SelectModels, DefaultSelect, I> : // <-- Mapeamento do prefixo
    K extends `findUniqueBy${infer R}` ? MethodFn<"findUnique", T, R, SelectModels, DefaultSelect, I> :
    K extends `findFirstBy${infer R}` ? MethodFn<"findFirst", T, R, SelectModels, DefaultSelect, I> :
    K extends `findFirst${infer R}` ? MethodFn<"findFirst", T, R, SelectModels, DefaultSelect, I> :
    K extends `findManyBy${infer R}` ? MethodFn<"findMany", T, R, SelectModels, DefaultSelect, I> :
    K extends `findMany${infer R}` ? MethodFn<"findMany", T, R, SelectModels, DefaultSelect, I> :
    K extends `createManyAndReturn${infer R}` ? MethodFn<"createManyAndReturn", T, R, SelectModels, DefaultSelect, I> :
    K extends `createMany${infer R}` ? MethodFn<"createMany", T, R, SelectModels, DefaultSelect, I> :
    K extends `create${infer R}` ? MethodFn<"create", T, R, SelectModels, DefaultSelect, I> :
    K extends `updateManyAndReturnBy${infer R}` ? MethodFn<"updateManyAndReturnBy", T, R, SelectModels, DefaultSelect, I> :
    K extends `updateManyBy${infer R}` ? MethodFn<"updateManyBy", T, R, SelectModels, DefaultSelect, I> :
    K extends `updateBy${infer R}` ? MethodFn<"updateBy", T, R, SelectModels, DefaultSelect, I> :
    K extends `upsertBy${infer R}` ? MethodFn<"upsertBy", T, R, SelectModels, DefaultSelect, I> :
    K extends `deleteManyBy${infer R}` ? MethodFn<"deleteManyBy", T, R, SelectModels, DefaultSelect, I> :
    K extends `deleteBy${infer R}` ? MethodFn<"deleteBy", T, R, SelectModels, DefaultSelect, I> :
    K extends `countBy${infer R}` ? MethodFn<"count", T, R, SelectModels, DefaultSelect, I> :
    K extends `count${infer R}` ? MethodFn<"count", T, R, SelectModels, DefaultSelect, I> : never;

type ResolveSelectModel<Config, Instance, SelectModels> = 
    Config extends { selectModel: infer S }
        ? S extends keyof SelectModels 
            ? S 
            : Instance extends { defaultSelectModel: infer D } 
                ? D extends keyof SelectModels ? D : never
                : never
        : Instance extends { defaultSelectModel: infer D } 
            ? D extends keyof SelectModels ? D : never
            : never;

type DynamicMethods<T, Instance, SelectModels, I> = {
    [K in keyof Instance as Instance[K] extends { map: true } ? K : never]: 
        K extends string 
            ? Instance[K] extends { proxyTo: infer P extends string }
                ? MethodFactory<T, P, SelectModels, ResolveSelectModel<Instance[K], Instance, SelectModels>, I>
                : MethodFactory<T, K, SelectModels, ResolveSelectModel<Instance[K], Instance, SelectModels>, I>
            : never
};

/**
 * Mapeia, a partir do nome de um modelo do Prisma, os principais tipos de input
 * usados pelo VSRepository para montar operações fortemente tipadas.
 *
 * Isso centraliza o acesso ao `Prisma.TypeMap` e evita repetir extrações de tipos
 * em cada repositório concreto.
 *
 * @template M Nome do modelo no schema do Prisma.
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
 * Atalho para o tipo de `select` do Prisma de um modelo.
 *
 * @template M Nome do modelo no schema do Prisma.
 */
export type ModelSelect<M extends Prisma.ModelName> = PrismaModelInputs<M>["select"];

/**
 * Atalho para o tipo de `where` do Prisma de um modelo.
 *
 * @template M Nome do modelo no schema do Prisma.
 */
export type ModelWhere<M extends Prisma.ModelName> = PrismaModelInputs<M>["whereInput"];

/**
 * Configuração de um método dinâmico exposto pelo repositório.
 *
 * Cada propriedade configurada com esse tipo pode ser convertida em um método
 * real quando `build()` for chamado, respeitando projeção, filtros adicionais
 * e redirecionamentos de assinatura.
 *
 * @template M Metadados mínimos do repositório, incluindo `tableName` e `selectModels`.
 */
export type MethodConfig<M extends { tableName: Prisma.ModelName; selectModels?: any }> = {
    /**
     * Habilita a geração dinâmica deste método.
     *
     * Apenas propriedades com `map: true` serão consideradas pelo `build()`.
     */
    readonly map: boolean;
    
    /**
     * Define qual projeção de `selectModels` será usada como retorno padrão.
     *
     * Útil para controlar visibilidade de campos e padronizar retornos
     * sem precisar repetir `select` manualmente.
     */
    readonly selectModel?: keyof NonNullable<M["selectModels"]>;
    
    /**
     * Define como `requiredWhere` será combinado com os filtros da chamada.
     *
     * - `'extending'`: Mescla com os filtros passados na chamada do método (padrão).
     * - `'overwrite'`: Ignora o `requiredWhere` global e usa apenas os filtros
     *   da chamada e o `pushWhere`, se existir.
     */
    readonly whereType?: 'overwrite' | 'extending';
    
    /**
     * Redireciona este método para outro padrão de nome suportado.
     *
     * Isso permite expor nomes semânticos no repositório enquanto a inferência
     * continua baseada em uma assinatura válida do parser.
     *
     * @example 'findManyByStatus'
     */
    readonly proxyTo?: ValidMethodPatterns;
    
    /**
     * Filtros Prisma fixos injetados em todas as chamadas deste método.
     *
     * Útil para especializar um método para um subconjunto de registros.
     *
     * @example `{ status: 'ATIVO' }`
     */
    readonly pushWhere?: ModelWhere<M["tableName"]>;
};

/**
 * Conjunto nomeado de projeções Prisma (`select`) disponíveis para um repositório.
 *
 * Cada chave representa uma visão reutilizável do modelo.
 *
 * @template M Metadados contendo o `tableName` do modelo Prisma.
 */
export type SelectModels<M extends {tableName: Prisma.ModelName}> = Record<string, ModelSelect<M["tableName"]>>;

export type ModelUpsertInput<M extends Prisma.ModelName> = 
    PrismaModelInputs<M>['upsertCreateInput'] | PrismaModelInputs<M>['upsertUpdateInput'];

type ResolveDefaultReturn<T, DefaultModel, Models> = 
    DefaultModel extends keyof Models
        ? SelectedModel<T, DefaultModel, Models>
        : T;

// --- Configuração e Injeção Condicional de Métodos Base ---

export type BuildConfig = {
    freeze?: boolean;
    baseMethods?: {
        get?: boolean;
        remove?: boolean;
        save?: boolean;
    }
};

type InjectedGet<T, Instance extends { pkName: keyof T, defaultSelectModel?: any, selectModels?: any }, C extends BuildConfig | undefined> =
    C extends { baseMethods: { get: false } } ? {} : {
        /**
         * Busca um registro diretamente pela Primary Key.
         * @param pk Valor da chave primária do registro.
         * @param db (Opcional) Cliente Prisma ou contexto de transação ativa.
         */
        get(pk: T[Instance['pkName']], db?: ClientOrTransaction): Promise<ResolveDefaultReturn<T, Instance['defaultSelectModel'], Instance['selectModels']>>;
    };

type InjectedRemove<T, Instance extends { pkName: keyof T, defaultSelectModel?: any, selectModels?: any }, C extends BuildConfig | undefined> =
    C extends { baseMethods: { remove: false } } ? {} : {
        /**
         * Remove fisicamente um registro do banco pela sua Primary Key.
         * @param pk Valor da chave primária do registro a ser deletado.
         * @param db (Opcional) Cliente Prisma ou contexto de transação ativa.
         */
        remove(pk: T[Instance['pkName']], db?: ClientOrTransaction): Promise<ResolveDefaultReturn<T, Instance['defaultSelectModel'], Instance['selectModels']>>;
    };

type InjectedSave<
    T, 
    M extends Prisma.ModelName, 
    Instance extends { defaultSelectModel?: any, selectModels?: any, relations?: any }, 
    C extends BuildConfig | undefined
> = C extends { baseMethods: { save: false } } ? {} : {
    /**
     * Salva um registro. Se o objeto possuir a propriedade definida em `pkName`, executa um `upsert`. 
     * Caso contrário, executa um `create`.
     * Campos mapeados em `relations` aceitam apenas o objeto literal ou array de literais 
     * no lugar dos operadores do Prisma (create/connect).
     * @param obj Objeto contendo os dados a serem salvos.
     * @param db (Opcional) Cliente Prisma ou contexto de transação ativa.
     */
    save(
        obj: UpsertWithRelations<T, M, NonNullable<Instance['relations']>>, 
        db?: ClientOrTransaction
    ): Promise<ResolveDefaultReturn<T, Instance['defaultSelectModel'], Instance['selectModels']>>;
};

// --- Utilitários para Override de Relações no Save ---

/**
 * Aplica o Omit distribuindo sobre Unions (necessário pois ModelUpsertInput é uma Union de Create/Update).
 */
type DistributiveOmit<TObj, K extends keyof any> = TObj extends any ? Omit<TObj, K> : never;

/**
 * Converte o tipo do contrato original (TField) em uma versão Literal e Partial, 
 * respeitando se é Array (otm/mtm) ou Objeto único (mto).
 */
type RelationLiteral<TField> = NonNullable<TField> extends (infer U)[] 
    ? Partial<U>[] 
    : NonNullable<TField> extends object 
        ? Partial<NonNullable<TField>> 
        : never;

/**
 * Substitui a tipagem do Prisma (create/connect/disconnect) por objetos literais diretos 
 * para todas as chaves que foram mapeadas em `relations`.
 */
export type UpsertWithRelations<T, M extends Prisma.ModelName, TRelations> = 
    DistributiveOmit<ModelUpsertInput<M>, keyof TRelations> & {
        [K in Extract<keyof TRelations, keyof T>]?: RelationLiteral<T[K]>;
    };

type InjectedBaseMethods<T, M extends Prisma.ModelName, Instance extends { pkName: keyof T, defaultSelectModel?: any, selectModels?: any }, C extends BuildConfig | undefined> =
    InjectedGet<T, Instance, C> & InjectedRemove<T, Instance, C> & InjectedSave<T, M, Instance, C>;

// --- Configuração de Relações e Restrições de Associação ---

/**
 * Identifica se o objeto é um escalar do Prisma ou da linguagem em vez de um modelo relacionado (ex: Date, Buffer).
 */
type IsPrismaScalarObject<TType> = TType extends Date | Buffer | Uint8Array ? true : false;

/**
 * Extrai e impõe regras de mode/pk baseadas no tipo da propriedade (Objeto Único vs Array de Objetos).
 */
export type ExtractRelationConfig<TField> = NonNullable<TField> extends (infer U)[]
    ? IsPrismaScalarObject<U> extends true ? never
    : U extends object
        ? { pk: keyof U; mode: 'otm' | 'mtm'; restriction: 'set' | 'add' }
        : never
    : IsPrismaScalarObject<NonNullable<TField>> extends true ? never
    : NonNullable<TField> extends object
        ? { pk: keyof NonNullable<TField>; mode: 'mto'; restriction: 'set' | 'add' }
        : never;

/**
 * Garante que apenas as chaves do contrato T que resolvem como relações válidas possam ser configuradas.
 */
export type RepositoryRelations<T> = {
    [K in keyof T as ExtractRelationConfig<T[K]> extends never ? never : K]?: ExtractRelationConfig<T[K]>;
};

/**
 * Classe base para repositórios dinâmicos inspirados em convenções de nome
 * no estilo Spring Data, mas gerando operações Prisma tipadas.
 *
 * A proposta é permitir que o repositório exponha métodos como
 * `findManyByNomeContains`, `updateById` ou aliases configurados com `proxyTo`,
 * mantendo inferência de parâmetros e retorno em tempo de compilação.
 *
 * O fluxo esperado é:
 * 1. Definir `tableName`.
 * 2. Opcionalmente definir `selectModels`, `defaultSelectModel` e `requiredWhere`.
 * 3. Declarar propriedades com `MethodConfig`.
 * 4. Chamar `build()` para materializar os métodos dinâmicos.
 *
 * @template T Contrato base retornado pelo repositório.
 * @template M Nome exato do modelo no schema do Prisma.
 */
export abstract class VSRepository<
    T extends object, 
    M extends Prisma.ModelName,
> {
    /**
     * Nome do delegate do Prisma que será acessado no client.
     *
     * Deve corresponder ao nome do modelo com inicial minúscula, já que o acesso
     * em runtime ocorre via `prisma[tableName]`.
     *
     * @example "usuario"
     */
    abstract readonly tableName: Uncapitalize<M>;

    /**
     * Nome da propriedade da chave primária.
     *
     * É usada pelos métodos base do repositório, como `get`, `remove`
     * e `save`, para identificar o campo que referencia unicamente o registro.
     */
    abstract readonly pkName: keyof T;

    /**
     * Dicionário de projeções reutilizáveis para este repositório.
     *
     * Cada entrada representa um `select` do Prisma que pode ser reutilizado
     * por métodos dinâmicos para padronizar o shape do retorno.
     *
     * @example { basico: { id: true, nome: true }, completo: { id: true, perfil: true } }
     */
    readonly selectModels?: SelectModels<{ tableName: M }>;

    /**
     * Chave de `selectModels` usada como projeção padrão do repositório.
     *
     * Quando um método dinâmico não define `selectModel`, esta configuração
     * passa a ser o fallback de retorno.
     */
    readonly defaultSelectModel?: keyof this['selectModels'];

    /**
     * Filtro global aplicado a todas as queries geradas por este repositório.
     *
     * Ideal para regras transversais como soft delete, tenant atual,
     * escopo organizacional ou visibilidade mínima.
     *
     * @example { deletadoEm: null } ou { tenantId: 1 }
     */
    readonly requiredWhere?: ModelWhere<M>;

    /**
     * Configuração de mapeamento e comportamento de relações para o modelo.
     * Força a tipagem estrita de acordo com as propriedades de `T`:
     * - Arrays de objetos suportam apenas `otm` (One-to-Many) ou `mtm` (Many-to-Many).
     * - Objetos únicos suportam apenas `mto` (Many-to-One).
     * - A propriedade `pk` deve ser a primary key da propriedade aninhada.
     */
    readonly relations?: RepositoryRelations<T>;

    /**
     * Quando habilitado, permite exibir logs de funcionamento do repositório.
     *
     * Útil para depuração das assinaturas resolvidas e do processo de build.
     */
    readonly showWorking?: boolean;

    /**
     * Cria a instância base do repositório.
     */
    constructor();

    /**
     * Materializa, em tempo de execução, os métodos dinâmicos configurados na classe.
     * Além disso, injeta opcionalmente os métodos padrão (get, remove, save).
     *
     * @param prisma Instância raiz do Prisma Client usada para resolver delegates.
     * @param config Objeto de configuração para inibir métodos base ou mutação. `freeze: false` permite mutações.
     * @returns A instância atual enriquecida com os métodos.
     */
    build<C extends BuildConfig>(
        prisma: DbClient,
        config: C & { freeze: false }
    ): this & DynamicMethods<T, this, this['selectModels'], PrismaModelInputs<M>> & InjectedBaseMethods<T, M, this, C>;

    /**
     * Materializa, em tempo de execução, os métodos dinâmicos configurados na classe.
     * Além disso, injeta opcionalmente os métodos padrão (get, remove, save).
     *
     * @param prisma Instância raiz do Prisma Client usada para resolver delegates.
     * @param config Objeto de configuração para inibir métodos base ou mutação. Se `freeze` for `true` (ou omitido), retorna como Readonly.
     * @returns A instância atual enriquecida com os métodos.
     */
    build<C extends BuildConfig>(
        prisma: DbClient,
        config?: C
    ): Readonly<this & DynamicMethods<T, this, this['selectModels'], PrismaModelInputs<M>> & InjectedBaseMethods<T, M, this, C>>;

    vsrepocache: never;
}
