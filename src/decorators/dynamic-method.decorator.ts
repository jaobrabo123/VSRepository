import { DYNAMIC_METHODS_KEY } from "../internal/constants/dynamic-methods-key.constant";
import { DecoratorsValidator } from "../internal/validators/decorators.validator";
import { DynamicMethodOptions } from "../types/decorators/dynamic-method-options.type";
import { VSRepoMethod } from "../types/vsrepo/vsrepo-method.type";

/**
 * Property decorator used to declare a dynamic method on a `VSRepository` subclass.
 *
 * Applied to a `declare` class field whose name follows one of the supported
 * dynamic-method patterns (e.g. `findByEmail`, `findManyByStatusPaginated`,
 * `upsertById`), the method's behavior is inferred from the field name at
 * construction time, optionally adjusted via `options`.
 *
 * @template T Entity type the decorated method operates on.
 *
 * @example
 * ```typescript
 * class UserRepository extends VSRepository<User, string> {
 *     @DynamicMethod()
 *     declare findByEmail: (email: string) => Promise<User[]>;
 *
 *     @DynamicMethod<User>({ injectOrdering: { createdAt: "desc" } })
 *     declare findByAge: (age: number) => Promise<User[]>;
 * }
 * ```
 *
 * @publicApi
 */
export function DynamicMethod<T = any>(options?: DynamicMethodOptions<T>): PropertyDecorator {
    const validatedOptions = options
        ? DecoratorsValidator.validateDynamicMethodOptions(options)
        : undefined;

    return (target: Object, propertyKey: string | symbol) => {
        const methods: VSRepoMethod[] = Reflect.getMetadata(DYNAMIC_METHODS_KEY, target) ?? [];

        methods.push({ ...validatedOptions, propertyKey });

        Reflect.defineMetadata(DYNAMIC_METHODS_KEY, methods, target);
    };
}
