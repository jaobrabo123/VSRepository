import { VSRepoOrmTypes } from "../../types/vsrepo/vsrepo-orm-types.type";

/**
 * @publicApi
 */
export class DbArg<T extends VSRepoOrmTypes = VSRepoOrmTypes> {
    constructor(private readonly db: T) {}

    getDb(): T {
        return this.db;
    }
}
