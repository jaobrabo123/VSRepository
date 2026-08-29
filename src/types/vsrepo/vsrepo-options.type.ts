import { VSRepoAdapter } from "../../../v2/VSRepoAdapter";
import { VSLogLevel } from "../../internal/enums/vs-log-level.enum";
import { KeysOfType } from "../utils/keys-of-type.type";
import { Ordering } from "../utils/ordering.type";

/**
 * Configuration passed to the `VSRepository` constructor.
 *
 * @template T Entity type managed by the repository.
 * @template K Type of the entity's primary key value.
 *
 * @publicApi
 */
export type VSRepoOptions<T, K> = {
    /** Adapter that translates the repository's operations into calls against the underlying ORM/database. */
    adapter: VSRepoAdapter<T>;
    /** Name of the field that represents the entity's primary key (PK). */
    pkName: KeysOfType<T, K>;
    /**
     * Name of the field used for soft-delete.
     *
     * When configured, enables the `softRemove`, `softRemoveList`, `restore`,
     * and `restoreList` methods.
     */
    softRemoveKey?: keyof T;
    /** Minimum severity of messages printed by the repository's internal logger. Defaults to `VSLogLevel.WARN`. */
    logLevel?: VSLogLevel;
    /**
     * Duration (in ms) above which a finished operation is logged as WARN
     * instead of DEBUG, flagging potentially slow queries. Defaults to 300ms.
     */
    logSlowThresholdMs?: number;
    /** Default ordering automatically applied to queries that accept `order`, unless the call overrides it. */
    defaultOrdering?: Ordering<T>;
};
