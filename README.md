<div align="center">
  <img src="https://res.cloudinary.com/ddbfifdxd/image/upload/w_200,q_auto,f_auto/v1786386427/VS_logo_TextoAbaixo_yev4tq.png" alt="VSRepository Logo" width="200"/>

  <p style="margin-top: 12px;">
    <img src="https://img.shields.io/npm/v/vsrepo?style=flat-square" alt="npm version"/>
    <img src="https://img.shields.io/npm/l/vsrepo?style=flat-square" alt="npm license"/>
    <img src="https://img.shields.io/npm/dt/vsrepo?style=flat-square" alt="npm downloads"/>
    <img src="https://img.shields.io/badge/inspired%20by-JpaRepository-E73121?style=flat-square" alt="inspired by JpaRepository"/>
  </p>
</div>

# VSRepository v2

🇺🇸 You're reading the English version. [🇧🇷 Ler em português](./README.pt-BR.md)

> ✅ **Released.** VSRepository v2.0.0 (the ORM-agnostic core) and the [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) are both published and ready to use. Prisma 7 is the first fully supported adapter; other ORMs (TypeORM, Drizzle, etc.) are still in progress — see [Adapter status](#adapter-status). If you need the previous Prisma-only release, use the [`v1`](https://github.com/jaobrabo123/VSRepository/tree/v1) code/docs instead.

**ORM-agnostic** repository pattern library, with full **TypeScript** support and automatic **type inference**. VSRepository v2 is a rewrite of the [v1](https://github.com/jaobrabo123/VSRepository/tree/v1) library: instead of talking to Prisma directly, the core now delegates every operation to a pluggable **adapter**, so the same repository API can work against Prisma, TypeORM, or any other ORM/database that implements the adapter contract.

VSRepository lets you create strongly-typed repositories with:

- Automatic **base methods**: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `merge`, `getAll`, `total`, `has`
- **Native soft-delete**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Dynamic methods** inferred from a `declare` field name via the `@DynamicMethod` decorator: `findByEmail`, `findManyByStatusPaginated`, `updateById`
- **Raw SQL query methods** via the new `@QueryMethod` decorator, bypassing the name-parsing engine entirely
- Ad-hoc **`select`/`relations`** per call — no more pre-declared named projections
- **Type safety** across 100% of operations
- Native ORM **transactions**, shared across repositories
- An **ORM-agnostic core** — the same repository class works with any `VSRepoAdapter` implementation

---

## Table of contents

- [What changed from v1](#what-changed-from-v1)
- [Adapter status](#adapter-status)
- [Installation](#installation)
- [Basic usage](#basic-usage)
- [Constructor options](#constructor-options)
- [Base methods](#base-methods)
- [Soft-delete](#soft-delete)
- [Atomic and aggregate methods](#atomic-and-aggregate-methods)
    - [Which fields are eligible](#which-fields-are-eligible)
    - [Writing an adapter](#writing-an-adapter)
- [`select` and `relations`](#select-and-relations)
- [Dynamic methods](#dynamic-methods)
    - [Available prefixes](#available-prefixes)
    - [Field filters](#field-filters)
    - [Logical operators](#logical-operators)
    - [Relation filters](#relation-filters)
    - [Ordering, pagination and distinct](#ordering-pagination-and-distinct)
    - [Decorator options](#decorator-options)
- [Query methods (raw SQL)](#query-methods-raw-sql)
    - [Ad-hoc raw queries with `query()`](#ad-hoc-raw-queries-with-query)
- [Transactions](#transactions)
- [Utility types](#utility-types)
- [Writing your own adapter](#writing-your-own-adapter)
- [Error handling](#error-handling)
    - [`VSRepoAdapterError` and `AdapterErrorCode`](#vsrepoadaptererror-and-adaptererrorcode)
- [Logging](#logging)
- [Development](#development)
- [Requirements](#requirements)
- [Contributing](#contributing)

---

## What changed from v1

If you're coming from the [v1](https://github.com/jaobrabo123/VSRepository/tree/v1) code/docs, here's the short version. See each linked section for details.

| Area                                         | v1                                                                                                              | v2                                                                                                                                                                                                                                   |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Database access                              | Talks to **Prisma** directly, bundled in the core package                                                       | Talks to a **`VSRepoAdapter`**; ORM support ships as separate packages (`@vsrepo/prisma7-adapter`, `@vsrepo/typeorm-adapter`, ...) instead of being bundled in the core `vsrepo` package                                             |
| Defining a repository                        | Functional `setupVSRepo<T, M>()({...}).build(prisma)`, **or** a `DynamicRepository` class                       | A single **class-based** API: `extends VSRepository<Entity, PKType, OrmTypes>`                                                                                                                                                       |
| Dynamic methods                              | `methods: { findByEmail: { map: true } }` config object                                                         | `@DynamicMethod()` decorator on a `declare` field                                                                                                                                                                                    |
| Data projections                             | Named, reusable `selectModels` + `defaultSelectModel`                                                           | Ad-hoc `select`/`relations` passed per call (no named models)                                                                                                                                                                        |
| Eager loading                                | `include`/`includeModels` (Prisma-specific)                                                                     | ORM-agnostic `relations` option                                                                                                                                                                                                      |
| Global filters                               | `requiredWhere` (any arbitrary filter, always applied)                                                          | **Removed**; Now it only accepts `softRemoveKey` + `see: "active" \| "removed" \| "all"`                                                                                                                                             |
| Case-insensitive filter suffix               | `Insensitive`                                                                                                   | `IgnoreCase`                                                                                                                                                                                                                         |
| Inline ordering in method name               | Not supported (`order` had to be passed as an argument via `Ordered`/`Paginated`)                               | `OrderBy<Field>Asc`/`OrderBy<Field>Desc` chains baked directly into the method name                                                                                                                                                  |
| Duplicate handling on `createMany`           | `SkipDuplicates` suffix                                                                                         | `IgnoreConflicts` suffix                                                                                                                                                                                                             |
| `aggregate` / `groupBy`                      | Supported (Prisma-native passthrough)                                                                           | **Not implemented yet**                                                                                                                                                                                                              |
| Error types                                  | `VSRepoError` + subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`, `VSRepoRuntimeError`) | A base `VSRepoError` class with a `type: VSRepoErrorType` field (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`, `ADAPTER`), plus a `VSRepoAdapterError` subclass carrying an `AdapterErrorCode` and the original ORM error |
| Debug logging                                | `showWorking: true` boolean                                                                                     | `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) + `logSlowThresholdMs` for slow-query warnings                                                                                                                                |
| `vsrepo generate` CLI (type generation step) | Required before use                                                                                             | Not part of the v2 core — types come directly from your entity/ORM types                                                                                                                                                             |
| CRUD extras                                  | `patchList`, raw `options.select`/`options.include`                                                             | `select`/`relations` are the default (always "raw"); `patch`/`merge` keep the same semantics. **`patchList` was removed** — for a batch partial update, use a `updateManyBy`/`updateManyWhere` dynamic method instead                |

---

## Adapter status

VSRepository v2 is **ORM-agnostic by design**. The core package (`vsrepo`) only ships the repository class, the decorators, the name-parsing engine, error handling and logging — it does **not** ship a production adapter. Actual ORM/database support is meant to live in **separate, independently versioned packages**, one per ORM (and, where it makes sense, one per major ORM version), for example:

- `@vsrepo/prisma7-adapter`
- `@vsrepo/prisma8-adapter`
- `@vsrepo/typeorm-adapter`
- `@vsrepo/drizzle-adapter`

The Prisma 7 adapter has now been published to npm as `@vsrepo/prisma7-adapter` — it's currently the **only** published adapter. Adapters for the other ORMs listed above (Prisma 8, TypeORM, Drizzle) are **planned**; they just haven't been published yet. Until an official `@vsrepo/*-adapter` package exists for your ORM, you're welcome to write your own for your project, and if you'd like, publish it and open a PR to help grow the ecosystem — contributions here are very welcome.

| Adapter                                                                                  | Status                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma 7 (`@vsrepo/prisma7-adapter`)                                                     | 🟢 **Released** — published to npm, implements the `VSRepoAdapter` contract (CRUD, relations, transactions, `merge`, logging) with tests; see [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) for source and docs. **Note:** the atomic/aggregate methods (`incrementOne`, `decrementOne`, `multiplyOne`, `divideOne`, `sum`, `average`, `min`, `max` — see [Atomic and aggregate methods](#atomic-and-aggregate-methods)) were added to the `VSRepoAdapter` contract after this adapter's last release; confirm its changelog/version implements them before relying on `increment`/`sum`/etc. against Prisma 7. |
| TypeORM (`@vsrepo/typeorm-adapter`)                                                      | 🟡 **Planned, not published yet.** Only a reference `where`-clause parser (`parseVSRepoWhere`) was written to validate the design; it's the planned starting point for the future `@vsrepo/typeorm-adapter` package. Community contributions toward this are welcome. |
| Other ORMs (Prisma 8, Drizzle, etc.)                                                     | 🟡 **Planned, not published yet.** No official package exists yet — write your own adapter for now (see [Writing your own adapter](#writing-your-own-adapter)), and consider publishing/contributing it back. |
| Custom adapters                                                                          | 🟢 Fully supported today — implement the [`VSRepoAdapter`](#writing-your-own-adapter) abstract class yourself for any ORM/database you need, in your own project or package, following the same shape as `@vsrepo/*-adapter` is expected to have. |

In short: the repository class, the `@DynamicMethod`/`@QueryMethod` decorators, the name-parsing engine, error handling and logging are all working end-to-end, and Prisma 7 support is now a released, published adapter. Official adapters for the remaining ORMs are on the roadmap and will ship as separate `@vsrepo/*-adapter` packages rather than as part of the core `vsrepo` package — but you don't have to wait for that: writing (and optionally publishing) your own adapter in the meantime is a fully supported way to use v2 today and to contribute back to the project.

---

## Installation

v2 is installed as the core package plus one adapter package for your ORM, for example:

```bash
npm i vsrepo @vsrepo/prisma7-adapter
```

> `vsrepo` v2.0.0 and `@vsrepo/prisma7-adapter` are both published to npm and ready to use. For any ORM other than Prisma 7, no adapter package exists yet — install the core and write your own adapter (see [Writing your own adapter](#writing-your-own-adapter)).

---

## Basic usage

### Implementing/choosing an adapter

```typescript
// src/configs/db.ts
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### Creating a repository

```typescript
// src/repositories/user.repository.ts
import { VSRepository, DynamicMethod } from "vsrepo";
import { VSRepoPrisma7Adapter } from "@vsrepo/prisma7-adapter";
import prisma from "../configs/db";
import type { UserGetPayload } from "../../generated/prisma/models";

type User = UserGetPayload<{ include: { address: true } }>;

class UserRepository extends VSRepository<User, string> {
    constructor() {
        super({
            pkName: "id",
            adapter: new VSRepoPrisma7Adapter<User>(prisma, { tableName: "user", pkName: "id" }),
            softRemoveKey: "deletedAt",
            defaultOrdering: { createdAt: "desc" },
        });
    }

    @DynamicMethod()
    declare findByEmail: (email: string) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmail: (email: string) => Promise<User | null>;
}

export default new UserRepository();
```

> The core API (`VSRepository`, `VSRepoAdapter`, `DynamicMethod`, `QueryMethod`, `VSRepoError`, enums and types) is imported from the single `vsrepo` entry point. The concrete adapter comes from a **separate** package (`@vsrepo/*-adapter`). On Prisma 7, install the published [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) (its constructor takes a config object — `tableName`, `pkName`, optional `relations`/`logLevel` — as shown above). Official adapters for other ORMs are planned but not published yet; until they are, you can implement the `VSRepoAdapter` contract yourself (see [Writing your own adapter](#writing-your-own-adapter)) — and publishing it to help the project is very welcome.

> **The third generic parameter (`OrmTypes`):** `VSRepository<Entity, PKType, OrmTypes>` accepts an optional third type parameter describing your ORM's client/transaction types, via `VSRepoOrmTypes` (`{ dbClient; dbTransaction }`). Supplying it gives you a correctly-typed `getDbClient()`, `transaction()` callback, and `db` option on every method, instead of `any`:
> ```typescript
> type PrismaOrmTypes = { dbClient: PrismaClient; dbTransaction: Prisma.TransactionClient };
>
> class UserRepository extends VSRepository<User, string, PrismaOrmTypes> {
>     // getDbClient() now returns PrismaClient, and transaction(fn) types `tx` as Prisma.TransactionClient
> }
> ```
> If omitted, it defaults to `VSRepoOrmTypes` (`dbClient`/`dbTransaction` both `any`).

### Using the repository

```typescript
import userRepository from "./repositories/user.repository";

const user = await userRepository.save({
    name: "Joao",
    email: "joao@email.com",
    password: "password",
});

const found = await userRepository.get(user.id);
const all = await userRepository.getAll();
const byEmail = await userRepository.findByEmail("joao@email.com");

await userRepository.patch(user.id, { name: "Joao Pedro" });
await userRepository.remove(user.id);
```

---

## Constructor options

`VSRepoOptions<T, K>`, passed to `super(...)` inside your repository's constructor:

| Option               | Type               | Description                                                                                                         |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `adapter`            | `VSRepoAdapter<T>` | **Required.** The adapter instance that translates repository calls into calls against the underlying ORM/database. |
| `pkName`             | `keyof T`          | **Required.** Name of the field that represents the entity's primary key.                                           |
| `softRemoveKey`      | `keyof T`          | Optional. When set, enables `softRemove`, `softRemoveList`, `restore` and `restoreList`.                            |
| `defaultOrdering`    | `Ordering<T>`      | Optional. Default ordering applied automatically to queries that accept `order`, unless overridden per call.        |
| `logLevel`           | `VSLogLevel`       | Optional. Minimum severity printed by the internal logger. Defaults to `VSLogLevel.WARN`.                           |
| `logSlowThresholdMs` | `number`           | Optional. Duration (ms) above which a finished operation is logged as `WARN` instead of `DEBUG`. Defaults to 300ms. |

---

## Base methods

Available automatically on every `VSRepository` subclass:

| Method                      | Description                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `get(pk, options?)`         | Fetches a record by primary key.                                                                                                     |
| `getOrThrow(pk, options?)`  | Fetches a record by primary key, throwing if not found.                                                                              |
| `getList(pks, options?)`    | Fetches multiple records by a list of primary keys.                                                                                  |
| `getAll(options?)`          | Fetches all records; accepts `pagination` and `order` in `options`.                                                                  |
| `save(obj, options?)`       | Creates or updates (upsert) a single record.                                                                                         |
| `saveList(objs, options?)`  | Creates or updates (upsert) multiple records in one call.                                                                            |
| `patch(pk, obj, options?)`  | Partially updates a record by primary key.                                                                                           |
| `merge(pk, obj, options?)`  | Fetches a record and returns it deep-merged, in memory, with the given object — does **not** persist anything.                       |
| `remove(pk, options?)`      | Deletes a record by primary key.                                                                                                     |
| `removeList(pks, options?)` | Deletes multiple records by primary key, returning `{ count }`.                                                                      |
| `total(options?)`           | Returns the total number of records.                                                                                                 |
| `has(pk, options?)`         | Checks whether a record exists, returning `boolean`.                                                                                 |
| `increment(pk, field, value, options?)` | Atomically adds `value` to a numeric field. See [Atomic and aggregate methods](#atomic-and-aggregate-methods).           |
| `decrement(pk, field, value, options?)` | Atomically subtracts `value` from a numeric field.                                                                        |
| `multiply(pk, field, value, options?)`  | Atomically multiplies a numeric field by `value`.                                                                         |
| `divide(pk, field, value, options?)`    | Atomically divides a numeric field by `value`.                                                                            |
| `sum(field, where?, options?)`          | Sums a numeric field across every matching record; `null` if none match.                                                  |
| `average(field, where?, options?)`      | Arithmetic mean of a numeric field across every matching record; `null` if none match.                                    |
| `min(field, where?, options?)`          | Minimum value of a numeric field across every matching record; `null` if none match.                                      |
| `max(field, where?, options?)`          | Maximum value of a numeric field across every matching record; `null` if none match.                                      |
| `transaction(fn, options?)` | Runs `fn` inside a native transaction of the underlying ORM.                                                                         |
| `getDbClient()`             | Returns the underlying ORM client instance used outside of transactions.                                                             |
| `query<T>(query, options?)` | Executes a raw SQL statement directly against the database. See [Ad-hoc raw queries with `query()`](#ad-hoc-raw-queries-with-query). |

Most of the above accept a `MethodOptions<Entity, OrmTypes>` object as their last argument (`select`, `relations`, `see`, `db`). A few — `total`, `has`, `removeList`, `sum`, `average`, `min`, `max`, and the soft-delete batch methods (`softRemoveList`/`restoreList`) — don't return/shape an `Entity`, so they accept the narrower `RestrictMethodOptions<Entity, OrmTypes>` instead (`see`, `db` only; no `select`/`relations`). `transaction`, `query`, and `getDbClient` accept their own options or none at all.

---

## Soft-delete

Soft-delete is now a **first-class, built-in concept**. Configure `softRemoveKey` once on the repository:

```typescript
super({
    pkName: "id",
    adapter,
    softRemoveKey: "deletedAt",
});
```

This unlocks four extra methods:

| Method                          | Effect                                |
| ------------------------------- | ------------------------------------- |
| `softRemove(pk, options?)`      | Sets `deletedAt` to the current date. |
| `softRemoveList(pks, options?)` | Same, in batch — returns `{ count }`. |
| `restore(pk, options?)`         | Sets `deletedAt` back to `null`.      |
| `restoreList(pks, options?)`    | Same, in batch — returns `{ count }`. |

Every other method accepts a `see` option controlling visibility of soft-deleted rows:

```typescript
await userRepository.getAll({ see: "active" }); // default — only non-deleted records
await userRepository.getAll({ see: "removed" }); // only soft-deleted records
await userRepository.getAll({ see: "all" }); // everything, ignoring soft-delete
```

---

## Atomic and aggregate methods

Every `VSRepository` subclass gets 8 extra methods for working with numeric fields, split into two groups:

**Atomic updates** — evaluated server-side against the row's *current* value (`UPDATE ... SET field = field + value`), not a client-side read-modify-write:

```typescript
await userRepository.increment("user-1", "balance", 50); // balance = balance + 50
await userRepository.decrement("user-1", "balance", 50); // balance = balance - 50
await userRepository.multiply("user-1", "balance", 2); // balance = balance * 2
await userRepository.divide("user-1", "balance", 4); // balance = balance / 4
```

All four return the updated `Entity` and accept the full `MethodOptions<Entity, OrmTypes>` (`select`, `relations`, `see`, `db`) as their last argument, same as `get`/`save`/`patch`.

**Aggregates** — computed across every record matching an (optional) `where`:

```typescript
await userRepository.sum("balance"); // total balance across every active record
await userRepository.sum("balance", { active: true }); // ...restricted by a where
await userRepository.average("balance");
await userRepository.min("balance");
await userRepository.max("balance");
```

All four return `number | null` — `null` when no record matches, mirroring SQL's `SUM()`/`AVG()`/`MIN()`/`MAX()`, which return `NULL` (not `0`) over an empty set. Unlike the atomic methods, they accept the narrower `RestrictMethodOptions<Entity, OrmTypes>` (`see`, `db` only — no `select`/`relations`, since the result is a plain number, not a shaped `Entity`).

Both groups respect `softRemoveKey`/`see` the same way every other base method does — `sum("balance")` only totals non-deleted records by default, pass `{ see: "all" }` or `{ see: "removed" }` to change that.

### Which fields are eligible

`field` is constrained to `NumericKeys<Entity>` — keys whose (non-nullable) value type is a `number`, a `bigint`, or a `DecimalLike` object (anything exposing `toNumber()` and `decimalPlaces()`, matching e.g. Prisma's `Prisma.Decimal`):

```typescript
type Product = { id: string; name: string; price: Decimal; stock: number | null };

await productRepository.increment(id, "price", new Decimal(10.5)); // ok — Decimal-like
await productRepository.increment(id, "stock", 5); // ok — nullable numeric fields are included
await productRepository.increment(id, "name", 1); // compile error — "name" isn't numeric
```

`value` is typed as `NonNullable<Entity[Field]>` — it must match the field's own type exactly. A `Decimal` field expects a `Decimal` instance, not a plain `number`/`string`:

```typescript
await productRepository.increment(id, "price", new Decimal(10.5)); // ok
await productRepository.increment(id, "price", 10.5); // compile error — wrap it: new Decimal(10.5)
```

Note that several ORMs (Drizzle, MikroORM, TypeORM) represent `decimal`/`numeric` columns as plain `string` by default, to avoid floating-point precision loss — a `string` field does **not** satisfy `NumericKeys<Entity>` out of the box. Configure the column in a numeric mode (or a transformer) on those ORMs if you want the field to be usable with these 8 methods.

### Writing an adapter

`VSRepoAdapter` mirrors the same 8 operations (`incrementOne`, `decrementOne`, `multiplyOne`, `divideOne`, `sum`, `average`, `min`, `max` — see [Writing your own adapter](#writing-your-own-adapter)). Each adapter translates them into whatever its ORM/database considers "native": Prisma has a built-in `{ field: { increment: value } }` update shape and an `aggregate()` call; other ORMs typically need a `QueryBuilder`/raw-`sql` expression (e.g. `SET field = field * :value`, `SELECT SUM(field) ...`) instead. The atomic methods must return the record reflecting the state *after* the write — if the ORM's atomic-update API only returns an affected-row count, issue a follow-up read rather than returning a stale in-memory copy.

---

## `select` and `relations`

v1's named, reusable `selectModels`/`defaultSelectModel` are gone. In v2 you pass `select` and `relations` directly on each call — there's nothing to pre-register:

```typescript
const user = await userRepository.get(id, {
    select: { id: true, name: true, address: { city: true } },
});

const userWithAddress = await userRepository.get(id, {
    relations: { address: true },
});
```

- `select` mirrors the entity's shape: scalar fields take a `boolean`; relation fields take a `boolean` or a nested `select`.
- `relations` eagerly loads related records; each relation field takes a `boolean` or a nested `relations` object.
- Whether `select` and `relations` can be combined depends on the adapter (see below).

> ⚠️ **Adapter-dependent behavior for `relations`:**
>
> The core only forwards `MethodOptions.select` and `MethodOptions.relations` to the adapter — each adapter decides how to translate them to the underlying ORM:
>
> - **TypeORM (`@vsrepo/typeorm-adapter`)** — `relations` is **required** to load any relation, even when you only want a nested projection via `select`. TypeORM will not JOIN/emit the relation unless it is listed in `relations`:
>     ```typescript
>     // TypeORM: select alone is NOT enough
>     await userRepository.get(id, {
>         select: { id: true, address: { city: true } },
>         relations: { address: true }, // ← required in TypeORM
>     });
>     ```
> - **Prisma 7 (`@vsrepo/prisma7-adapter` / `VSRepoPrisma7Adapter`)** — `relations` is converted to Prisma `include` (`parsePrismaInclude`). **If `select` is present, `relations` is ignored** because Prisma does not allow `select` + `include` in the same query:
>     ```typescript
>     // Prisma7: relations is ignored when select exists
>     await userRepository.get(id, {
>         select: { id: true, name: true },
>         relations: { address: true }, // ← ignored, include = undefined
>     });
>     ```
>
> Custom adapters may map `relations` differently — consult the adapter's documentation for the exact semantics.

---

## Dynamic methods

Dynamic methods are declared as a `declare` field annotated with `@DynamicMethod()`. Their behavior — which adapter method to call, which filters to apply, and how arguments map to them — is inferred entirely from the field's **name**, following the same convention-over-configuration philosophy as v1.

```typescript
class UserRepository extends VSRepository<User, string> {
    @DynamicMethod()
    declare findByEmail: (email: string) => Promise<User[]>;

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

    // OrderedAndPaginated: field filters, then order, then pagination, then MethodOptions
    @DynamicMethod()
    declare findByNameIgnoreCaseOrAgeBetweenOrderByCreatedAtAscPaginated: (
        name: string,
        age: [number, number],
        order: Ordering<User>,
        pagination: Pagination,
        options?: MethodOptions<User>,
    ) => Promise<User[]>;
}
```

### Available prefixes

| Prefix                     | Adapter method        | Notes                                                                                    |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------------- |
| `findBy`                   | `findMany`            | Field filters follow the prefix.                                                         |
| `findOneBy`                | `findOne`             | Field filters follow the prefix; single result.                                          |
| `findOneOrThrowBy`         | `findOneOrThrow`      | Throws if no record is found.                                                            |
| `findOneOrThrow`           | `findOneOrThrow`      | No field filters; applies only soft-delete/`see`.                                        |
| `findOneOrThrowWhere`      | `findOneOrThrow`      | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `findWhere`                | `findMany`            | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `findOneWhere`             | `findOne`             | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `findOne`                  | `findOne`             | No field filters; applies only soft-delete/`see`.                                        |
| `countBy`                  | `count`               | Field filters follow the prefix.                                                         |
| `countWhere`               | `count`               | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `count`                    | `count`               | No field filters.                                                                        |
| `existsBy`                 | `exists`              | Returns `boolean`.                                                                       |
| `existsWhere`              | `exists`              | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `create`                   | `create`              | Receives `data` as argument.                                                             |
| `createMany`               | `createMany`          | Receives `data[]` as argument; supports `IgnoreConflicts`.                               |
| `createManyReturning`      | `createManyReturning` | Receives `data[]` as argument; supports `IgnoreConflicts`; returns the created records (`T[]`) instead of `CountResult`. |
| `updateBy`                 | `update`              | Field filters + `data` as argument.                                                      |
| `updateWhere`              | `update`              | Receives a `VSRepoWhere<T>` as the first argument, then `data`.                          |
| `updateManyBy`             | `updateMany`          | Field filters + `data`.                                                                  |
| `updateManyWhere`          | `updateMany`          | Receives a `VSRepoWhere<T>` as the first argument, then `data`.                          |
| `updateManyReturningBy`    | `updateManyReturning` | Field filters + `data`; returns updated records.                                         |
| `updateManyReturningWhere` | `updateManyReturning` | Receives a `VSRepoWhere<T>` as the first argument, then `data`; returns updated records. |
| `upsertBy`                 | `upsert`              | Field filters + `create`/`update` payloads.                                              |
| `upsertWhere`              | `upsert`              | Receives a `VSRepoWhere<T>` as the first argument, then `create`/`update` payloads.      |
| `deleteBy`                 | `delete`              | Field filters follow the prefix.                                                         |
| `deleteWhere`              | `delete`              | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `deleteManyBy`             | `deleteMany`          | Field filters follow the prefix.                                                         |
| `deleteManyWhere`          | `deleteMany`          | Receives a `VSRepoWhere<T>` as the first argument.                                       |
| `deleteManyReturningBy`    | `deleteManyReturning` | Field filters follow the prefix; returns deleted records.                                |
| `deleteManyReturningWhere` | `deleteManyReturning` | Receives a `VSRepoWhere<T>` as the first argument; returns deleted records.              |

> `aggregate` and `groupBy` are **not implemented yet** in v2 (they existed in v1). This is planned but not currently available.

### Field filters

Applied as suffixes to the field name inside the method (same idea as v1, one renamed suffix):

| Suffix             | Meaning                                                                                                                                                       | Argument                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| _(none)_           | equality (`=`)                                                                                                                                                | yes                                    |
| `Not`              | negation                                                                                                                                                      | yes                                    |
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
| `IgnoreCase`       | case-insensitive combinator for text filters                                                                                                                  | no _(renamed from v1's `Insensitive`)_ |
| `Optional`         | **explicitly** marks the field's argument as optional — it's already optional by default, so this suffix is itself optional and only used to make it explicit | —                                      |

```typescript
@DynamicMethod()
declare findByNameContainsIgnoreCase: (name: string) => Promise<User[]>;

@DynamicMethod()
declare findByAgeBetween: (age: [number, number]) => Promise<User[]>;
```

### Logical operators

| Operator | Usage in the name               | Example                                             |
| -------- | ------------------------------- | --------------------------------------------------- |
| `And`    | between two fields              | `findOneByIdAndEmail`                               |
| `Or`     | between two fields              | `findByNameOrEmail`                                 |
| `AND`    | splits a final block into `AND` | `findByEmailOrNameANDActiveStatusAndAgeGreaterThan` |

`AND` (all caps) rules, same as v1: only one `AND` per method name is allowed; every field connected with `And` after it is nested inside `AND: []`; `Or` cannot appear after an `AND`.

### Relation filters

Filter by fields of related entities. Internally these map to the `_some`/`_every`/`_none`/`_with`/`_without` operators of `VSRepoWhere` (see [`select` and `relations`](#select-and-relations) for the eager-loading counterpart).

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

### Ordering, pagination and distinct

| Suffix                                     | Effect                                                                                                                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Paginated`                                | Injects a `pagination` argument (`{ limit?, offset? }`) as the **penultimate** parameter (before the optional `MethodOptions`).                                    |
| `Ordered`                                  | Injects an `order: Ordering<T>` argument as the **penultimate** parameter (before the optional `MethodOptions`).                                                   |
| `OrderedAndPaginated`                      | Injects `order` as the antepenultimate, then `pagination` as the penultimate — both before `MethodOptions`.                                                        |
| `PaginatedAndOrdered`                      | Injects `pagination` as the antepenultimate, then `order` as the penultimate — both before `MethodOptions`.                                                        |
| `OrderBy<Field>Asc` / `OrderBy<Field>Desc` | **New in v2.** Bakes a fixed ordering directly into the method name — chain fields with `And` (e.g. `OrderByCreatedAtAscAndNameDesc`). No `order` argument needed. |
| `Distinct<Field>And<Field>...`             | Bakes fixed `distinct` fields directly into the method name (only valid on `findBy`/`findWhere`-family methods).                                                   |
| `IgnoreConflicts`                          | On `createMany`/`createManyReturning`, skips records that would violate a unique constraint instead of throwing. _(Renamed from v1's `SkipDuplicates`.)_           |

> ⚠️ **Parameter order:** `pagination` and `order` are always placed **before** the optional `MethodOptions<T>` last argument. When both `order` and `pagination` are present, their relative order follows the suffix name (`OrderedAndPaginated` → order, pagination; `PaginatedAndOrdered` → pagination, order).

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

### Decorator options

`@DynamicMethod<T>(options?)` accepts:

| Option           | Type          | Description                                                                                                                      |
| ---------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `proxyTo`        | `string`      | Redirects the method's logic to another valid dynamic-method pattern — useful for names that don't follow the naming convention. |
| `injectOrdering` | `Ordering<T>` | Fixed ordering automatically injected, overriding the repository's `defaultOrdering`.                                            |

```typescript
@DynamicMethod<User>({ injectOrdering: { createdAt: "desc" } })
declare findByStatus: (status: string) => Promise<User[]>;
```

---

## Query methods (raw SQL)

`@QueryMethod` bypasses the name-parsing engine entirely and executes a raw SQL statement through the adapter's `query()` method. Use `$1`, `$2`, ... placeholders — never interpolate values directly into the SQL string.

```typescript
class UserRepository extends VSRepository<User, string> {
    @QueryMethod('SELECT * FROM "user" WHERE email = $1')
    declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;

    @QueryMethod('UPDATE "user" SET active = true WHERE id = $1', { modifying: true })
    declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;
}
```

| Option      | Type      | Default | Description                                                                                                                                                                          |
| ----------- | --------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modifying` | `boolean` | `false` | When `true`, runs as `INSERT`/`UPDATE`/`DELETE` and the method resolves to the number of affected rows. When `false`, runs as a read query and resolves to the declared return type. |

Query methods accept `{ args, db? }` at the call site — `db` lets them participate in a `transaction()` block just like base and dynamic methods.

### Ad-hoc raw queries with `query()`

For one-off raw SQL that doesn't warrant declaring a `@QueryMethod` on the repository class, call `query()` directly — it's available on every `VSRepository` instance and goes through the same adapter's `query()` implementation under the hood:

```typescript
query<T = any>(query: string, options?: { args?: any[]; db?: any; modifying?: boolean }): Promise<T>;
```

```typescript
const users = await userRepository.query<User[]>('SELECT * FROM "user" WHERE email = $1', {
    args: ["maria@email.com"],
});

const affectedRows = await userRepository.query<number>(
    'UPDATE "user" SET active = true WHERE id = $1',
    { args: ["123"], modifying: true },
);
```

| Option      | Type      | Default                     | Description                                                                                                              |
| ----------- | --------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `args`      | `any[]`   | `undefined`                 | Positional parameters injected into `$1`, `$2`, ... placeholders. Never interpolate values directly into the SQL string. |
| `db`        | `any`     | Repository's default client | Database client or transaction to run this query in.                                                                     |
| `modifying` | `boolean` | `false`                     | When `true`, treats the statement as `INSERT`/`UPDATE`/`DELETE`.                                                         |

Just like base, dynamic and query methods, `query()` accepts `db` in `options` to participate in a `transaction()` block.

---

## Transactions

All methods (base, dynamic, and query) accept `options.db` to participate in a shared transaction:

```typescript
await userRepository.transaction(async tx => {
    const user = await userRepository.save({ name: "Maria", email: "maria@email.com" }, { db: tx });

    await userLogsRepository.save(
        { action: "User created", data: { userId: user.id } },
        { db: tx },
    );
});
```

Different repositories can share the same transaction as long as their adapters point to the same underlying ORM connection.

`transaction()` accepts an optional `VSRepoTransactionOptions` as its second argument:

```typescript
import { TransactionIsolationLevel } from "vsrepo";

await userRepository.transaction(
    async tx => {
        await userRepository.save({ name: "Maria", email: "maria@email.com" }, { db: tx });
    },
    { isolationLevel: TransactionIsolationLevel.SERIALIZABLE, timeoutMs: 5000 },
);
```

| Option           | Type                       | Description                                                                    |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `isolationLevel` | `TransactionIsolationLevel` | Isolation level to use for the transaction. Defaults to the underlying ORM's default. |
| `timeoutMs`       | `number`                    | Maximum time (in ms) the transaction is allowed to run before being aborted.     |

`TransactionIsolationLevel` mirrors the standard SQL isolation levels: `READ_UNCOMMITTED`, `READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`. Support for a given level depends on the adapter/underlying ORM and database.

---

## Utility types

Beyond the entity-shaping types covered above (`VSRepoSelect`, `VSRepoRelations`, `VSRepoWhere`), VSRepository exports a set of utility types. They show up throughout the sections above, but here's a consolidated reference. All of them are part of the public API and can be imported directly:

```typescript
import type {
    MethodOptions,
    RestrictMethodOptions,
    Pagination,
    Ordering,
    OrderByField,
    SortDirection,
    SeeMode,
    DeepPartial,
    CountResult,
    QueryMethodArg,
    KeysOfType,
    NumericKeys,
    NumericLike,
    DecimalLike,
    Primitive,
    VSRepoWhere,
    VSRepoOrmTypes,
    VSRepoTransactionOptions,
    TransactionIsolationLevel,
} from "vsrepo";
```

| Type                                                | Description                                                                                                                                                                                          | Used by                                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MethodOptions<T, K>`                               | Options accepted as the last argument of most base and dynamic methods: `select`, `relations`, `see`, `db`.                                                                                          | [Base methods](#base-methods), [Dynamic methods](#dynamic-methods).                                                                                           |
| `RestrictMethodOptions<T, K>`                        | Narrowed `MethodOptions<T, K>` exposing only `see`/`db` — used by methods that don't shape/return an `Entity` (`total`, `has`, `sum`, `average`, `min`, `max`, `removeList`, `softRemoveList`, `restoreList`).           | [Base methods](#base-methods), [Atomic and aggregate methods](#atomic-and-aggregate-methods).                                                                 |
| `Pagination`                                        | `{ limit?, offset? }` accepted by `getAll` and by `Paginated` dynamic methods.                                                                                                                       | [Base methods](#base-methods), [Ordering, pagination and distinct](#ordering-pagination-and-distinct).                                                        |
| `Ordering<T>` / `OrderByField<T>` / `SortDirection` | Ordering shape accepted by `getAll`, `defaultOrdering` and `injectOrdering`, and by `Ordered` dynamic methods. A single object or a chained array; nested objects order to-one relations.            | [Constructor options](#constructor-options), [Decorator options](#decorator-options), [Ordering, pagination and distinct](#ordering-pagination-and-distinct). |
| `SeeMode`                                           | `"active" \| "removed" \| "all"` — controls visibility of soft-deleted records.                                                                                                                      | [Soft-delete](#soft-delete).                                                                                                                                  |
| `DeepPartial<T>`                                    | Recursively makes every property of `T` optional, including nested objects and array elements.                                                                                                       | `save`, `saveList`, `patch`, `merge`, and every write method on `VSRepoAdapter`.                                                                              |
| `CountResult`                                       | `{ count: number }` — the shape returned by batch operations.                                                                                                                                        | `removeList`, `softRemoveList`, `restoreList`, `createManyIgnoreConflicts`.                                                                                   |
| `QueryMethodArg<T>`                                 | `{ args?: T, db? }` — positional SQL parameters (`$1`, `$2`, ...) and transaction client for `@QueryMethod`.                                                                                         | [Query methods (raw SQL)](#query-methods-raw-sql).                                                                                                            |
| `KeysOfType<T, K>`                                  | Extracts the keys of `T` whose value type is assignable to `K`.                                                                                                                                      | Constrains `pkName` in [Constructor options](#constructor-options) to fields of the entity matching the configured primary-key type.                          |
| `NumericKeys<T>`                                    | Extracts the keys of `T` whose (non-nullable) value type is assignable to `NumericLike`. Nullable numeric fields (`number \| null`) are included.                                                   | Constrains `field` in [Atomic and aggregate methods](#atomic-and-aggregate-methods) (`increment`, `sum`, etc).                                                |
| `NumericLike`                                       | `number \| bigint \| DecimalLike`.                                                                                                                                                                    | [Atomic and aggregate methods](#atomic-and-aggregate-methods).                                                                                                 |
| `DecimalLike`                                       | Structural shape of an arbitrary-precision decimal value (`{ toNumber(): number; decimalPlaces(): number }`), matching e.g. Prisma's `Prisma.Decimal` without importing it directly.                | [Which fields are eligible](#which-fields-are-eligible).                                                                                                       |
| `Primitive`                                         | Union of scalar types (`string \| number \| boolean \| bigint \| symbol \| undefined \| null \| Date`) treated as leaves — not relations — when walking an entity's shape.                           | Used by `Ordering<T>` to tell scalar fields apart from relation fields.                                                                                       |
| `VSRepoWhere<T>`                                    | ORM-agnostic filter type accepted by `*Where` dynamic methods (e.g. `findWhere`, `findOneWhere`, `updateWhere`). Supports field filters, logical operators (`AND`/`OR`/`NOT`), and relation filters. | [`findWhere`, `findOneWhere` and other `*Where` prefixes](#available-prefixes).                                                                               |
| `VSRepoOrmTypes`                                    | `{ dbClient; dbTransaction }` — describes your ORM's client/transaction types. Passed as the third generic to `VSRepository<Entity, PKType, OrmTypes>` to type `getDbClient()`, `transaction()` and the `db` option instead of `any`. | [Creating a repository](#creating-a-repository).                                                                                                              |
| `VSRepoTransactionOptions`                          | `{ isolationLevel?, timeoutMs? }` — options accepted as the second argument of `transaction()`.                                                                                                      | [Transactions](#transactions).                                                                                                                                |
| `TransactionIsolationLevel`                         | Enum of standard SQL isolation levels (`READ_UNCOMMITTED`, `READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`) accepted by `VSRepoTransactionOptions.isolationLevel`.                              | [Transactions](#transactions).                                                                                                                                |

### `DeepPartial<T>`

Recursively makes all properties optional, walking into nested objects and array elements — unlike TypeScript's built-in `Partial<T>`, which only makes the top level optional:

```typescript
type User = { id: string; name: string; address: { city: string; zip: string } };

const patch: DeepPartial<User> = {
    address: { city: "São Paulo" }, // zip can be omitted; city keeps its type
};

await userRepository.patch(id, patch);
```

### `KeysOfType<T, K>`

Filters an object type down to the keys whose value matches a given type — this is what lets `pkName` accept only fields of the entity that are actually assignable to the repository's primary-key type:

```typescript
type User = { id: string; age: number; name: string };
type StringKeys = KeysOfType<User, string>; // "id" | "name"
```

### `Ordering<T>`

Accepts either a single ordering object or an array of them, applied in the order they're declared:

```typescript
const order: Ordering<User> = { createdAt: "desc" };
const chained: Ordering<User> = [{ name: "asc" }, { createdAt: "desc" }];

await userRepository.getAll({ order: chained });
```

---

## Writing your own adapter

Because the core is ORM-agnostic and ships without a bundled adapter, adding support for an ORM/database — whether that's a stopgap for your own project or a candidate for a future `@vsrepo/*-adapter` package — means implementing the `VSRepoAdapter<T>` abstract class:

```typescript
export abstract class VSRepoAdapter<T> {
    abstract runInTransaction<R>(
        fn: (tx: any) => Promise<R>,
        options?: VSRepoTransactionOptions,
    ): Promise<R>;
    abstract getDbClient(): any;
    abstract query<T = any>(query: string, options?: AdapterQueryOptions): Promise<T>;
    abstract findOne(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T | null>;
    abstract findOneOrThrow(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract findMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T> & { distinct?: (keyof T)[] },
    ): Promise<T[]>;
    abstract save(obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract saveMany(objs: DeepPartial<T>[], options?: AdapterMethodOptions<T>): Promise<T[]>;
    abstract create(objs: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract createMany(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T> & { ignoreConflicts?: boolean },
    ): Promise<CountResult>;
    abstract createManyReturning(
        objs: DeepPartial<T>[],
        options?: AdapterMethodOptions<T> & { ignoreConflicts?: boolean },
    ): Promise<T[]>;
    abstract delete(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract deleteMany(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<CountResult>;
    abstract deleteManyReturning(
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;
    abstract update(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
    abstract updateMany(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<CountResult>;
    abstract updateManyReturning(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T[]>;
    abstract count(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<number>;
    abstract exists(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<boolean>;
    abstract merge<K>(
        where: VSRepoWhere<T>,
        obj: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<K & T>;
    abstract upsert(
        where: VSRepoWhere<T>,
        create: DeepPartial<T>,
        update: DeepPartial<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;

    abstract incrementOne<K extends NumericKeys<T>>(
        field: K,
        value: NonNullable<T[K]>,
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
    abstract decrementOne<K extends NumericKeys<T>>(
        field: K,
        value: NonNullable<T[K]>,
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
    abstract multiplyOne<K extends NumericKeys<T>>(
        field: K,
        value: NonNullable<T[K]>,
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
    abstract divideOne<K extends NumericKeys<T>>(
        field: K,
        value: NonNullable<T[K]>,
        where: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<T>;
    abstract sum(
        field: NumericKeys<T>,
        where?: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<number | null>;
    abstract average(
        field: NumericKeys<T>,
        where?: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<number | null>;
    abstract min(
        field: NumericKeys<T>,
        where?: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<number | null>;
    abstract max(
        field: NumericKeys<T>,
        where?: VSRepoWhere<T>,
        options?: AdapterMethodOptions<T>,
    ): Promise<number | null>;
}
```

`VSRepository` never talks to the ORM directly — it only calls these methods with an already-resolved `VSRepoWhere<T>` and `AdapterMethodOptions<T>`. Once an adapter implements this contract, every base method, dynamic method, and query method works against it automatically. For a full, working implementation, see the external [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) repo.

### Logging from your adapter

`vsrepo` exports the same `VSLogger` class the core uses internally, so your adapter can log in the same format/style (timestamps, colored level labels, slow-operation warnings) instead of rolling its own:

```typescript
import { VSLogger, VSLogLevel } from "vsrepo";

export class MyOrmAdapter<T> extends VSRepoAdapter<T> {
    private readonly logger = new VSLogger(VSLogLevel.WARN, "MyOrmAdapterLogger");

    async findOne(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>) {
        const start = this.logger.startPerformLog("adapter findOne");
        try {
            // ... talk to the ORM ...
            this.logger.endPerformLog(start);
            return result;
        } catch (err) {
            this.logger.endPerformLog(start);
            this.logger.logError("adapter findOne failed", err);
            throw err;
        }
    }
}
```

| Method                             | Description                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `new VSLogger(logLevel, name, slowThresholdMs?)` | Creates a logger; `name` prefixes every line, `slowThresholdMs` defaults to 300.                    |
| `logDebug/logInfo/logWarn(text, obj?)` | Logs at the given level if `logLevel` allows it; `obj` is appended as pretty-printed JSON.       |
| `logError(text, err?)`              | Logs at `ERROR`; if `err` is an `Error`, only `name`/`message`/`stack`/`cause` are logged.        |
| `startPerformLog(operation)` / `endPerformLog(data)` | Bracket a block to log its duration, escalating to `WARN` if it exceeds `slowThresholdMs`. |
| `getLogLevel()`                     | Returns the logger's configured `VSLogLevel`.                                                     |

This is purely a convenience for adapter authors — nothing in the core requires your adapter to use it.

---

## Error handling

v2 simplifies the error hierarchy from v1: instead of several subclasses, there's a base `VSRepoError` class carrying a `type: VSRepoErrorType`, plus a dedicated `VSRepoAdapterError` subclass (see below) for failures coming from the underlying ORM/database.

```typescript
import { VSRepoError } from "vsrepo";

try {
    await userRepository.get(id);
} catch (error) {
    if (error instanceof VSRepoError) {
        console.error(`[${error.type}] ${error.message}`);
    }
}
```

| `VSRepoErrorType` | Raised when                                                                                                                |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `DECORATOR`       | Invalid arguments were passed to `@DynamicMethod` or `@QueryMethod`.                                                       |
| `RESOLVER`        | The library failed to resolve a dynamic/query method's configuration into a callable method (e.g. an unknown method name). |
| `DYNAMIC`         | A resolved dynamic method failed at runtime (e.g. missing arguments).                                                      |
| `VALIDATOR`       | Invalid method options or arguments were detected during validation.                                                       |
| `BASE`            | Invalid usage of a base method (`get`, `save`, `remove`, etc).                                                             |
| `ADAPTER`         | A `VSRepoAdapter` failed while talking to the underlying ORM/database — always thrown as `VSRepoAdapterError`.             |

### `VSRepoAdapterError` and `AdapterErrorCode`

When an adapter talks to the underlying ORM/database and that operation fails, the adapter wraps the failure in a `VSRepoAdapterError` — a subclass of `VSRepoError` with `type: VSRepoErrorType.ADAPTER`. It carries a **stable, adapter-agnostic** `code: AdapterErrorCode` plus the raw error thrown by the ORM/driver, so callers can react to failures without depending on any single ORM's error shape:

```typescript
import { VSRepoAdapterError, AdapterErrorCode } from "vsrepo";

try {
    await userRepository.save({ name: "Maria" });
} catch (error) {
    if (error instanceof VSRepoAdapterError) {
        console.error(`[${error.code}] ${error.message}`, error.originalError);

        if (error.code === AdapterErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
            // handle a duplicate key, e.g. return a friendly message
        }
    }
}
```

| Property        | Type               | Description                                                                         |
| --------------- | ------------------ | ----------------------------------------------------------------------------------- |
| `code`          | `AdapterErrorCode` | Stable, adapter-agnostic code classifying the failure.                              |
| `originalError` | `unknown`          | The raw error (or `null`/`undefined`) thrown by the underlying ORM/database driver. |
| `message`       | `string`           | Human-readable description of the adapter failure.                                  |
| `type`          | `VSRepoErrorType`  | Always `VSRepoErrorType.ADAPTER`.                                                   |
| `cause`         | `unknown`          | Optional root cause the error was chained from.                                     |

Adapter implementations construct it directly when mapping an ORM failure:

```typescript
import { VSRepoAdapterError, AdapterErrorCode } from "vsrepo";

throw new VSRepoAdapterError(
    "user creation failed",
    AdapterErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
    originalError, // raw DB/driver error
);
```

#### `AdapterErrorCode`

`AdapterErrorCode` is an enum of granular, adapter-agnostic codes an adapter can raise through `VSRepoAdapterError`. They mirror the most common failures thrown by ORMs and database drivers so any ORM's errors can be mapped to the same stable code:

```typescript
import { AdapterErrorCode } from "vsrepo";

console.log(AdapterErrorCode.UNIQUE_CONSTRAINT_VIOLATION); // "UNIQUE_CONSTRAINT_VIOLATION"
```

| Code                          | Meaning                                                                                                        |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `UNKNOWN`                     | Unclassified/unknown error; the fallback when no more specific code matches.                                   |
| `MISSING_DB_CLIENT`           | Database client (or connection pool) not provided or could not be resolved.                                    |
| `CONNECTION_FAILED`           | Could not reach/connect to the database, or an established connection was lost/terminated.                     |
| `CONNECTION_POOL_EXHAUSTED`   | Connection pool exhausted/depleted — no connection available, all busy or the limit was reached.               |
| `TIMEOUT`                     | Database did not respond in time; a query exceeded its allowed timeout.                                        |
| `UNIQUE_CONSTRAINT_VIOLATION` | Unique constraint (duplicate key) violated. E.g. Postgres/SQLite `23505`, MySQL `1062`.                        |
| `FOREIGN_KEY_VIOLATION`       | Foreign key constraint violated (referenced row missing).                                                      |
| `NOT_NULL_VIOLATION`          | NOT NULL constraint violated.                                                                                  |
| `CHECK_VIOLATION`             | CHECK constraint violated.                                                                                     |
| `CONSTRAINT_VIOLATION`        | General integrity/constraint violation not covered by a more specific code.                                    |
| `NOT_FOUND`                   | Requested record not found (e.g. a `findOneOrThrow`-style operation).                                          |
| `INVALID_DATA`                | Field value invalid for its type/length, or a required value is missing.                                       |
| `VALUE_TOO_LONG`              | Provided value exceeds the column/field length limit.                                                          |
| `CONVERSION_ERROR`            | Value could not be converted/cast to the target type. E.g. Postgres `22P02`, MySQL `1366`.                     |
| `INVALID_QUERY`               | SQL query/stored procedure is malformed or invalid.                                                            |
| `TABLE_OR_COLUMN_NOT_FOUND`   | Referenced table/column/relation does not exist.                                                               |
| `DEADLOCK`                    | Operation aborted by a lock timeout or deadlock between concurrent transactions.                               |
| `LOCK_TIMEOUT`                | Could not acquire a required database lock in time.                                                            |
| `LOCKED`                      | Record is locked and cannot be modified.                                                                       |
| `ACCESS_DENIED`               | Current user/role does not have permission for the operation.                                                  |
| `INVALID_CREDENTIALS`         | Invalid connection credentials (host/user/password).                                                           |
| `ROW_NOT_ALLOWED`             | Authenticated user does not own the record / row-level security rejected it.                                   |
| `MODEL_NOT_FOUND`             | Entity/model or table not defined/mapped in the ORM, or the adapter lacks model metadata to build the query.   |
| `FIELD_NOT_FOUND`             | Field/column name in the data or `where` does not exist on the entity/model.                                   |
| `TRANSACTION_CLOSED`          | Transaction used after it was committed/rolled back.                                                           |
| `TRANSACTION_ALREADY_STARTED` | A nested transaction could not be opened (e.g. nested `transaction()` calls).                                  |
| `TRANSACTION_CONFLICT`        | Transaction failed to commit and was rolled back.                                                              |
| `TRANSACTION_NOT_STARTED`     | No active transaction when one was required.                                                                   |
| `CONNECTION_CLOSED`           | Connection closed/terminated while a transaction or query was in progress.                                     |
| `INVALID_PARTIAL`             | `merge`/`upsert`/`update` received a partial object that is invalid or missing required keys.                  |
| `NOT_SUPPORTED`               | Unsupported feature/operation requested from the adapter (e.g. raw `query()` not supported).                   |
| `INVALID_ADAPTER_CONFIG`      | Adapter configuration invalid or incomplete (missing required options, or options with an invalid type/value). |
| `INTERNAL`                    | Internal adapter bug or unrecoverable state; should rarely be used — prefer a more specific code.              |

#### `VSRepoError` vs. raw ORM errors

Non-adapter usage/config mistakes throw the base `VSRepoError`. Failures raised _by the underlying ORM_ while an adapter method runs are **wrapped** in `VSRepoAdapterError` (classified by an `AdapterErrorCode`, with the original error preserved in `originalError`) instead of propagating raw — this is what makes callers independent of any specific ORM's error shape.

---

## Logging

Every repository has an internal logger, configured via `logLevel` and `logSlowThresholdMs` on the constructor options:

```typescript
import { VSLogLevel } from "vsrepo";

super({
    pkName: "id",
    adapter,
    logLevel: VSLogLevel.DEBUG,
    logSlowThresholdMs: 200,
});
```

| Level            | Meaning                                                                                               |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| `DEBUG`          | Verbose internal details, including every resolved query — very useful for debugging dynamic methods. |
| `INFO`           | High-level lifecycle events, such as repository initialization.                                       |
| `WARN` (default) | Recoverable issues and slow operations (see `logSlowThresholdMs`, defaults to 300ms).                 |
| `ERROR`          | Failures raised while executing an operation.                                                         |

---

## Development

The v2 core is built and packed from this branch as a standard npm package:

```bash
# 1. Install dependencies
pnpm install

# 2. Compile the TypeScript sources into dist/ (removes a previous dist/ first)
pnpm build

# 3. (Optional) Inspect what would be published without writing a tarball
npm pack --dry-run

# 4. Produce the installable tarball (runs `prepack` -> `pnpm build` automatically)
npm pack

# 5. Consume it locally in another project
npm install ../path/to/vsrepo-1.4.0.tgz
```

Notes:

- `pnpm build` runs `tsc -p tsconfig.build.json`, which outputs the compiled JS and generated type declarations into `dist/` with `rootDir: src`.
- The published package contains **only** the `dist/` folder plus the READMEs and `LICENSE` (see `files` in `package.json`). The adapters will live in their own `@vsrepo/*-adapter` packages.
- The core is ORM-agnostic and has no `@prisma/client` peer dependency.

---

## Requirements

- Node.js 18+
- TypeScript, with **legacy/experimental decorators** enabled (required by `@DynamicMethod`/`@QueryMethod`):

```json
{
    "compilerOptions": {
        "experimentalDecorators": true
    }
}
```

- `reflect-metadata` (bundled as a dependency, imported internally — you don't need to import it yourself)
- At least one working `VSRepoAdapter` for your database — on Prisma 7, install the published [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) (see [Adapter status](#adapter-status)); official adapters for other ORMs are planned but not published yet, so for now this means writing your own (see [Writing your own adapter](#writing-your-own-adapter)) — and if you publish it, contributing it back to the project is welcome

---

## Contributing

Contributions are welcome, especially towards finishing the Prisma and TypeORM adapters! (**[GitHub repository](https://github.com/jaobrabo123/VSRepository)**):

1. **Fork** the project.
2. Create a branch off `v2` for your change: `git checkout -b v2-my-change`.
3. Push your branch: `git push origin v2-my-change`.
4. Open a **Pull Request** against `v2`.

To report issues or suggest features, open an **Issue**.
