import { DYNAMIC_METHODS_KEY } from "../constants/dynamic-methods-key.constant";
import { DynamicMethodMetadata } from "../entities/dynamic-method-metadata.entity";
import { validateDynamicMethodConfig } from "../validation/dynamic-method-config.validate";

export function DynamicMethod(config?: unknown): PropertyDecorator {
    const validatedConfig = config ? validateDynamicMethodConfig(config) : undefined;

    return (target: Object, propertyKey: string | symbol) => {
        const methods: DynamicMethodMetadata[] = Reflect.getMetadata(DYNAMIC_METHODS_KEY, target) ?? [];

        methods.push(
            new DynamicMethodMetadata(
                propertyKey,
                true,
                validatedConfig?.proxyTo,
                validatedConfig?.whereType,
                validatedConfig?.pushWhere,
                validatedConfig?.fbMode,
                validatedConfig?.injectOrdenation,
                validatedConfig?.injectPagination,
            ),
        );

        Reflect.defineMetadata(DYNAMIC_METHODS_KEY, methods, target);
    };
}
