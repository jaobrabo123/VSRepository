import { DynamicMethodOptions } from "../decorators/dynamic-method-options.type";

export type VSRepoMethod<T = any> = DynamicMethodOptions<T> & {
    propertyKey: string | symbol;
};
