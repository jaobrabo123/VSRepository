import { Pagination } from "./pagination.type";

export interface Method {
    map: boolean;
    selectModel?: string | false;
    whereType?: "overwrite" | "extending";
    proxyTo?: string;
    pushWhere?: object;
    fbMode?: "one" | "list";
    injectOrdenation?: object | object[];
    injectPagination?: Pagination;
}
