import { DINAMIC_METHODS_KEY } from "../constants/dinamic-methods-key.constant";
import { DynamicMethodMetadata } from "../entities/dynamic-method-metadata.entity";
import { VSRepoDecoratorError } from "../errors/vs-repo.error";
import { validateQueryMethodOptions } from "../validation/query-method-options.validate";
import { QueryMethodOptions } from "../validation/types/query-method-options.type";

export function QueryMethod(value: unknown, options?: unknown): PropertyDecorator {
    if (typeof value !== "string") {
        throw new VSRepoDecoratorError(
            `[VSRepository] (unknown: decorator) 'value' must be a valid string`,
        );
    }

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
