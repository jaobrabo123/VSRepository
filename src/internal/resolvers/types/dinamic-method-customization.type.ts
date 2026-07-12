import { Pagination } from "../../validation/types/pagination.type";

export interface DinamicMethodCustomization {
    skipDuplicates?: boolean;
    orderPosition?: number;
    paginationPosition?: number;
    injectOrdenation?: object | object[];
    injectPagination?: Pagination;
    distinctKeys?: string[];
}