import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";
import { DbArg } from "./db-arg.util";

/**
 * Wraps a database client or transaction so it can be passed as the
 * trailing argument of a `@QueryMethod` declared with `{ spreadArgs: true }`,
 * running that call against `db` instead of the repository's default
 * client — the same role `{ db }` plays in the single-object
 * `QueryMethodArg` call style.
 *
 * @example
 * ```typescript
 * await userRepository.transaction(async (tx) => {
 *     await userRepository.findByEmailAndType("joao@email.com", "admin", withDb(tx));
 * });
 * ```
 *
 * @publicApi
 */
export function withDb<T extends VSRepoOrmTypes = VSRepoOrmTypes>(
    db: T["dbClient"] | T["dbTransaction"],
): DbArg<T> {
    return new DbArg(db);
}
