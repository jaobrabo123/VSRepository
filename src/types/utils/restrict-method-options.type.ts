import { VSRepoOrmTypes } from "../vsrepo/vsrepo-orm-types.type";
import { MethodOptions } from "./methods-options.type";

/**
 * @publicApi
 */
export type RestrictMethodOptions<T, O extends VSRepoOrmTypes = VSRepoOrmTypes> = Pick<
    MethodOptions<T, O>,
    "db" | "see"
>;
