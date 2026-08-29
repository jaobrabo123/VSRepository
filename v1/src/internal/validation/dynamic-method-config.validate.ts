import { DynamicMethodConfig } from "../decorators/types/dynamic-method-config.type";
import { VSRepoDecoratorError } from "../errors/vs-repo.error";
import { methodSchema } from "../utils/schemas.util";
import { isObject } from "./is-object.validate";

export function validateDynamicMethodConfig(config: unknown): DynamicMethodConfig {
    if (!isObject(config)) {
        throw new VSRepoDecoratorError(
            `[VSRepository] (unknown: decorator) 'config' must be a valid object`,
        );
    }

    config["map"] = true;

    const configParsed = methodSchema.safeParse(config);

    if (!configParsed.success) {
        const firstIssue = configParsed.error.issues[0];
        const path = firstIssue?.path.length ? firstIssue.path.join(".") : "config";
        throw new VSRepoDecoratorError(
            `[VSRepository] (unknown: decorator) ${path}: ${firstIssue?.message}`,
        );
    }

    return configParsed.data;
}
