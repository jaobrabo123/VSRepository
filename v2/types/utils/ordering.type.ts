import { Primitive } from "./primitive.type";

export type SortDirection = "asc" | "desc" | "ASC" | "DESC";

export type OrderByField<T> = {
    [P in keyof T]?: NonNullable<T[P]> extends Primitive
        ? SortDirection
        : NonNullable<T[P]> extends Array<any>
          ? never
          : NonNullable<T[P]> extends object
            ? Ordering<NonNullable<T[P]>>
            : SortDirection;
};

export type Ordering<T> = OrderByField<T> | OrderByField<T>[];
