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
    | `existsBy${string}` // <-- Adicionado aqui
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
        : S extends `${infer Rest}NotStartsWith` ? ExtractFieldName<Rest, T> // <-- AQUI
        : S extends `${infer Rest}NotEndsWith` ? ExtractFieldName<Rest, T>   // <-- AQUI
        : S extends `${infer Rest}NotContains` ? ExtractFieldName<Rest, T>   // <-- AQUI
        
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
        : never;

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
    abstract tableName: Uncapitalize<M>;

    /**
     * Dicionário de projeções reutilizáveis para este repositório.
     *
     * Cada entrada representa um `select` do Prisma que pode ser reutilizado
     * por métodos dinâmicos para padronizar o shape do retorno.
     *
     * @example { basico: { id: true, nome: true }, completo: { id: true, perfil: true } }
     */
    selectModels?: SelectModels<{ tableName: M }>;

    /**
     * Chave de `selectModels` usada como projeção padrão do repositório.
     *
     * Quando um método dinâmico não define `selectModel`, esta configuração
     * passa a ser o fallback de retorno.
     */
    defaultSelectModel?: keyof this['selectModels'];

    /**
     * Filtro global aplicado a todas as queries geradas por este repositório.
     *
     * Ideal para regras transversais como soft delete, tenant atual,
     * escopo organizacional ou visibilidade mínima.
     *
     * @example { deletadoEm: null } ou { tenantId: 1 }
     */
    requiredWhere?: ModelWhere<M>;

    /**
     * Quando habilitado, permite exibir logs de funcionamento do repositório.
     *
     * Útil para depuração das assinaturas resolvidas e do processo de build.
     */
    showWorking?: boolean;

    /**
     * Cria a instância base do repositório.
     *
     * @param prisma Instância raiz do Prisma Client usada para resolver delegates e executar operações.
     */
    constructor(prisma: DbClient);

    /**
     * Materializa, em tempo de execução, os métodos dinâmicos configurados na classe.
     *
     * Normalmente é chamado no final do construtor da implementação concreta,
     * retornando a própria instância enriquecida com os métodos inferidos.
     *
     * @returns A instância atual com os métodos dinâmicos tipados adicionados.
     */
    build(): this & DynamicMethods<T, this, this['selectModels'], PrismaModelInputs<M>>;
}
