import { NumericLike } from "./numeric-like.type";

/**
 * @publicApi
 */
export type NumericKeys<T> = {
    [P in keyof T]: NonNullable<T[P]> extends NumericLike ? P : never;
}[keyof T];
