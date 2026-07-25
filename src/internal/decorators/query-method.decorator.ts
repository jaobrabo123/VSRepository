import { DINAMIC_METHODS_KEY } from "../constants/dinamic-methods-key.constant";
import { DynamicMethodMetadata } from "../entities/dynamic-method-metadata.entity";
import { validateQueryMethodOptions } from "../validation/query-method-options.validate";
import { QueryMethodOptions } from "../validation/types/query-method-options.type";

export function QueryMethod(value: string, options?: unknown): PropertyDecorator {
    const validatedConfig: QueryMethodOptions = options
        ? validateQueryMethodOptions(options)
        : { modifying: false };

    return (target: Object, propertyKey: string | symbol) => {
        const methods: DynamicMethodMetadata[] =
            Reflect.getMetadata(DINAMIC_METHODS_KEY, target) ?? [];

        methods.push(
            new DynamicMethodMetadata(
                propertyKey,
                true,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                { value, ...validatedConfig },
            ),
        );

        Reflect.defineMetadata(DINAMIC_METHODS_KEY, methods, target);
    };
}
