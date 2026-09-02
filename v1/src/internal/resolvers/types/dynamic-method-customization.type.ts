import { Pagination } from "../../validation/types/pagination.type";

export interface DynamicMethodCustomization {
    skipDuplicates?: boolean;
    orderPosition?: number;
    paginationPosition?: number;
    injectOrdering?: object | object[];
    injectPagination?: Pagination;
    distinctKeys?: string[];
}