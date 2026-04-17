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

export type PaginationOptions = { skip: number; take: number };
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
    | `deleteBy${string}`;

export type MethodConfig<S extends string> = {
    readonly map: boolean;
    readonly selectModel: S;
    readonly whereType?: 'overwrite' | 'extending';
    readonly proxyTo?: ValidMethodPatterns;
};

// --- Utilitários de String e Parsing ---

type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

type Modifiers = 
    | 'Insensitive' | 'NotStartsWith' | 'StartsWith' 
    | 'NotEndsWith' | 'EndsWith' | 'NotContains' 
    | 'Contains' | 'LessThanEqual' | 'LessThan' 
    | 'GreaterThanEqual' | 'GreaterThan' | 'NotIn' 
    | 'In' | 'Not';

type ExtractFieldName<S extends string, T> = 
    Uncapitalize<S> extends keyof T 
        ? Uncapitalize<S> 
        : S extends `${Modifiers}${infer Rest}` 
            ? ExtractFieldName<Rest, T>
            : S extends `${infer Rest}${Modifiers}`
                ? ExtractFieldName<Rest, T>
                : unknown;

type IsArrayFilter<S extends string> = 
    S extends `${string}In${string}` 
        ? (S extends `${string}Contains${string}` ? false : true)
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
    never;

type ExtraArgs<M extends string, R extends string, I> = [
    ...(M extends "upsertBy" 
        ? [update: I extends { updateInput: infer U } ? U : any, create: I extends { createInput: infer C } ? C : any] : 
       M extends "create" 
        ? [data: I extends { createInput: infer C } ? C : any] :
       M extends "updateBy" 
        ? [data: I extends { updateInput: infer U } ? U : any] :
       M extends "createMany" | "createManyAndReturn" 
        ? [data: I extends { createManyInput: infer CM } ? CM : any] :
       M extends "updateManyBy" | "updateManyAndReturnBy" 
        ? [data: I extends { updateManyInput: infer UM } ? UM : any] : 
       []),
    ...(R extends `${string}PaginatedAndOrdered` ? [pagination: PaginationOptions, order: OrderOptions] :
       R extends `${string}OrderedAndPaginated` ? [order: OrderOptions, pagination: PaginationOptions] :
       R extends `${string}Paginated` ? [pagination: PaginationOptions] :
       R extends `${string}Ordered` ? [order: OrderOptions] : [])
];

type SelectedModel<T, S extends keyof SelectModels, SelectModels> = 
    { [K in keyof T as K extends keyof SelectModels[S] ? K : never]: T[K] };

type CleanFields<R extends string> = 
    R extends `${infer F}PaginatedAndOrdered` ? F :
    R extends `${infer F}OrderedAndPaginated` ? F :
    R extends `${infer F}Paginated` ? F :
    R extends `${infer F}Ordered` ? F : R;

type MethodFn<M extends string, T, R extends string, SelectModels, DefaultSelect extends keyof SelectModels, I> = 
    <S extends keyof SelectModels = DefaultSelect>(...args: [
        ...ExtractFields<T, CleanFields<R>>, 
        ...ExtraArgs<M, R, I>, // <-- I aqui
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
    K extends `deleteBy${infer R}` ? MethodFn<"deleteBy", T, R, SelectModels, DefaultSelect, I> : never;

export type DynamicMethods<T, Instance, SelectModels, I> = {
    [K in keyof Instance as Instance[K] extends { map: true } ? K : never]: 
        K extends string 
            ? Instance[K] extends { proxyTo: infer P extends string }
                ? MethodFactory<T, P, SelectModels, Instance[K] extends { selectModel: infer S } ? (S extends keyof SelectModels ? S : never) : never, I>
                : MethodFactory<T, K, SelectModels, Instance[K] extends { selectModel: infer S } ? (S extends keyof SelectModels ? S : never) : never, I>
            : never
};

export abstract class VSRepository<T extends object, I extends Record<string, any> = {}> {
    abstract tableName: string;
    abstract selectModels: Record<string, { [K in keyof T]?: true | object }>;
    requiredWhere?: object;
    showWorking?: boolean;
    constructor(prisma: DbClient);
    build(): this & DynamicMethods<T, this, this['selectModels'], I>;
}