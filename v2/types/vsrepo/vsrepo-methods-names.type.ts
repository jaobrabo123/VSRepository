import { VSRepository } from "../../VSRepository";

type MethodKeys<T> = {
    [P in keyof T]: T[P] extends (...args: any[]) => any ? P : never;
}[keyof T];

export type VSRepoMethodsNames = Exclude<MethodKeys<VSRepository<any, any>>, "getDefaultOrdering">;
