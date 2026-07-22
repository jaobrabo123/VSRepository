import { resolveDynamicMethodsMetadata } from "./internal/resolvers/dynamic-methods-metadata.resolve";
import { validateBuildConfig } from "./internal/validation/build-config.validate";
import { isObject } from "./internal/validation/is-object.validate";
import { VSRepoConfigError, VSRepository } from "./VSRepository";

import "reflect-metadata";

export { DynamicMethod } from "./internal/decorators/dynamic-method.decorator";

export class DynamicRepository extends VSRepository {
    constructor(prisma: unknown, config: unknown) {
        if (!isObject(config)) {
            throw new VSRepoConfigError(
                `[VSRepository] (unknown: config) 'config' must be a valid object`,
            );
        }

        const { build: buildConfig = {}, ...constructorConfig } = config;

        super(constructorConfig);

        const dynamicMethodsMetadata = resolveDynamicMethodsMetadata(this.constructor.prototype);
        this.methods = dynamicMethodsMetadata;

        const buildConfigValidated = validateBuildConfig(buildConfig, this);

        this.build(prisma, { ...buildConfigValidated, freeze: false }, this);
    }
}
