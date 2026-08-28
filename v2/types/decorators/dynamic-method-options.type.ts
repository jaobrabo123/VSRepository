import { Ordering } from "../utils/ordering.type";

export type DynamicMethodOptions<T = any> = {
    proxyTo?: string;
    injectOrdering?: Ordering<T>;
    // query?: {
    //     value: string;
    //     modifying: boolean;
    // };
};
