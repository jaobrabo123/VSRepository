export interface DynamicMethodConfig {
    map: boolean;
    proxyTo?: string;
    whereType?: "overwrite" | "extending";
    pushWhere?: object;
    fbMode?: "one" | "list";
    injectOrdenation?: object;
    injectPagination?: object;
    query?: {
        value: string;
        modifying: boolean;
    };
}
