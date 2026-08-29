/**
 * Describes the ORM-specific client and transaction types a `VSRepoAdapter`
 * (and the `VSRepository` built on top of it) works with.
 *
 * Implementations provide their own concrete types for `dbClient` and
 * `dbTransaction` (e.g. `PrismaClient`/`Prisma.TransactionClient`), which
 * `VSRepository` then uses to type `getDbClient()`, `transaction()`, and
 * the `db` option accepted by every method.
 *
 * @publicApi
 */
export type VSRepoOrmTypes = {
    /** Main database client type used to run queries outside a transaction. */
    dbClient: any;
    /** Transaction client type used to run queries inside a `transaction()` callback. */
    dbTransaction: any;
};
