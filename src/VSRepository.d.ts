// --- Utilitários de String e Parsing (Apenas para contar parâmetros) ---
type Split<S extends string, D extends string> =
    string extends S ? string[] :
    S extends '' ? [] :
    S extends `${infer T}${D}${infer U}` ? [T, ...Split<U, D>] : [S];

// Transforma qualquer array extraído em uma tupla de `any`
type MapToAny<Arr extends any[]> = 
    Arr extends [infer First, ...infer Rest] ? [any, ...MapToAny<Rest>] : [];

type ExtractAnds<S extends string> = MapToAny<Split<S, 'And'>>;

type ExtractOrsTuple<Arr extends string[]> =
    Arr extends [infer First extends string, ...infer Rest extends string[]]
    ? [...ExtractAnds<First>, ...ExtractOrsTuple<Rest>]
    : [];

// Conta a quantidade de campos na string e gera a tupla de [any, any, ...]
type ExtractFields<R extends string> = 
    R extends "" ? [] : ExtractOrsTuple<Split<R, 'Or'>>;

// --- Mapeamento dos Métodos Dinâmicos ---
type DynamicMethods<Instance> = {
    [K in keyof Instance as Instance[K] extends { map: true } ? K : never]: 
        K extends string ? MethodFactory<K> : never
};

type MethodFactory<K extends string> = 
    K extends `${infer Method}By${infer Rest}` ? MethodResolver<Method, Rest> :
    K extends `${infer Method}` ? MethodResolver<Method, ''> : never;

type MethodResolver<M extends string, R extends string> = 
    R extends `${infer Fields}Paginated` | `${infer Fields}Ordered` | `${infer Fields}PaginatedAndOrdered` | `${infer Fields}OrderedAndPaginated`
    ? MethodFn<M, Fields, true>
    : MethodFn<M, R, false>;

// Assinatura final: (args_n: any, [data: any], [options: any], db?: any) => Promise<any>
type MethodFn<M extends string, R extends string, HasMod extends boolean> = 
    (...args: [
        ...ExtractFields<R>, 
        ...(M extends 'update' | 'updateMany' | 'updateManyAndReturn' | 'upsert' ? [data: any] : []), 
        ...(HasMod extends true ? [options: any] : []), 
        db?: any 
    ]) => Promise<any>;

// --- CLASSE PRINCIPAL ---
export abstract class VSRepository<T extends string> {
    tableName: T;
    selectModels?: Record<string, object>;
    requiredWhere?: object;

    build(): this & DynamicMethods<this>;
}