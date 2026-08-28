import { Primitive } from "../utils/primitive.type";

/**
 * @publicApi
 */
export type VSRepoSelect<T> = {
    [P in keyof T]?: NonNullable<T[P]> extends Primitive
        ? boolean
        : NonNullable<T[P]> extends Array<infer U>
          ? U extends Primitive
              ? boolean
              : VSRepoSelect<U> | boolean
          : NonNullable<T[P]> extends object
            ? VSRepoSelect<NonNullable<T[P]>> | boolean
            : boolean;
};
