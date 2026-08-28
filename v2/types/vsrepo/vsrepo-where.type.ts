import { Primitive } from "../utils/primitive.type";

/**
 * @publicApi
 */
export type VSRepoFieldOperators<V> = {
    equals?: V;
    not?: V | VSRepoFieldOperators<V>;
} & (V extends number | Date
    ? {
          between?: [V, V];
      }
    : {}) &
    (V extends string
        ? {
              contains?: string;
              startsWith?: string;
              endsWith?: string;
              ignoreCase?: boolean;
          }
        : {}) &
    (V extends boolean
        ? {}
        : {
              in?: V[];
              notIn?: V[];
              gt?: V;
              gte?: V;
              lt?: V;
              lte?: V;
          });

/**
 * @publicApi
 */
export type VSRepoFieldWhere<V> = V | VSRepoFieldOperators<V>;

/**
 * @publicApi
 */
export type VSRepoWherePlain<T> = {
    [P in keyof T]?: NonNullable<T[P]> extends Primitive
        ? VSRepoFieldWhere<T[P]>
        : NonNullable<T[P]> extends Array<infer U>
          ? U extends object
              ? {
                    _some?: VSRepoWherePlain<U>;
                    _every?: VSRepoWherePlain<U>;
                    _none?: VSRepoWherePlain<U>;
                }
              : VSRepoFieldWhere<T[P]>
          : NonNullable<T[P]> extends object
            ? {
                  _with?: VSRepoWherePlain<NonNullable<T[P]>>;
                  _without?: VSRepoWherePlain<NonNullable<T[P]>>;
              }
            : VSRepoFieldWhere<T[P]>;
};

/**
 * @publicApi
 */
export type VSRepoWhere<T> = VSRepoWherePlain<T> & {
    AND?: VSRepoWherePlain<T> | VSRepoWherePlain<T>[];
    OR?: VSRepoWherePlain<T> | VSRepoWherePlain<T>[];
    NOT?: VSRepoWherePlain<T> | VSRepoWherePlain<T>[];
};
