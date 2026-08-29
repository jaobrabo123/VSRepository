import { QueryMethodOptions } from "../decorators/query-method-options.type";

export type VSRepoQuery = QueryMethodOptions & {
    propertyKey: string | symbol;
    value: string;
};
