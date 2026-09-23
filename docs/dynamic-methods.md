<a id="top"></a>

🇺🇸 English | [🇧🇷 Português](./dynamic-methods.pt-BR.md)

[← Back to the table of contents](./README.md)

# Dynamic methods

Dynamic methods are declared as a `declare` field annotated with `@DynamicMethod()`. Their behavior — which adapter method to call, which filters to apply, and how arguments map to them — is inferred entirely from the field's **name**.

```typescript
class UserRepository extends VSRepository<User, string> {
    @DynamicMethod()
    declare findByEmail: (email: string, options?: MethodOptions<User>) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmail: (email: string) => Promise<User | null>;

    @DynamicMethod()
    declare updateById: (id: string, data: DeepPartial<User>) => Promise<User>;

    // Where-based: VSRepoWhere<T> as the first param, pagination penultimate, MethodOptions last
    @DynamicMethod()
    declare findWherePaginated: (
        where: VSRepoWhere<User>,
        pagination: Pagination,
        options?: MethodOptions<User>,
    ) => Promise<User[]>;

    // field filters, then pagination, then MethodOptions
    @DynamicMethod()
    declare findByNameIgnoreCaseOrAgeBetweenOrderByCreatedAtAscPaginated: (
        name: string,
        age: [number, number],
        pagination: Pagination,
        options?: MethodOptions<User>,
    ) => Promise<User[]>;
}
```

