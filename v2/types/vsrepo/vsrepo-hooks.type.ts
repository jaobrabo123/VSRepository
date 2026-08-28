import { VSRepository } from "../../VSRepository";
import { VSRepoMethodsNames } from "./vsrepo-methods-names.type";

export type VSRepoHooks<T, K> = {
    [M in Extract<VSRepoMethodsNames, keyof VSRepository<T, K>>]?: {
        before?: (...args: Parameters<VSRepository<T, K>[M]>) => void | Promise<void>;
        after?: (
            result: Awaited<ReturnType<VSRepository<T, K>[M]>>,
            ...args: Parameters<VSRepository<T, K>[M]>
        ) => void | Promise<void>;
    };
};
