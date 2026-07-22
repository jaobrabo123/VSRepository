import { DINAMIC_METHODS_KEY } from "../constants/dinamic-methods-key.constant";
import { DynamicMethodConfig } from "../decorators/types/dynamic-method-config.type";
import { DynamicMethodMetadata } from "../entities/dynamic-method-metadata.entity";

export function resolveDynamicMethodsMetadata(prototype: any): Record<string | symbol, DynamicMethodConfig> {
    const methods: DynamicMethodMetadata[] | undefined = Reflect.getMetadata(
        DINAMIC_METHODS_KEY,
        prototype,
    );

    const methodsRecord: Record<string | symbol, DynamicMethodConfig> = {};

    if (!methods) return methodsRecord;

    for (const method of methods) {
        const { propertyKey, ...rest } = method;
        methodsRecord[propertyKey] = rest;
    }

    return methodsRecord;
}
