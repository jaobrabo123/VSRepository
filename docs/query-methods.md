<a id="top"></a>

🇺🇸 English | [🇧🇷 Português](./query-methods.pt-BR.md)

[← Back to the table of contents](./README.md)

# Query methods (raw SQL)

`@QueryMethod` bypasses the name-parsing engine entirely and executes a raw SQL statement through the adapter's `query()` method. Use placeholders for the values passed via `args` — never interpolate values directly into the SQL string. **The placeholder syntax depends on the database/driver behind your adapter:** the `$1`, `$2`, ... style used in the examples below is the PostgreSQL convention — MySQL, for instance, uses `?`. Check your adapter's documentation for the exact syntax.

```typescript
class UserRepository extends VSRepository<User, string> {
    @QueryMethod('SELECT * FROM "user" WHERE email = $1')
    declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;

    @QueryMethod('UPDATE "user" SET active = true WHERE id = $1', { modifying: true })
    declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;

    // Only one row is ever expected here, so `singleResult` collapses the
    // array into a single object (or `null` when no row matches).
    @QueryMethod('SELECT * FROM "user" WHERE id = $1 LIMIT 1', { singleResult: true })
    declare findByIdRaw: (arg: QueryMethodArg<[id: string]>) => Promise<User | null>;
}
```

| Option         | Type      | Default | Description                                                                                                                                                                                                                                     |
| -------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modifying`    | `boolean` | `false` | When `true`, the method resolves to the number of affected rows. When `false`, runs as a read query and resolves to the declared return type.                                                                                                   |
| `singleResult` | `boolean` | `false` | When `true`, collapses an array result into its first element (`null` if empty), so you can declare the return type as a single object instead of an array. Has no effect on non-array results (e.g. a `modifying` query's affected-row count). |

Query methods accept `{ args, db? }` at the call site — `db` lets them participate in a `transaction()` block just like base and dynamic methods.

## Spread arguments with `spreadArgs`

By default, a `@QueryMethod` receives its placeholder values through a single `QueryMethodArg` object (`method({ args: [...] })`). Set `spreadArgs: true` to receive them as separate positional arguments instead, JpaRepository style:

```typescript
class UserRepository extends VSRepository<User, string> {
    @QueryMethod('SELECT * FROM "user" WHERE email = $1 AND "userType" = $2', {
        spreadArgs: true,
    })
    declare findByEmailAndType: (
        ...args: QueryArgs<[email: string, userType: string]>
    ) => Promise<User[]>;

    // Instead of using `QueryArgs`, you can also simply set `DbArg` as the last parameter
    @QueryMethod('SELECT * FROM "user" WHERE id = $1', { spreadArgs: true })
    declare findById: (id: string, db?: DbArg) => Promise<User[]>;
}

const admins = await userRepository.findByEmailAndType("joao@email.com", "admin");
```

To run the query against a specific client or transaction instead of the repository's default one, pass `withDb(tx)` as the trailing argument — it wraps `tx` in a `DbArg`, which the resolver recognizes with `instanceof`, so it's never confused with a regular positional argument even if that argument happens to be an object:

```typescript
await userRepository.transaction(async tx => {
    await userRepository.findByEmailAndType("joao@email.com", "admin", withDb(tx));
});
```

`spreadArgs` only affects `@QueryMethod`-declared fields — it's `false` by default, and calling a method declared without it using more than one argument throws, since the single-`QueryMethodArg` call style is expected instead. It has no effect on `query()`, which always accepts `{ args, db? }`.

## Ad-hoc raw queries with `query()`

For one-off raw SQL that doesn't warrant declaring a `@QueryMethod` on the repository class, call `query()` directly — it's available on every `VSRepository` instance and uses the adapter's `query()` under the hood:

```typescript
query<T = any>(query: string, options?: VSRepoQueryOptions<OrmTypes>): Promise<T>;
```

```typescript
const users = await userRepository.query<User[]>('SELECT * FROM "user" WHERE email = $1', {
    args: ["maria@email.com"],
});

const affectedRows = await userRepository.query<number>(
    'UPDATE "user" SET active = true WHERE id = $1',
    { args: ["123"], modifying: true },
);

// Only one row is ever expected here, so `singleResult` collapses the
// array into a single object (or `null` when no row matches).
const user = await userRepository.query<User | null>('SELECT * FROM "user" WHERE id = $1 LIMIT 1', {
    args: ["123"],
    singleResult: true,
});
```

| Option         | Type      | Default                     | Description                                                                                                                                                                                  |
| -------------- | --------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `args`         | `any[]`   | `undefined`                 | Positional parameters injected into the SQL placeholders — the placeholder syntax depends on the database/driver behind your adapter. Never interpolate values directly into the SQL string. |
| `db`           | `any`     | Repository's default client | Database client or transaction to run this query in.                                                                                                                                         |
| `modifying`    | `boolean` | `false`                     | When `true`, returns the number of affected rows.                                                                                                                                            |
| `singleResult` | `boolean` | `false`                     | When `true`, collapses an array result into its first element (`null` if empty). Has no effect on non-array results (e.g. a `modifying` query's affected-row count).                         |

Just like base, dynamic and query methods, `query()` accepts `db` in `options` to participate in a `transaction()` block.

[⬆️ Back to top](#top)