import { Primitive } from "../utils/primitive.type";

type RelationKeys<T> = {
    [P in keyof T]: NonNullable<T[P]> extends Primitive
        ? never
        : NonNullable<T[P]> extends Array<infer U>
          ? NonNullable<U> extends Primitive
              ? never
              : P
          : NonNullable<T[P]> extends object
            ? P
            : never;
}[keyof T];

export type VSRepoRelations<T> = {
    [P in RelationKeys<T>]?: NonNullable<T[P]> extends Array<infer U>
        ? U extends object
            ? boolean | VSRepoRelations<U>
            : boolean
        : NonNullable<T[P]> extends object
          ? boolean | VSRepoRelations<NonNullable<T[P]>>
          : boolean;
};
