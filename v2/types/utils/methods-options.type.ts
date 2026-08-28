import { SeeMode } from "./see-mode.type";
import { VSRepoOrmTypes } from "../vsrepo/vsrepo-orm-types.type";
import { VSRepoRelations } from "../vsrepo/vsrepo-relations.type";
import { VSRepoSelect } from "../vsrepo/vsrepo-select.type";

/**
 * @publicApi
 */
export type MethodOptions<T, K extends VSRepoOrmTypes= VSRepoOrmTypes> = {
    select?: VSRepoSelect<T>;
    relations?: VSRepoRelations<T>;
    see?: SeeMode;
    db?: K["dbClient"] | K["dbTransaction"];
};
