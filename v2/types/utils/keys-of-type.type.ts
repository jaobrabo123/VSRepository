/**
 * Extracts the keys of `T` whose value type is assignable to `K`.
 *
 * Used internally to constrain `pkName` to the fields of the entity that
 * actually match the configured primary key type.
 *
 * @template T Object type to inspect.
 * @template K Value type to filter by.
 *
 * @example
 * ```typescript
 * type User = { id: string; age: number; name: string };
 * type StringKeys = KeysOfType<User, string>; // "id" | "name"
 * ```
 *
 * @publicApi
 */
export type KeysOfType<T, K> = {
    [P in keyof T]: T[P] extends K ? P : never;
}[keyof T];
