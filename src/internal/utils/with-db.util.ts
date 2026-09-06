import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";
import { DbArg } from "./db-arg.util";

/**
 * @publicApi
 */
export function withDb<T extends VSRepoOrmTypes = VSRepoOrmTypes>(
    db: T["dbClient"] | T["dbTransaction"],
): DbArg<T> {
    return new DbArg(db);
}
