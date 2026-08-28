import { VSRepoAdapter } from "../../VSRepoAdapter";
import { VSLogLevel } from "../../internal/enums/vs-log-level.enum";
import { KeysOfType } from "../utils/keys-of-type.type";
import { Ordering } from "../utils/ordering.type";
import { VSRepoHooks } from "./vsrepo-hooks.type";

export type VSRepoOptions<T, K> = {
    adapter: VSRepoAdapter<T>;
    pkName: KeysOfType<T, K>;
    hooks?: VSRepoHooks<T, K>;
    softRemoveKey?: keyof T;
    logLevel?: VSLogLevel;
    defaultOrdering?: Ordering<T>;
};
