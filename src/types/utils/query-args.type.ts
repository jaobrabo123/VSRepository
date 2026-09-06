import { DbArg } from "../../internal/utils/db-arg.util";
import { VSRepoOrmTypes } from "../vsrepo/vsrepo-orm-types.type";

/**
 * @publicApi
 */
export type QueryArgs<T extends Array<any> = [], O extends VSRepoOrmTypes = VSRepoOrmTypes> = [
    ...T,
    db?: DbArg<O>,
];
