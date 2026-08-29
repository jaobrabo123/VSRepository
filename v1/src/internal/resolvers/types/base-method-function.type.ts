export type BaseMethodFunction = (options?: unknown) => Promise<any>;
export type BaseMethodPkFunction = (pk: unknown, options?: unknown) => Promise<any>;
export type BaseMethodPkListFunction = (pks: unknown, options?: unknown) => Promise<any>;
export type BaseMethodObjFunction = (obj: unknown, options?: unknown) => Promise<any>;
export type BaseMethodObjListFunction = (objs: unknown, options?: unknown) => Promise<any>;
export type BaseMethodPkObjFunction = (
    pk: unknown,
    obj: unknown,
    options?: unknown,
) => Promise<any>;
export type BaseMethodPkObjTuplesFunction = (
    tuples: [pk: unknown, obj: unknown][],
    options?: unknown,
) => Promise<any>;
