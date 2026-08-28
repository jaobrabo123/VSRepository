/**
 * @publicApi
 */
export enum TransactionIsolationLevel {
    READ_UNCOMMITTED = "ReadUncommitted",
    READ_COMMITTED = "ReadCommitted",
    REPEATABLE_READ = "RepeatableRead",
    SERIALIZABLE = "Serializable",
}
