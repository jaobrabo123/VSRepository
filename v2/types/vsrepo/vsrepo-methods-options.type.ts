import { SeeMode } from "../utils/see-mode.type";
import { VSRepoOrmTypes } from "./vsrepo-orm-types.type";
import { VSRepoRelations } from "./vsrepo-relations.type";
import { VSRepoSelect } from "./vsrepo-select.type";

export type VSRepoMethodOptions<T, K extends VSRepoOrmTypes= VSRepoOrmTypes> = {
    select?: VSRepoSelect<T>;
    relations?: VSRepoRelations<T>;
    see?: SeeMode;
    db?: K["dbClient"] | K["dbTransaction"];
};
