import { DINAMIC_METHODS_KEY } from "../constants/dinamic-methods-key.constant";
import { DynamicMethodMetadata } from "../entities/dynamic-method-metadata.entity";
import { validateDynamicMethodConfig } from "../validation/dynamic-method-config.validate";

export function DynamicMethod(config?: unknown): PropertyDecorator {
    const validatedConfig = config ? validateDynamicMethodConfig(config) : undefined;

    return (target: Object, propertyKey: string | symbol) => {
        const methods: DynamicMethodMetadata[] = Reflect.getMetadata(DINAMIC_METHODS_KEY, target) ?? [];

        methods.push(
            new DynamicMethodMetadata(
                propertyKey,
                validatedConfig?.map ?? true,
                validatedConfig?.proxyTo,
                validatedConfig?.whereType,
                validatedConfig?.pushWhere,
                validatedConfig?.fbMode,
                validatedConfig?.injectOrdenation,
                validatedConfig?.injectPagination,
            ),
        );

        Reflect.defineMetadata(DINAMIC_METHODS_KEY, methods, target);
    };
}
