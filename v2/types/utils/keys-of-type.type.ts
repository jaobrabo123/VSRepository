export type KeysOfType<T, K> = {
    [P in keyof T]: T[P] extends K ? P : never;
}[keyof T];
