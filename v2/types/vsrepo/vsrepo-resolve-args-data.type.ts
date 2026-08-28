import { VSRepository } from "../../VSRepository";
import { Pagination } from "../utils/pagination.type";
import { VSRepoMethodOptions } from "./vsrepo-methods-options.type";

export interface VSRepoResolveArgsData<T, K> {
    instance: VSRepository<T, K>;
    options: VSRepoMethodOptions<T>;
    withoutWhere?: boolean;
    wherePkValue?: unknown;
    withoutSelect?: boolean;
    specificSelect?: object;
    specificWhere?: object;
    dataPayload?: object;
    createPayload?: object;
    updatePayload?: object;
    pagination?: Pagination;
    ordering?: object | object[];
    ignoreConflicts?: boolean;
    withOrderingAndPagination?: boolean;
    // distinctKeys?: string[];
}