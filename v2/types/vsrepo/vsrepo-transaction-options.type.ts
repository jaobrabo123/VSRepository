import { TransactionIsolationLevel } from "../../internal/enums/transaction-isolation-level.enum";

/**
 * @publicApi
 */
export type VSRepoTransactionOptions = {
    isolationLevel?: TransactionIsolationLevel;
    timeoutMs?: number;
};
