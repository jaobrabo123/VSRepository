import { Ordering } from "../utils/ordering.type";

/**
 * @publicApi
 */
export type DynamicMethodOptions<T = any> = {
    proxyTo?: string;
    injectOrdering?: Ordering<T>;
};
