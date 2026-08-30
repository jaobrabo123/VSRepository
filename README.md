<div align="center">
  <img src="https://res.cloudinary.com/ddbfifdxd/image/upload/w_200,q_auto,f_auto/v1786386427/VS_logo_TextoAbaixo_yev4tq.png" alt="VSRepository Logo" width="200"/>

  <p style="margin-top: 12px;">
    <img src="https://img.shields.io/npm/v/vsrepo?style=flat-square" alt="npm version"/>
    <img src="https://img.shields.io/npm/l/vsrepo?style=flat-square" alt="npm license"/>
    <img src="https://img.shields.io/badge/inspired%20by-JpaRepository-E73121?style=flat-square" alt="inspired by JpaRepository"/>
  </p>
</div>

# VSRepository v2

🇺🇸 You're reading the English version. [🇧🇷 Ler em português](./README.pt-BR.md)

> ⚠️ **Work in progress.** This document describes the `v2` branch, an ongoing rewrite of VSRepository. The core engine (repository class, dynamic-method parser, decorators, error handling) is functional, but not every adapter is complete yet — see [Adapter status](#adapter-status) before depending on this branch. If you need the stable, Prisma-only release, use the [`v1`](https://github.com/jaobrabo123/VSRepository/tree/v1) code/docs instead.

**ORM-agnostic** repository pattern library, with full **TypeScript** support and automatic **type inference**. VSRepository v2 is a rewrite of the [v1](./v1) library: instead of talking to Prisma directly, the core now delegates every operation to a pluggable **adapter**, so the same repository API can work against Prisma, TypeORM, or any other ORM/database that implements the adapter contract.

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
- [Logging](#logging)
- [Development](#development)
- [Requirements](#requirements)
- [Contributing](#contributing)

---

## What changed from v1

If you're coming from the [v1](./v1) code/docs, here's the short version. See each linked section for details.

| Area | v1 | v2 |
| --- | --- | --- |
| Database access | Talks to **Prisma** directly, bundled in the core package | Talks to a **`VSRepoAdapter`**; ORM support ships as separate packages (`@vsrepo/prisma7-adapter`, `@vsrepo/typeorm-adapter`, ...) instead of being bundled in the core `vsrepo` package |
| Defining a repository | Functional `setupVSRepo<T, M>()({...}).build(prisma)`, **or** a `DynamicRepository` class | A single **class-based** API: `extends VSRepository<Entity, PKType, OrmTypes>` |
| Dynamic methods | `methods: { findByEmail: { map: true } }` config object | `@DynamicMethod()` decorator on a `declare` field |
| Data projections | Named, reusable `selectModels` + `defaultSelectModel` | Ad-hoc `select`/`relations` passed per call (no named models) |
| Eager loading | `include`/`includeModels` (Prisma-specific) | ORM-agnostic `relations` option |
| Global filters | `requiredWhere` (any arbitrary filter, always applied) | `softRemoveKey` + `see: "active" \| "removed" \| "all"` (soft-delete only, not a general-purpose filter) |
| Case-insensitive filter suffix | `Insensitive` | `IgnoreCase` |
| Inline ordering in method name | Not supported (`order` had to be passed as an argument via `Ordered`/`Paginated`) | `OrderBy<Field>Asc`/`OrderBy<Field>Desc` chains baked directly into the method name |
| Duplicate handling on `createMany` | `SkipDuplicates` suffix | `IgnoreConflicts` suffix |
| Raw SQL escape hatch | Not available | `@QueryMethod(sql, { modifying })` decorator, with `$1`, `$2`, ... placeholders |
| Batch upsert | Not available | `saveList` |
| `aggregate` / `groupBy` | Supported (Prisma-native passthrough) | **Not implemented yet** (planned) |
| Error types | `VSRepoError` + subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`, `VSRepoRuntimeError`) | A single `VSRepoError` class with a `type: VSRepoErrorType` field (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`) |
| Debug logging | `showWorking: true` boolean | `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) + `logSlowThresholdMs` for slow-query warnings |
| `vsrepo generate` CLI (type generation step) | Required before use | Not part of the v2 core — types come directly from your entity/ORM types |
| CRUD extras | `patchList`, raw `options.select`/`options.include` | `select`/`relations` are the default (always "raw"); `patch`/`merge` keep the same semantics |

---

## Adapter status

VSRepository v2 is **ORM-agnostic by design**. The core package (`vsrepo`) only ships the repository class, the decorators, the name-parsing engine, error handling and logging — it does **not** ship a production adapter. Actual ORM/database support is meant to live in **separate, independently versioned packages**, one per ORM (and, where it makes sense, one per major ORM version), for example:

- `@vsrepo/prisma7-adapter`
- `@vsrepo/prisma8-adapter`
- `@vsrepo/typeorm-adapter`
- `@vsrepo/drizzle-adapter`

None of these adapter packages have been published yet. What you'll find in this branch, under `src/adapters/`, are **prototypes/reference implementations** used to design and validate the `VSRepoAdapter` contract while the core was being built — not the real, distributable adapters:

| Prototype | Status |
| --- | --- |
| `VSRepoPrisma7Adapter` (`src/adapters/prisma7`) | 🟡 **Reference prototype.** `findOne` is implemented; every other method (`findMany`, `save`, `update`, `delete`, `count`, `exists`, `query`, etc.) currently throws `"Method not implemented."`. This is the starting point for the future `@vsrepo/prisma7-adapter` package, not that package itself. |
| TypeORM (`src/adapters/typeorm.adapter.ts`) | 🟡 **Reference prototype.** Only the `where`-clause parser (`parseVSRepoWhere`) exists so far; it does **not** yet implement the full `VSRepoAdapter` contract. This is the starting point for the future `@vsrepo/typeorm-adapter` package. |
| Custom adapters | 🟢 Fully supported today — implement the [`VSRepoAdapter`](#writing-your-own-adapter) abstract class yourself for any ORM/database you need, in your own project or package, following the same shape as `@vsrepo/*-adapter` is expected to have. |

In short: the repository class, the `@DynamicMethod`/`@QueryMethod` decorators, the name-parsing engine, error handling and logging are all working end-to-end — what's still being built out is the concrete ORM integration, which will ship as separate `@vsrepo/*-adapter` packages rather than as part of the core `vsrepo` package. Treat this branch as a preview of the v2 architecture rather than a drop-in replacement for v1 today.

---

## Installation

Once released, v2 will be installed as the core package plus one adapter package for your ORM, for example:

```bash
npm i vsrepo @vsrepo/prisma7-adapter
```

> Neither `vsrepo` v2 nor any `@vsrepo/*-adapter` package has been published to npm yet. The core is already buildable and packable from this branch (`pnpm build` + `npm pack` + `npm install ../path/to/vsrepo-<version>.tgz`) and its `package.json` reflects the v2 API. What's still missing for a real published release are the `@vsrepo/*-adapter` packages and the actual npm publish. Until then, if you want to use v2 today, install the core from the packed tarball or consume it from the `src/` folder and write your own adapter (see [Writing your own adapter](#writing-your-own-adapter)) or adapt one of the prototypes in `src/adapters/`.

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
            adapter: new VSRepoPrisma7Adapter<User>(prisma, "user"),
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

> The core API (`VSRepository`, `VSRepoAdapter`, `DynamicMethod`, `QueryMethod`, `VSRepoError`, enums and types) is imported from the single `vsrepo` entry point. The concrete adapter comes from a **separate** package (`@vsrepo/*-adapter`). Until those adapter packages are published, implement the `VSRepoAdapter` contract yourself (see [Writing your own adapter](#writing-your-own-adapter)) or adapt one of the reference prototypes in `src/adapters/`.

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

| Option | Type | Description |
| --- | --- | --- |
| `adapter` | `VSRepoAdapter<T>` | **Required.** The adapter instance that translates repository calls into calls against the underlying ORM/database. |
| `pkName` | `keyof T` | **Required.** Name of the field that represents the entity's primary key. |
| `softRemoveKey` | `keyof T` | Optional. When set, enables `softRemove`, `softRemoveList`, `restore` and `restoreList`. |
| `defaultOrdering` | `Ordering<T>` | Optional. Default ordering applied automatically to queries that accept `order`, unless overridden per call. |
| `logLevel` | `VSLogLevel` | Optional. Minimum severity printed by the internal logger. Defaults to `VSLogLevel.WARN`. |
| `logSlowThresholdMs` | `number` | Optional. Duration (ms) above which a finished operation is logged as `WARN` instead of `DEBUG`. Defaults to 300ms. |

---

## Base methods

Available automatically on every `VSRepository` subclass:

| Method | Description |
| --- | --- |
| `get(pk, options?)` | Fetches a record by primary key. |
| `getOrThrow(pk, options?)` | Fetches a record by primary key, throwing if not found. |
| `getList(pks, options?)` | Fetches multiple records by a list of primary keys. |
| `getAll(options?)` | Fetches all records; accepts `pagination` and `order` in `options`. |
| `save(obj, options?)` | Creates or updates (upsert) a single record. |
| `saveList(objs, options?)` | Creates or updates (upsert) multiple records in one call. |
| `patch(pk, obj, options?)` | Partially updates a record by primary key. |
| `merge(pk, obj, options?)` | Partially updates a record and returns it deep-merged with the given object. |
| `remove(pk, options?)` | Deletes a record by primary key. |
| `removeList(pks, options?)` | Deletes multiple records by primary key, returning `{ count }`. |
| `total(options?)` | Returns the total number of records. |
| `has(pk, options?)` | Checks whether a record exists, returning `boolean`. |
| `transaction(fn, options?)` | Runs `fn` inside a native transaction of the underlying ORM. |
| `getDbClient()` | Returns the underlying ORM client instance used outside of transactions. |
| `query<T>(query, options?)` | Executes a raw SQL statement directly against the database. See [Ad-hoc raw queries with `query()`](#ad-hoc-raw-queries-with-query). |

All of the above accept a `MethodOptions<Entity, OrmTypes>` object as their last argument (`select`, `relations`, `see`, `db`).

---

## Soft-delete

Soft-delete is now a **first-class, built-in concept** instead of something you had to model yourself with `requiredWhere`. Configure `softRemoveKey` once on the repository:

```typescript
super({
    pkName: "id",
    adapter,
    softRemoveKey: "deletedAt",
});
```

This unlocks four extra methods:

| Method | Effect |
| --- | --- |
| `softRemove(pk, options?)` | Sets `deletedAt` to the current date. |
| `softRemoveList(pks, options?)` | Same, in batch — returns `{ count }`. |
| `restore(pk, options?)` | Sets `deletedAt` back to `null`. |
| `restoreList(pks, options?)` | Same, in batch — returns `{ count }`. |

Every other method accepts a `see` option controlling visibility of soft-deleted rows:

```typescript
await userRepository.getAll({ see: "active" });  // default — only non-deleted records
await userRepository.getAll({ see: "removed" }); // only soft-deleted records
await userRepository.getAll({ see: "all" });      // everything, ignoring soft-delete
```

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
>   ```typescript
>   // TypeORM: select alone is NOT enough
>   await userRepository.get(id, {
>     select: { id: true, address: { city: true } },
>     relations: { address: true }, // ← required in TypeORM
>   });
>   ```
> - **Prisma 7 (`@vsrepo/prisma7-adapter` / `VSRepoPrisma7Adapter`)** — `relations` is converted to Prisma `include` (`parsePrismaInclude`). **If `select` is present, `relations` is ignored** because Prisma does not allow `select` + `include` in the same query:
>   ```typescript
>   // Prisma7: relations is ignored when select exists
>   await userRepository.get(id, {
>     select: { id: true, name: true },
>     relations: { address: true }, // ← ignored, include = undefined
>   });
>   ```
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
    declare updateById: (id: string, data: Partial<User>) => Promise<User>;

    @DynamicMethod()
    declare findByNameIgnoreCaseOrAgeBetweenANDActiveIsNullDistinctNameAndAgeOrderByCreatedAtAscAndUpdatedAtDescPaginated:
        (name: string, age: [number, number], pagination: { limit?: number; offset?: number }) => Promise<User[]>;
}
```

### Available prefixes

| Prefix | Adapter method | Notes |
| --- | --- | --- |
| `findBy` | `findMany` | Field filters follow the prefix. |
| `findOneBy` | `findOne` | Field filters follow the prefix; single result. |
| `findOneOrThrowBy` | `findOneOrThrow` | Throws if no record is found. |
| `findOneOrThrow` | `findOneOrThrow` | No field filters; applies only soft-delete/`see`. |
| `findOneOrThrowWhere` | `findOneOrThrow` | Receives an explicit `where` object as argument. |
| `findWhere` | `findMany` | Receives an explicit `where` object as argument. |
| `findOneWhere` | `findOne` | Receives an explicit `where` object as argument. |
| `countBy` | `count` | Field filters follow the prefix. |
| `countWhere` | `count` | Receives an explicit `where` object as argument. |
| `count` | `count` | No field filters. |
| `existsBy` | `exists` | Returns `boolean`. |
| `existsWhere` | `exists` | Receives an explicit `where` object as argument. |
| `create` | `create` | Receives `data` as argument. |
| `createMany` | `createMany` | Receives `data[]` as argument; supports `IgnoreConflicts`. |
| `updateBy` | `update` | Field filters + `data` as argument. |
| `updateWhere` | `update` | Explicit `where` + `data` as arguments. |
| `updateManyBy` | `updateMany` | Field filters + `data`. |
| `updateManyWhere` | `updateMany` | Explicit `where` + `data`. |
| `updateManyReturningBy` | `updateManyReturning` | Field filters + `data`; returns updated records. |
| `updateManyReturningWhere` | `updateManyReturning` | Explicit `where` + `data`; returns updated records. |
| `upsertBy` | `upsert` | Field filters + `create`/`update` payloads. |
| `upsertWhere` | `upsert` | Explicit `where` + `create`/`update` payloads. |
| `deleteBy` | `delete` | Field filters follow the prefix. |
| `deleteWhere` | `delete` | Explicit `where` object as argument. |
| `deleteManyBy` | `deleteMany` | Field filters follow the prefix. |
| `deleteManyWhere` | `deleteMany` | Explicit `where` object as argument. |
| `deleteManyReturningBy` | `deleteManyReturning` | Field filters follow the prefix; returns deleted records. |
| `deleteManyReturningWhere` | `deleteManyReturning` | Explicit `where` object; returns deleted records. |

> `aggregate` and `groupBy` are **not implemented yet** in v2 (they existed in v1). This is planned but not currently available.

### Field filters

Applied as suffixes to the field name inside the method (same idea as v1, one renamed suffix):

| Suffix | Meaning | Argument |
| --- | --- | --- |
| *(none)* | equality (`=`) | yes |
| `Not` | negation | yes |
| `In` | is one of | yes (array) |
| `NotIn` | is none of | yes (array) |
| `Contains` | substring match | yes |
| `NotContains` | negated substring match | yes |
| `StartsWith` | prefix match | yes |
| `NotStartsWith` | negated prefix match | yes |
| `EndsWith` | suffix match | yes |
| `NotEndsWith` | negated suffix match | yes |
| `GreaterThan` | `>` | yes |
| `GreaterThanEqual` | `>=` | yes |
| `LessThan` | `<` | yes |
| `LessThanEqual` | `<=` | yes |
| `Between` | inclusive range | yes (`[min, max]` tuple) |
| `NotBetween` | outside an inclusive range | yes (`[min, max]` tuple) |
| `IsNull` | field is `null` | no |
| `IsNotNull` | field is not `null` | no |
| `IsTrue` | field is `true` | no |
| `IsFalse` | field is `false` | no |
| `IgnoreCase` | case-insensitive combinator for text filters | no *(renamed from v1's `Insensitive`)* |
| `Optional` | makes the field's argument optional (may be `undefined`) | — |

```typescript
@DynamicMethod()
declare findByNameContainsIgnoreCase: (name: string) => Promise<User[]>;

@DynamicMethod()
declare findByAgeBetween: (age: [number, number]) => Promise<User[]>;
```

### Logical operators

| Operator | Usage in the name | Example |
| --- | --- | --- |
| `And` | between two fields | `findOneByIdAndEmail` |
| `Or` | between two fields | `findByNameOrEmail` |
| `AND` | splits a final block into `AND` | `findByEmailOrNameANDActiveStatusAndAgeGreaterThan` |

`AND` (all caps) rules, same as v1: only one `AND` per method name is allowed; every field connected with `And` after it is nested inside `AND: []`; `Or` cannot appear after an `AND`.

### Relation filters

Filter by fields of related entities. Internally these map to the `_some`/`_every`/`_none`/`_with`/`_without` operators of `VSRepoWhere` (see [`select` and `relations`](#select-and-relations) for the eager-loading counterpart).

| Suffix | Meaning | Restriction |
| --- | --- | --- |
| `Some` | at least one related record matches | to-many relations only |
| `SomeField` | filters within the related records | to-many relations only |
| `Every` | every related record matches | to-many relations only (needs `Field` to be a real filter) |
| `EveryField` | filters within the related records | to-many relations only |
| `None` | no related record matches | to-many relations only |
| `NoneField` | filters within the related records | to-many relations only |
| `With` | related record exists | to-one relations only |
| `WithField` | filters a field within the related record | to-one relations only |
| `Without` | related record does not exist | to-one relations only |
| `WithoutField` | negated filter on a field of the related record | to-one relations only |

```typescript
@DynamicMethod()
declare findByAddressWithCityStartsWithIgnoreCase: (city: string) => Promise<User[]>;

@DynamicMethod()
declare findByProductsSome: () => Promise<User[]>;
```

### Ordering, pagination and distinct

| Suffix | Effect |
| --- | --- |
| `Paginated` | injects a `pagination` argument (`{ limit?, offset? }`) at the end of the call. |
| `Ordered` | injects an `order` argument at the end of the call. |
| `OrderedAndPaginated` | injects `order`, then `pagination`. |
| `PaginatedAndOrdered` | injects `pagination`, then `order`. |
| `OrderBy<Field>Asc` / `OrderBy<Field>Desc` | **New in v2.** Bakes a fixed ordering directly into the method name — chain fields with `And` (e.g. `OrderByCreatedAtAscAndNameDesc`). No `order` argument needed. |
| `Distinct<Field>And<Field>...` | **New in v2.** Bakes fixed `distinct` fields directly into the method name (only valid on `findBy`/`findWhere`-family methods). |
| `IgnoreConflicts` | On `createMany`, skips records that would violate a unique constraint instead of throwing. *(Renamed from v1's `SkipDuplicates`.)* |

```typescript
@DynamicMethod()
declare findByActiveOrderByCreatedAtDescPaginated:
    (active: boolean, pagination: { limit?: number; offset?: number }) => Promise<User[]>;

@DynamicMethod()
declare createManyIgnoreConflicts: (data: Partial<User>[]) => Promise<{ count: number }>;
```

### Decorator options

`@DynamicMethod<T>(options?)` accepts:

| Option | Type | Description |
| --- | --- | --- |
| `proxyTo` | `string` | Redirects the method's logic to another valid dynamic-method pattern — useful for names that don't follow the naming convention. |
| `injectOrdering` | `Ordering<T>` | Fixed ordering automatically injected, overriding the repository's `defaultOrdering`. |

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

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `modifying` | `boolean` | `false` | When `true`, runs as `INSERT`/`UPDATE`/`DELETE` and the method resolves to the number of affected rows. When `false`, runs as a read query and resolves to the declared return type. |

Query methods accept `{ args, db? }` at the call site — `db` lets them participate in a `transaction()` block just like base and dynamic methods.

### Ad-hoc raw queries with `query()`

For one-off raw SQL that doesn't warrant declaring a `@QueryMethod` on the repository class, call `query()` directly — it's available on every `VSRepository` instance and goes through the same adapter's `query()` implementation under the hood:

```typescript
query<T = any>(query: string, options?: { args?: any[]; db?: any; modifying?: boolean }): Promise<T>;
```

```typescript
const users = await userRepository.query<User[]>(
    'SELECT * FROM "user" WHERE email = $1',
    { args: ["maria@email.com"] },
);

const affectedRows = await userRepository.query<number>(
    'UPDATE "user" SET active = true WHERE id = $1',
    { args: ["123"], modifying: true },
);
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `args` | `any[]` | `undefined` | Positional parameters injected into `$1`, `$2`, ... placeholders. Never interpolate values directly into the SQL string. |
| `db` | `any` | Repository's default client | Database client or transaction to run this query in. |
| `modifying` | `boolean` | `false` | When `true`, treats the statement as `INSERT`/`UPDATE`/`DELETE`. |

Just like base, dynamic and query methods, `query()` accepts `db` in `options` to participate in a `transaction()` block.

---

## Transactions

All methods (base, dynamic, and query) accept `options.db` to participate in a shared transaction:

```typescript
await userRepository.transaction(async tx => {
    const user = await userRepository.save(
        { name: "Maria", email: "maria@email.com" },
        { db: tx },
    );

    await userLogsRepository.save(
        { action: "User created", data: { userId: user.id } },
        { db: tx },
    );
});
```

Different repositories can share the same transaction as long as their adapters point to the same underlying ORM connection.

---

## Utility types

Beyond the entity-shaping types covered above (`VSRepoSelect`, `VSRepoRelations`, `VSRepoWhere`), VSRepository exports a set of small, focused utility types under `src/types/utils/`. They show up throughout the sections above, but here's a consolidated reference. All of them are part of the public API and can be imported directly:

```typescript
import type {
    MethodOptions,
    Pagination,
    Ordering,
    OrderByField,
    SortDirection,
    SeeMode,
    DeepPartial,
    CountResult,
    QueryMethodArg,
    KeysOfType,
    Primitive,
} from "vsrepo";
```

| Type | Description | Used by |
| --- | --- | --- |
| `MethodOptions<T, K>` | Options accepted as the last argument of every base and dynamic method: `select`, `relations`, `see`, `db`. | [Base methods](#base-methods). |
| `Pagination` | `{ limit?, offset? }` accepted by `getAll` and by `Paginated` dynamic methods. | [Base methods](#base-methods), [Ordering, pagination and distinct](#ordering-pagination-and-distinct). |
| `Ordering<T>` / `OrderByField<T>` / `SortDirection` | Ordering shape accepted by `getAll`, `defaultOrdering` and `injectOrdering`, and by `Ordered` dynamic methods. A single object or a chained array; nested objects order to-one relations. | [Constructor options](#constructor-options), [Decorator options](#decorator-options). |
| `SeeMode` | `"active" \| "removed" \| "all"` — controls visibility of soft-deleted records. | [Soft-delete](#soft-delete). |
| `DeepPartial<T>` | Recursively makes every property of `T` optional, including nested objects and array elements. | `save`, `saveList`, `patch`, `merge`, and every write method on `VSRepoAdapter`. |
| `CountResult` | `{ count: number }` — the shape returned by batch operations. | `removeList`, `softRemoveList`, `restoreList`, `createManyIgnoreConflicts`. |
| `QueryMethodArg<T>` | `{ args?: T, db? }` — positional SQL parameters (`$1`, `$2`, ...) and transaction client for `@QueryMethod`. | [Query methods (raw SQL)](#query-methods-raw-sql). |
| `KeysOfType<T, K>` | Extracts the keys of `T` whose value type is assignable to `K`. | Constrains `pkName` in [Constructor options](#constructor-options) to fields of the entity matching the configured primary-key type. |
| `Primitive` | Union of scalar types (`string \| number \| boolean \| bigint \| symbol \| undefined \| null \| Date`) treated as leaves — not relations — when walking an entity's shape. | Used by `Ordering<T>` to tell scalar fields apart from relation fields. |

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
    abstract runInTransaction<R>(fn: (tx: any) => Promise<R>, options?: VSRepoTransactionOptions): Promise<R>;
    abstract getDbClient(): any;
    abstract query<T = any>(query: string, options?: AdapterQueryOptions): Promise<T>;
    abstract findOne(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T | null>;
    abstract findOneOrThrow(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract findMany(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T> & { distinct?: (keyof T)[] }): Promise<T[]>;
    abstract save(obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract saveMany(objs: DeepPartial<T>[], options?: AdapterMethodOptions<T>): Promise<T[]>;
    abstract create(objs: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract createMany(objs: DeepPartial<T>[], options?: AdapterMethodOptions<T> & { ignoreConflicts?: boolean }): Promise<CountResult>;
    abstract delete(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract deleteMany(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<CountResult>;
    abstract deleteManyReturning(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<T[]>;
    abstract update(where: VSRepoWhere<T>, obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;
    abstract updateMany(where: VSRepoWhere<T>, obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<CountResult>;
    abstract updateManyReturning(where: VSRepoWhere<T>, obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T[]>;
    abstract count(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<number>;
    abstract exists(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>): Promise<boolean>;
    abstract merge<K>(where: VSRepoWhere<T>, obj: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<K & T>;
    abstract upsert(where: VSRepoWhere<T>, create: DeepPartial<T>, update: DeepPartial<T>, options?: AdapterMethodOptions<T>): Promise<T>;
}
```

`VSRepository` never talks to the ORM directly — it only calls these methods with an already-resolved `VSRepoWhere<T>` and `AdapterMethodOptions<T>`. Once an adapter implements this contract, every base method, dynamic method, and query method works against it automatically. See `src/adapters/prisma7/prisma7.adapter.ts` for a partial reference implementation, and `src/adapters/typeorm.adapter.ts` for a reference `where`-clause parser.

---

## Error handling

v2 simplifies the error hierarchy from v1: instead of several subclasses, there's a single `VSRepoError` class carrying a `type: VSRepoErrorType`.

```typescript
import { VSRepoError } from "vsrepo/errors/VSRepoError";

try {
    await userRepository.get(id);
} catch (error) {
    if (error instanceof VSRepoError) {
        console.error(`[${error.type}] ${error.message}`);
    }
}
```

| `VSRepoErrorType` | Raised when |
| --- | --- |
| `DECORATOR` | Invalid arguments were passed to `@DynamicMethod` or `@QueryMethod`. |
| `RESOLVER` | The library failed to resolve a dynamic/query method's configuration into a callable method (e.g. an unknown method name). |
| `DYNAMIC` | A resolved dynamic method failed at runtime (e.g. missing arguments). |
| `VALIDATOR` | Invalid method options or arguments were detected during validation. |
| `BASE` | Invalid usage of a base method (`get`, `save`, `remove`, etc). |

Errors raised by the underlying ORM itself are **not** wrapped in `VSRepoError` — they propagate as-is.

---

## Logging

Every repository has an internal logger, configured via `logLevel` and `logSlowThresholdMs` on the constructor options:

```typescript
import { VSLogLevel } from "vsrepo/internal/enums/vs-log-level.enum";

super({
    pkName: "id",
    adapter,
    logLevel: VSLogLevel.DEBUG,
    logSlowThresholdMs: 200,
});
```

| Level | Meaning |
| --- | --- |
| `DEBUG` | Verbose internal details, including every resolved query — very useful for debugging dynamic methods. |
| `INFO` | High-level lifecycle events, such as repository initialization. |
| `WARN` (default) | Recoverable issues and slow operations (see `logSlowThresholdMs`, defaults to 300ms). |
| `ERROR` | Failures raised while executing an operation. |

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
- The published package contains **only** the `dist/` folder plus the READMEs and `LICENSE` (see `files` in `package.json`). Source, tests, the `v1/` folder, `generated/` and the `src/adapters/**` prototypes are **not** shipped — the adapters will live in their own `@vsrepo/*-adapter` packages.
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
- At least one working `VSRepoAdapter` for your database — no `@vsrepo/*-adapter` package has been published yet, so for now this means writing your own or adapting one of the reference prototypes in `src/adapters/` (see [Adapter status](#adapter-status))

---

## Contributing

Contributions are welcome, especially towards finishing the Prisma and TypeORM adapters! (**[GitHub repository](https://github.com/jaobrabo123/VSRepository)**):

1. **Fork** the project.
2. Create a branch off `v2` for your change: `git checkout -b v2-my-change`.
3. Push your branch: `git push origin v2-my-change`.
4. Open a **Pull Request** against `v2`.

To report issues or suggest features, open an **Issue**.
