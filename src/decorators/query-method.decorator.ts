import { VSRepoError } from "../errors/VSRepoError";
import { QUERY_METHODS_KEY } from "../internal/constants/query-methods-key.constant";
import { VSRepoErrorType } from "../internal/enums/vsrepo-error-type.enum";
import { DecoratorsValidator } from "../internal/validators/decorators.validator";
import { QueryMethodOptions } from "../types/decorators/query-method-options.type";
import { VSRepoQuery } from "../types/vsrepo/vsrepo-query.type";

/**
 * Property decorator used to declare a raw SQL query method on a `VSRepository`
 * subclass, bypassing name-based method parsing entirely.
 *
 * Applied to a `declare` class field, it executes `value` directly through the
 * adapter's `query()` method, with parameters injected positionally via the
 * `args` array passed at the call site (`$1`, `$2`, ... placeholders) — or,
 * with `spreadArgs: true`, via separate positional arguments instead.
 *
 * @param value Raw SQL statement to execute. Use `$1`, `$2`, ... placeholders for
 * the values that will be passed via `args` — never interpolate values directly into `value`.
 * @param options Optional configuration; set `modifying: true` for `INSERT`/`UPDATE`/`DELETE` statements,
 * `singleResult: true` to collapse an array result into its first element, and
 * `spreadArgs: true` to receive placeholder values as separate arguments instead of a
 * single `QueryMethodArg` object — see {@link QueryMethodOptions.singleResult} and
 * {@link QueryMethodOptions.spreadArgs}.
 *
 * @example
 * ```typescript
 * class UserRepository extends VSRepository<User, string> {
 *     @QueryMethod('SELECT * FROM "user" WHERE email = $1')
 *     declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;
 *
 *     @QueryMethod('UPDATE "user" SET active = true WHERE id = $1', { modifying: true })
 *     declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;
 *
 *     // Only one row is ever expected here, so `singleResult` collapses the
 *     // array into a single object (or `null` when no row matches).
 *     @QueryMethod('SELECT * FROM "user" WHERE id = $1 LIMIT 1', { singleResult: true })
 *     declare findByIdRaw: (arg: QueryMethodArg<[id: string]>) => Promise<User | null>;
 *
 *     // `spreadArgs: true` takes placeholder values as separate arguments,
 *     // JpaRepository style, instead of a single `{ args: [...] }` object.
 *     // An optional trailing `withDb(tx)` runs the query in a transaction.
 *     @QueryMethod('SELECT * FROM "user" WHERE email = $1 AND "userType" = $2', {
 *         spreadArgs: true,
 *     })
 *     declare findByEmailAndType: (
 *         ...args: QueryArgs<[email: string, userType: string]>
 *     ) => Promise<User[]>;
 * }
 *
 * await userRepository.findByEmailAndType("joao@email.com", "admin");
 * await userRepository.findByEmailAndType("joao@email.com", "admin", withDb(tx));
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
