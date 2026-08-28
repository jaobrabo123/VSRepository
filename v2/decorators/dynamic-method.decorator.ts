import { DYNAMIC_METHODS_KEY } from "../internal/constants/dynamic-methods-key.constant";
import { DecoratorsValidator } from "../internal/validators/decorators.validator";
import { DynamicMethodOptions } from "../types/decorators/dynamic-method-options.type";
import { VSRepoMethod } from "../types/vsrepo/vsrepo-method.type";

/**
 * @publicApi
 */
export function DynamicMethod<T = any>(options?: DynamicMethodOptions<T>): PropertyDecorator {
    const validatedOptions = options
        ? DecoratorsValidator.validateDynamicMethodOptions(options)
        : undefined;

    return (target: Object, propertyKey: string | symbol) => {
        const methods: VSRepoMethod[] = Reflect.getMetadata(DYNAMIC_METHODS_KEY, target) ?? [];

        methods.push({ ...validatedOptions, propertyKey });

        Reflect.defineMetadata(DYNAMIC_METHODS_KEY, methods, target);
    };
}
