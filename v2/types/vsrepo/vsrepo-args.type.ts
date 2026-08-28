import { AdapterMethodOptions } from "../adapter/adapter-method-options.type";
import { DeepPartial } from "../utils/deep-partial.type";
import { VSRepoWhere } from "./vsrepo-where.type";

export type VSRepoArgs<T> = {
    where?: VSRepoWhere<T>;
    obj?: object;
    create?: object;
    update?: object;
    options?: AdapterMethodOptions<T>;
};
