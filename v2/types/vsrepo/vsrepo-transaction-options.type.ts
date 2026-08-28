import { TransactionIsolationLevel } from "../../internal/enums/transaction-isolation-level.enum";

export type VSRepoTransactionOptions = {
    isolationLevel?: TransactionIsolationLevel;
    timeoutMs?: number;
};
