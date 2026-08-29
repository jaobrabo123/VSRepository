import { VSRepoAdapter } from "../../VSRepoAdapter";
import { VSLogLevel } from "../../internal/enums/vs-log-level.enum";
import { KeysOfType } from "../utils/keys-of-type.type";
import { Ordering } from "../utils/ordering.type";

/**
 * @publicApi
 */
export type VSRepoOptions<T, K> = {
    adapter: VSRepoAdapter<T>;
    pkName: KeysOfType<T, K>;
    softRemoveKey?: keyof T;
    logLevel?: VSLogLevel;
    /**
     * Duration (in ms) above which a finished operation is logged as WARN
     * instead of DEBUG, flagging potentially slow queries. Defaults to 300ms.
     */
    logSlowThresholdMs?: number;
    defaultOrdering?: Ordering<T>;
};