> Want the return type to follow the `select`/`relations` you pass, instead of always being the whole entity? Declare the method with [`InferMethodType`](#strict-return-typing-with-infermethodtype).

## Available prefixes

| Prefix                     | Adapter method        | Notes                                                                                                                                   |
| -------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `findBy`                   | `findMany`            | Field filters follow the prefix.                                                                                                        |
| `findOneBy`                | `findOne`             | Field filters follow the prefix; single result.                                                                                         |
| `findOneOrThrowBy`         | `findOneOrThrow`      | Throws if no record is found.                                                                                                           |
| `findOneOrThrow`           | `findOneOrThrow`      | No field filters; applies only soft-delete/`see`.                                                                                       |
| `findOneOrThrowWhere`      | `findOneOrThrow`      | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `findWhere`                | `findMany`            | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `findOneWhere`             | `findOne`             | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `findOne`                  | `findOne`             | No field filters; applies only soft-delete/`see`.                                                                                       |
| `countBy`                  | `count`               | Field filters follow the prefix.                                                                                                        |
| `countWhere`               | `count`               | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `count`                    | `count`               | No field filters.                                                                                                                       |
| `existsBy`                 | `exists`              | Returns `boolean`.                                                                                                                      |
| `existsWhere`              | `exists`              | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `create`                   | `create`              | Receives `DeepPartial<Entity>` as argument.                                                                                             |
| `createMany`               | `createMany`          | Receives `DeepPartial<Entity>[]` as argument; supports `IgnoreConflicts`.                                                               |
| `createManyReturning`      | `createManyReturning` | Receives `DeepPartial<Entity>[]` as argument; supports `IgnoreConflicts`; returns the created records (`T[]`) instead of `CountResult`. |
| `updateBy`                 | `update`              | Field filters + `DeepPartial<Entity>` as argument.                                                                                      |
| `updateWhere`              | `update`              | Receives a `VSRepoWhere<T>` as the first argument, then `DeepPartial<Entity>`.                                                          |
| `updateManyBy`             | `updateMany`          | Field filters + `DeepPartial<Entity>`.                                                                                                  |
| `updateManyWhere`          | `updateMany`          | Receives a `VSRepoWhere<T>` as the first argument, then `DeepPartial<Entity>`.                                                          |
| `updateManyReturningBy`    | `updateManyReturning` | Field filters + `DeepPartial<Entity>`; returns updated records.                                                                         |
| `updateManyReturningWhere` | `updateManyReturning` | Receives a `VSRepoWhere<T>` as the first argument, then `DeepPartial<Entity>`; returns updated records.                                 |
| `upsertBy`                 | `upsert`              | Field filters + `create`/`update` payloads.                                                                                             |
| `upsertWhere`              | `upsert`              | Receives a `VSRepoWhere<T>` as the first argument, then `create`/`update` payloads.                                                     |
| `deleteBy`                 | `delete`              | Field filters follow the prefix.                                                                                                        |
| `deleteWhere`              | `delete`              | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `deleteManyBy`             | `deleteMany`          | Field filters follow the prefix.                                                                                                        |
| `deleteManyWhere`          | `deleteMany`          | Receives a `VSRepoWhere<T>` as the first argument.                                                                                      |
| `deleteManyReturningBy`    | `deleteManyReturning` | Field filters follow the prefix; returns deleted records.                                                                               |
| `deleteManyReturningWhere` | `deleteManyReturning` | Receives a `VSRepoWhere<T>` as the first argument; returns deleted records.                                                             |

> `groupBy` is **not planned** for v2 — it doesn't map cleanly onto the ORM-agnostic contract. `aggregate` as a separate prefix is also unlikely to be implemented: the most common aggregate operations (`sum`, `average`, `min`, `max`, `increment`, `decrement`, `multiply`, `divide`) are already available as dedicated base methods — see [Atomic and aggregate methods](./base-methods.md#atomic-and-aggregate-methods). For anything more complex, use a `@QueryMethod` with raw SQL.

## Field filters

Applied as suffixes to the field name inside the method (same idea as v1, one renamed suffix):

| Suffix             | Meaning                                                                                                                                                       | Argument                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| _(none)_ / `Equals` | equality (`=`)                                                                                                                                              | yes                                    |
| `Not` / `NotEquals` | negation                                                                                                                                                      | yes                                    |
| `In`               | is one of                                                                                                                                                     | yes (array)                            |
| `NotIn`            | is none of                                                                                                                                                    | yes (array)                            |
| `Contains`         | substring match                                                                                                                                               | yes                                    |
| `NotContains`      | negated substring match                                                                                                                                       | yes                                    |
| `StartsWith`       | prefix match                                                                                                                                                  | yes                                    |
| `NotStartsWith`    | negated prefix match                                                                                                                                          | yes                                    |
| `EndsWith`         | suffix match                                                                                                                                                  | yes                                    |
| `NotEndsWith`      | negated suffix match                                                                                                                                          | yes                                    |
| `GreaterThan`      | `>`                                                                                                                                                           | yes                                    |
| `GreaterThanEqual` | `>=`                                                                                                                                                          | yes                                    |
| `LessThan`         | `<`                                                                                                                                                           | yes                                    |
| `LessThanEqual`    | `<=`                                                                                                                                                          | yes                                    |
| `Between`          | inclusive range                                                                                                                                               | yes (`[min, max]` tuple)               |
| `NotBetween`       | outside an inclusive range                                                                                                                                    | yes (`[min, max]` tuple)               |
| `IsNull`           | field is `null`                                                                                                                                               | no                                     |
| `IsNotNull`        | field is not `null`                                                                                                                                           | no                                     |
| `IsTrue`           | field is `true`                                                                                                                                               | no                                     |
| `IsFalse`          | field is `false`                                                                                                                                              | no                                     |
| `IgnoreCase`       | case-insensitive combinator for text filters                                                                                                                  | yes _(renamed from v1's `Insensitive`)_ |
| `Optional`         | optional flag to make it explicit that the parameter is optional      | yes _(in practice, nothing changes)_                                      |

```typescript
@DynamicMethod()
declare findByNameContainsIgnoreCase: (name: string) => Promise<User[]>;

@DynamicMethod()
declare findByAgeBetween: (age: [number, number]) => Promise<User[]>;
```

> **Keyword collisions in field names:** a suffix/operator is only recognized at a camelCase boundary — followed by an uppercase letter, a non-ASCII character, or (for field suffixes) the end of the name — so `findByOrganizationId` and `findByNotes` resolve to the fields `organizationId` and `notes`, not to the `Or`/`Not` keywords. This still leaves one case ambiguous: a field whose name genuinely *ends* at such a boundary with the same letters as a keyword (e.g. `checkIn`, which reads as field `check` + the `In` suffix by default). Append `Equals` (or `NotEquals`) to force equality and disambiguate: `findByCheckInEquals` resolves to the field `checkIn`.

## Logical operators

| Operator | Usage in the name               | Example                                             |
| -------- | ------------------------------- | --------------------------------------------------- |
| `And`    | between two fields              | `findOneByIdAndEmail`                               |
| `Or`     | between two fields              | `findByNameOrEmail`                                 |
| `AND`    | splits a final block into `AND` | `findByEmailOrNameANDActiveStatusAndAgeGreaterThan` |

`AND` (all caps) rules, same as v1: only one `AND` per method name is allowed; every field connected with `And` after it is nested inside `AND: []`; `Or` cannot appear after an `AND` — using it that way throws a `VSRepoError` (`RESOLVER`) when the repository is constructed. See [Error handling](./error-handling.md#error-handling).

## Relation filters

Filter by fields of related entities. Internally these map to the `_some`/`_every`/`_none`/`_with`/`_without` operators of `VSRepoWhere` (see [`select` and `relations`](./select-and-relations.md#select-and-relations) for the eager-loading counterpart).

| Suffix         | Meaning                                         | Restriction                                                |
| -------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `Some`         | at least one related record matches             | to-many relations only                                     |
| `SomeField`    | filters within the related records              | to-many relations only                                     |
| `Every`        | every related record matches                    | to-many relations only (needs `Field` to be a real filter) |
| `EveryField`   | filters within the related records              | to-many relations only                                     |
| `None`         | no related record matches                       | to-many relations only                                     |
| `NoneField`    | filters within the related records              | to-many relations only                                     |
| `With`         | related record exists                           | to-one relations only                                      |
| `WithField`    | filters a field within the related record       | to-one relations only                                      |
| `Without`      | related record does not exist                   | to-one relations only                                      |
| `WithoutField` | negated filter on a field of the related record | to-one relations only                                      |

```typescript
@DynamicMethod()
declare findByAddressWithCityStartsWithIgnoreCase: (city: string) => Promise<User[]>;

@DynamicMethod()
declare findByProductsSome: () => Promise<User[]>;
```

## Ordering, pagination and distinct

| Suffix                                     | Effect                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Paginated`                                | Injects a `pagination` argument (`{ limit?, offset? }`) as the **penultimate** parameter (before the optional `MethodOptions`).                                    |
| `Ordered`                                  | Injects an `order: Ordering<T>` argument as the **penultimate** parameter (before the optional `MethodOptions`).                                                   |
| `OrderedAndPaginated`                      | Injects `order` as the antepenultimate, then `pagination` as the penultimate — both before `MethodOptions`.                                                        |
| `PaginatedAndOrdered`                      | Injects `pagination` as the antepenultimate, then `order` as the penultimate — both before `MethodOptions`.                                                        |
| `OrderBy<Field>Asc` / `OrderBy<Field>Desc` | Bakes a fixed ordering directly into the method name — chain fields with `And` (e.g. `OrderByCreatedAtAscAndNameDesc`). No `order` argument needed. *Note: If you do not specify `Asc` or `Desc`, it defaults to `Asc`.* |
| `Distinct<Field>And<Field>...`             | Bakes fixed `distinct` fields directly into the method name (only valid on `findBy`/`findWhere`-family methods).                                                   |
| `IgnoreConflicts`                          | On `createMany`/`createManyReturning`, skips records that would violate a unique constraint instead of throwing. _(Renamed from v1's `SkipDuplicates`.)_           |

> ⚠️ **Parameter order:** `pagination` and `order` are always placed **before** the optional `MethodOptions<T>` last argument. When both `order` and `pagination` are present, their relative order follows the suffix name (`OrderedAndPaginated` → order, pagination; `PaginatedAndOrdered` → pagination, order).
>
> Using `Paginated`/`Ordered`/`OrderBy`, `Distinct` or `IgnoreConflicts` on a prefix that doesn't support them (e.g. `Distinct` on `findOneBy`, `Paginated` on `existsBy`, `IgnoreConflicts` on `create`) throws a `VSRepoError` (`RESOLVER`) when the repository is constructed, rather than silently becoming part of the field name.

```typescript
// Paginated: pagination is the penultimate param (before MethodOptions)
@DynamicMethod()
declare findByActiveOrderByCreatedAtDescPaginated:
    (active: boolean, pagination: Pagination, options?: MethodOptions<User>) => Promise<User[]>;

// OrderedAndPaginated: order, then pagination, then MethodOptions
@DynamicMethod()
declare findByNameContainsIgnoreCaseOrderedAndPaginated:
    (name: string, order: Ordering<User>, pagination: Pagination, options?: MethodOptions<User>) => Promise<User[]>;

@DynamicMethod()
declare createManyIgnoreConflicts: (data: DeepPartial<User>[]) => Promise<{ count: number }>;

// createManyReturning: same as createMany, but returns the created records
@DynamicMethod()
declare createManyReturningIgnoreConflicts: (data: DeepPartial<User>[]) => Promise<User[]>;

// findOne with no filter (equivalent to findOneOrThrow with no filter, but returns null instead of throwing)
@DynamicMethod()
declare findOne: (options?: MethodOptions<User>) => Promise<User | null>;
```

> ⚠️ **Precedence between `Distinct` and `OrderBy`:** when both are used in the same method name, **`Distinct` must come before `OrderBy`**:
>
> ```typescript
> @DynamicMethod()
> declare findByActiveDistinctNameOrderByCreatedAtDesc:
>     (active: boolean) => Promise<User[]>;
> ```
>
> Putting `OrderBy` before `Distinct` (e.g. `findByActiveOrderByCreatedAtDescDistinctName`) is not a valid pattern and won't be parsed as expected.

## Decorator options

`@DynamicMethod<T>(options?)` accepts:

| Option           | Type          | Description                                                                                                                      |
| ---------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `proxyTo`        | `string`      | Redirects the method's logic to another valid dynamic-method pattern — useful for names that don't follow the naming convention. |
| `injectOrdering` | `Ordering<T>` | Fixed ordering automatically injected, overriding the repository's `defaultOrdering`.                                            |

```typescript
// proxyTo: gives the method a custom name while reusing an existing pattern
@DynamicMethod<User>({ proxyTo: "findByEmail" })
declare buscarPorEmail: (email: string, options?: MethodOptions<User>) => Promise<User[]>;

// injectOrdering: always sorts by createdAt desc, overriding defaultOrdering
@DynamicMethod<User>({ injectOrdering: { createdAt: "desc" } })
declare findByStatus: (status: string) => Promise<User[]>;
```

## Strict return typing with `InferMethodType`

Normally you write a dynamic method's signature by hand, and its return is whatever you declare (usually the whole entity). `InferMethodType<Args, Return, OrmTypes?>` declares the method for you and infers the return **on each call** from the `select`/`relations` you pass — with the same rules as [`InferMethodReturn`](./select-and-relations.md#strict-return-typing-with-infermethodreturn):

```typescript
class UserRepository extends VSRepository<User, string, MyOrmTypes> {
    @DynamicMethod()
    declare findByName: InferMethodType<[name: string], User[], MyOrmTypes>;

    // the third generic (OrmTypes) is optional
    @DynamicMethod()
    declare findOneByEmail: InferMethodType<[email: string], User | null>;
}

await userRepository.findByName("John");
// { id: string; name: string; email: string }[]  (only the scalar fields)

await userRepository.findByName("John", { select: { id: true, products: { id: true } } });
// { id: string; products: { id: string }[] }[]

await userRepository.findOneByEmail("john@example.com", { relations: { address: true } });
// { id: string; name: string; email: string; address: Address | null } | null
```

| Generic    | Description                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Args`     | Tuple with the method's positional arguments, **without** `options` — e.g. `[name: string]` or `[where: VSRepoWhere<User>, pagination: Pagination]`.         |
| `Return`   | What the method resolves to: `Entity`, `Entity \| null` or `Entity[]`. The entity type used for `select`/`relations` is taken from here.                     |
| `OrmTypes` | _Optional._ `VSRepoOrmTypes` for your ORM, used to type the `db` option (see [Creating a repository](../README.md#creating-a-repository)). Defaults to `VSRepoOrmTypes`. |

- `options` (`MethodOptions<Entity, OrmTypes>`) is always the **last**, optional parameter, after every argument in `Args`. If one of those arguments is optional, pass `undefined` explicitly to reach `options`.
- Without `options` the result has only the scalar fields; with them it follows the [same rules](./select-and-relations.md#strict-return-typing-with-infermethodreturn) as `InferMethodReturn` (including `select` winning over `relations`).
- Unknown keys in `select`/`relations` (at any depth) are rejected at compile time, and the editor autocompletes them — just like with a plain `MethodOptions<Entity>` parameter.
- It works together with the [decorator options](#decorator-options) (`proxyTo`, `injectOrdering`).
- It is meant for dynamic methods that return entities (`findBy…`, `findOneBy…`, `findWhere…`, …). Methods that don't — `countBy…`, `existsBy…` — keep their regular signature.

[⬆️ Back to top](#top)