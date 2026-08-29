import { VSRepository } from "../../../v2/VSRepository";
import { Pagination } from "../utils/pagination.type";
import { MethodOptions } from "../utils/methods-options.type";

export interface VSRepoResolveArgsData<T, K> {
    instance: VSRepository<T, K>;
    options: MethodOptions<T>;
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
    distinctKeys?: string[];
}