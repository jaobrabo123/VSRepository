export interface DinamicMethodInfo {
    onlyBaseWheres: boolean;
    ignoreWhere: boolean;
    ignoreOrderByAndPagination: boolean;
    ignoreSelect: boolean;
    ignoreSkipDuplicates: boolean;
    existsMode: boolean;
    keyToMapReplaced: string;
    argsCount: number;
    method: string;
    whereParams: string[];
    otherParams: string[];
    dataIndex?: number;
    updateIndex?: number;
    createIndex?: number;
    skipDuplicates?: boolean;
    whereIndex?: number;
    prismaArgsIndex?: number;
}