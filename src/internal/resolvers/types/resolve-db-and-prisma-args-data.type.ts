import { BaseMethodConfigWithSelect } from "../../validation/types/base-methods.type";
import { Pagination } from "../../validation/types/pagination.type";
import { SeeMode } from "../../validation/types/see-mode.type";
import { RepositoryBuildInstance } from "./repository-build-instance.type";

export interface ResolveDbAndPrismaArgsData {
    instance: RepositoryBuildInstance;
    baseConfig: BaseMethodConfigWithSelect;
    options: unknown;
    alreadyValidatedOptions?: boolean;
    withoutWhere?: boolean;
    wherePkValue?: unknown;
    withoutSelect?: boolean;
    specificSelect?: object;
    specificWhere?: object;
    dataPayload?: object;
    createPayload?: object;
    updatePayload?: object;
    pushWhere?: object;
    pagination?: Pagination;
    ordenation?: object | object[];
    skipDuplicates?: boolean;
    forceSeeMode?: SeeMode;
    withOrdenationAndPagination?: boolean;
}
