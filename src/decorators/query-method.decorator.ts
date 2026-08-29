import { VSRepoError } from "../errors/VSRepoError";
import { QUERY_METHODS_KEY } from "../internal/constants/query-methods-key.constant";
import { VSRepoErrorType } from "../internal/enums/vsrepo-errortype.enum";
import { DecoratorsValidator } from "../internal/validators/decorators.validator";
import { QueryMethodOptions } from "../types/decorators/query-method-options.type";
import { VSRepoQuery } from "../types/vsrepo/vsrepo-query.type";

/**
 * Property decorator used to declare a raw SQL query method on a `VSRepository`
 * subclass, bypassing name-based method parsing entirely.
 *
 * Applied to a `declare` class field, it executes `value` directly through the
 * adapter's `query()` method, with parameters injected positionally via the
 * `args` array passed at the call site (`$1`, `$2`, ... placeholders).
 *
 * @param value Raw SQL statement to execute. Use `$1`, `$2`, ... placeholders for
 * the values that will be passed via `args` — never interpolate values directly into `value`.
 * @param options Optional configuration; set `modifying: true` for `INSERT`/`UPDATE`/`DELETE` statements.
 *
 * @example
 * ```typescript
 * class UserRepository extends VSRepository<User, string> {
 *     @QueryMethod('SELECT * FROM "user" WHERE email = $1')
 *     declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;
 *
 *     @QueryMethod('UPDATE "user" SET active = true WHERE id = $1', { modifying: true })
 *     declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;
 * }
 * ```
 *
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
