import { PrismaClient, Prisma } from './generated/prisma/client';

export type DbClient = PrismaClient;
export type DbTransaction = Prisma.TransactionClient;
export type ClientOrTransaction = DbClient | DbTransaction;

// --- Tipos de Auxílio para Filtros e Opções ---
export type PaginationOptions = { skip: number; take: number };
export type OrderOptions = any; // Pode ser tipado como Prisma.XOrderByWithRelationInput se necessário

// --- Configuração dos Métodos (Autocomplete) ---
export type MethodConfig<S extends string> = {
    readonly map: boolean;
    readonly selectModel: S;
    readonly whereType?: 'overwrite' | 'extending';
};

// --- Utilitários de String e Parsing de Argumentos ---
type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

type MapToAny<Arr extends any[]> = 
    Arr extends [infer First, ...infer Rest] ? [any, ...MapToAny<Rest>] : [];

type ExtractAnds<S extends string> = MapToAny<Split<S, 'And'>>;

type ExtractOrsTuple<Arr extends string[]> =
    Arr extends [infer First extends string, ...infer Rest extends string[]]
    ? [...ExtractAnds<First>, ...ExtractOrsTuple<Rest>]
    : [];

type ExtractFields<R extends string> = 
    R extends "" ? [] : ExtractOrsTuple<Split<R, 'Or'>>;

// --- Lógica de Retorno Baseada no Prefixo ---
type ResolveReturnType<M extends string, T_Selected> =
    M extends "createMany" | "updateMany" | "deleteMany" ? { count: number } :
    M extends "findMany" | "createManyAndReturn" | "updateManyAndReturn" ? T_Selected[] :
    M extends "findUnique" | "findFirst" ? T_Selected | null :
    M extends "create" | "update" | "upsert" | "delete" ? T_Selected :
    never;

// --- Mapeamento de Argumentos Especiais (Data, Update, Pagination, Order) ---
// Simula a lógica do seu build() que adiciona args extras no final da tupla de 'where'
type ExtraArgs<M extends string, R extends string> = [
    ...(M extends "upsert" ? [update: any, create: any] : 
       M extends "create" | "update" | "createMany" | "updateMany" | "createManyAndReturn" | "updateManyAndReturn" ? [data: any] : []),
    ...(R extends `${string}PaginatedAndOrdered` | `${string}OrderedAndPaginated` ? [arg1: any, arg2: any] :
       R extends `${string}Paginated` ? [pagination: PaginationOptions] :
       R extends `${string}Ordered` ? [order: OrderOptions] : [])
];

// --- Mapeamento dos Métodos Dinâmicos ---
type SelectedModel<T, S extends keyof SelectModels, SelectModels> = 
    { [K in keyof T as K extends keyof SelectModels[S] ? K : never]: T[K] };

type CleanFields<R extends string> = 
    R extends `${infer F}PaginatedAndOrdered` ? F :
    R extends `${infer F}OrderedAndPaginated` ? F :
    R extends `${infer F}Paginated` ? F :
    R extends `${infer F}Ordered` ? F : R;

type MethodFn<M extends string, T, R extends string, SelectModels, DefaultSelect extends keyof SelectModels> = 
    <S extends keyof SelectModels = DefaultSelect>(...args: [
        ...ExtractFields<CleanFields<R>>,
        ...ExtraArgs<M, R>,
        db?: ClientOrTransaction | { selectModel: S }
    ]) => Promise<ResolveReturnType<M, SelectedModel<T, S, SelectModels>>>;

type MethodFactory<T, K extends string, SelectModels, DefaultSelect extends keyof SelectModels> = 
    K extends `findUniqueBy${infer R}` ? MethodFn<"findUnique", T, R, SelectModels, DefaultSelect> :
    K extends `findFirstBy${infer R}` ? MethodFn<"findFirst", T, R, SelectModels, DefaultSelect> :
    K extends `findFirst${infer R}` ? MethodFn<"findFirst", T, R, SelectModels, DefaultSelect> :
    K extends `findManyBy${infer R}` ? MethodFn<"findMany", T, R, SelectModels, DefaultSelect> :
    K extends `findMany${infer R}` ? MethodFn<"findMany", T, R, SelectModels, DefaultSelect> :
    K extends `createManyAndReturn${infer R}` ? MethodFn<"createManyAndReturn", T, R, SelectModels, DefaultSelect> :
    K extends `createMany${infer R}` ? MethodFn<"createMany", T, R, SelectModels, DefaultSelect> :
    K extends `create${infer R}` ? MethodFn<"create", T, R, SelectModels, DefaultSelect> :
    K extends `updateManyAndReturn${infer R}` ? MethodFn<"updateManyAndReturn", T, R, SelectModels, DefaultSelect> :
    K extends `updateMany${infer R}` ? MethodFn<"updateMany", T, R, SelectModels, DefaultSelect> :
    K extends `update${infer R}` ? MethodFn<"update", T, R, SelectModels, DefaultSelect> :
    K extends `upsert${infer R}` ? MethodFn<"upsert", T, R, SelectModels, DefaultSelect> :
    K extends `deleteMany${infer R}` ? MethodFn<"deleteMany", T, R, SelectModels, DefaultSelect> :
    K extends `delete${infer R}` ? MethodFn<"delete", T, R, SelectModels, DefaultSelect> : never;

export type DynamicMethods<T, Instance, SelectModels> = {
    [K in keyof Instance as Instance[K] extends { map: true } ? K : never]: 
        K extends string ? MethodFactory<T, K, SelectModels, Instance[K] extends { selectModel: infer S } ? (S extends keyof SelectModels ? S : never) : never> : never
};

// --- CLASSE PRINCIPAL ---
export abstract class VSRepository<T extends object> {
    abstract tableName: string;
    abstract selectModels: Record<string, { [K in keyof T]?: true }>;
    requiredWhere?: object;
    showWorking?: boolean;

    constructor(prisma: DbClient);

    // A assinatura do build agora reflete a injeção de métodos
    build(): this & DynamicMethods<T, this, this['selectModels']>;
}