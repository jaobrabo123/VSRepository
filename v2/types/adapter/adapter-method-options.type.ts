import { Ordering } from "../utils/ordering.type";
import { Pagination } from "../utils/pagination.type";
import { VSRepoRelations } from "../vsrepo/vsrepo-relations.type";
import { VSRepoSelect } from "../vsrepo/vsrepo-select.type";

export type AdapterMethodOptions<T> = {
    select?: VSRepoSelect<T>;
    relations?: VSRepoRelations<T>;
    pagination?: Pagination;
    order?: Ordering<T>;
    db?: any;
};
