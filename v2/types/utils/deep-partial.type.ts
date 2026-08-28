export type DeepPartial<T> =
    | T
    | (T extends Array<infer U>
          ? DeepPartial<U>[]
          : T extends object
            ? {
                  [K in keyof T]?: DeepPartial<T[K]>;
              }
            : T);
