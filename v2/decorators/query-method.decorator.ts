import { VSRepoError } from "../errors/VSRepoError";
import { QUERY_METHODS_KEY } from "../internal/constants/query-methods-key.constant";
import { VSRepoErrorType } from "../internal/enums/vsrepo-errortype.enum";
import { DecoratorsValidator } from "../internal/validators/decorators.validator";
import { QueryMethodOptions } from "../types/decorators/query-method-options.type";
import { VSRepoQuery } from "../types/vsrepo/vsrepo-query.type";

/**
 * @publicApi
 */
export function QueryMethod(value: string, options?: QueryMethodOptions): PropertyDecorator {
    if (typeof value !== "string") {
        throw new VSRepoError(`'value' must be a valid string`, VSRepoErrorType.DECORATOR);
    }

    const validatedConfig: QueryMethodOptions = options
        ? DecoratorsValidator.validateQueryMethodOptions(options)
        : { modifying: false };

    return (target: Object, propertyKey: string | symbol) => {
        const methods: VSRepoQuery[] = Reflect.getMetadata(QUERY_METHODS_KEY, target) ?? [];

        methods.push({ ...validatedConfig, value, propertyKey });

        Reflect.defineMetadata(QUERY_METHODS_KEY, methods, target);
    };
}
