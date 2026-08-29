/**
 * Recursively makes all properties of `T` optional, including nested objects
 * and array elements.
 *
 * Used to type the payloads accepted by `save`, `saveList`, and `patch`, which
 * don't require every field of the entity to be present.
 *
 * @template T Type to make deeply partial.
 *
 * @publicApi
 */
export type DeepPartial<T> =
    | T
    | (T extends Array<infer U>
          ? DeepPartial<U>[]
          : T extends object
            ? {
                  [K in keyof T]?: DeepPartial<T[K]>;
              }
            : T);
