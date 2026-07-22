# VSRepository

![npm](https://img.shields.io/npm/v/vsrepo?style=flat-square)
![NPM License](https://img.shields.io/npm/l/vsrepo?style=flat-square)
![NPM Downloads](https://img.shields.io/npm/dt/vsrepo?style=flat-square)

Repository pattern library for projects using **Prisma**, with full **TypeScript** support and automatic **type inference**.

VSRepository lets you create strongly-typed repositories with:

- Automatic **base methods**: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `patchList`, `merge`, `getAll`, `total`, `has`
- **Native soft-delete**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Dynamic methods** inferred from their name: `findOneByEmail`, `findManyPaginated`, `updateById`, `deleteManyByNameStartsWith`
- Reusable **select models** for different data projections
- **Type safety** across 100% of operations
- Native Prisma **transactions** (automatic in `saveList` and `patchList`)
- **Extensibility** with custom methods

> 💡 Want to see all of this in practice? The repository's [`examples/`](https://github.com/jaobrabo123/VSRepository/tree/main/examples) folder has commented, runnable examples for every feature — see the [Practical examples](#practical-examples) section below.

---

## Table of contents

- [Installation](#installation)
- [Generating the types](#generating-the-types)
- [Basic usage](#basic-usage)
- [Class-based approach (DynamicRepository)](#class-based-approach-dynamicrepository)
- [NestJS integration](#nestjs-integration)
- [Base methods](#base-methods)
  - [Soft-delete](#soft-delete)
  - [Batch operations](#batch-operations)
  - [Merge](#merge)
  - [Configuring the base methods](#configuring-the-base-methods)
- [Select Models](#select-models)
- [Include Models](#include-models)
- [Required Where](#required-where)
- [Default Ordenation](#default-ordenation)
- [`see` option](#see-option)
- [Dynamic methods](#dynamic-methods)
  - [Available prefixes](#available-prefixes)
  - [Field filters](#field-filters)
  - [Logical operators](#logical-operators)
  - [Relation filters](#relation-filters)
  - [Pagination and ordering suffixes](#pagination-and-ordering-suffixes)
  - [Distinct](#distinct)
  - [Method configuration](#method-configuration)
  - [Aggregate and GroupBy](#aggregate-and-groupby)
- [Relations in save](#relations-in-save)
- [Transactions](#transactions)
- [Extending a repository](#extending-a-repository)
- [Error handling](#error-handling)
- [Utility types](#utility-types)
- [API Reference](#api-reference)
- [Practical examples](#practical-examples)
- [Contributing](#contributing)
- [Requirements](#requirements)
- [Troubleshooting](#troubleshooting)

---

## Installation

```bash
npm i vsrepo @prisma/client
```

Generate the Prisma Client:

```bash
npx prisma generate
```

---

## Generating the types

VSRepository needs to know the real path of your Prisma Client to generate the typings correctly.

```bash
npx vsrepo generate
```

Equivalent to:

```bash
npx vsrepo generate \
  --output generated/vsrepo \
  --prisma generated/prisma
```

**Available flags:**

| Flag       | Alias | Default             |
| ---------- | ----- | -------------------- |
| `--output` | `-o`  | `generated/vsrepo`   |
| `--prisma` | `-p`  | `generated/prisma`   |

**Generated files:**

```
generated/vsrepo/
├── VSRepoError.ts
├── VSRepoError.types.d.ts
├── VSRepository.ts
├── VSRepository.types.d.ts
└── index.ts
```

After generating, always import from the generated folder:

```ts
// CORRECT ✅
import { setupVSRepo } from "../../generated/vsrepo";

// WRONG ❌
import { setupVSRepo } from "vsrepo";
```

---

## Basic usage

### Configuring the Prisma Client

```ts
// src/configs/db.ts
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### Creating a repository

```ts
// src/repositories/userRepository.ts
import prisma from "../configs/db";
import { setupVSRepo } from "../../generated/vsrepo";
import type { User } from "../../generated/prisma/client";

const userRepository = setupVSRepo<User, "User">()(({
  tableName: "user",
  pkName: "id",
  selectModels: {
    public: { id: true, name: true, email: true },
  },
  defaultSelectModel: "public",
}).build(prisma);

export default userRepository;
```

### Using the repository

```ts
import userRepository from "./repositories/userRepository";

const user = await userRepository.save({
  name: "John",
  email: "john@email.com",
  password: "password",
});

const found = await userRepository.get(user.id);
const all = await userRepository.getAll();

user.name = "John Smith";

await userRepository.save(user);
await userRepository.remove(user.id);
```

---

## Class-based approach (DynamicRepository)

If you prefer an OOP style with decorators instead of the functional `setupVSRepo` approach, VSRepository also provides `DynamicRepository` — a class you can extend with `@DynamicMethod()` decorators to define your dynamic methods.

See **[README-DynamicRepo.md](./README-DynamicRepo.md)** for full documentation on the class-based approach, including NestJS integration examples, decorator config, and a comparison with `setupVSRepo`.

---

## NestJS integration

VSRepository can be easily integrated into NestJS projects through providers. Below is a complete example using NestJS's dependency injection pattern.

### Configuring the repository as a provider

```ts
// src/modules/user/user.repository.ts
import { Provider } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UserGetPayload } from "../../../generated/prisma/models";
import { setupVSRepo } from "../../../generated/vsrepo";

const userVSRepo = setupVSRepo<
    UserGetPayload<{ include: { profile: true } }>,
    "User"
>()(({
    tableName: "user",
    pkName: "id",
    selectModels: {
        public: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
        auth: {
            id: true,
            email: true,
            password: true,
        },
    },
    defaultSelectModel: "public",
    requiredWhere: {
        deletedAt: null,
    },
    relations: {
        profile: {
            mode: "oto",
            pk: "id",
            restriction: "add",
        },
    },
    methods: {
        findAuthByEmail: {
            map: true,
            proxyTo: "findUniqueByEmail",
            selectModel: "auth",
        },
        findByEmailEndsWith: {
            map: true,
        }
    },
});

const setupUserRepository = (prisma: PrismaService) => {
    return userVSRepo.build(prisma);
};

export type UserRepository = ReturnType<typeof setupUserRepository>;
/* 
The type can also be inferred using VSRepository's `RepositoryOf`, passing the `userVSRepo` type:

export type UserRepository = RepositoryOf<typeof userVSRepo>;

NOTE: If you use `.extend` to extend the repository or configure the base methods,
using `ReturnType` is recommended since it's simpler to infer the type
*/

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export const UserRepositoryProvider: Provider = {
    provide: USER_REPOSITORY,
    inject: [PrismaService],
    useFactory: setupUserRepository,
};
```

### Registering the provider in the module

```ts
// src/modules/user/user.module.ts
import { Module } from "@nestjs/common";
import { UserRepositoryProvider } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
    imports: [DatabaseModule],
    providers: [UserRepositoryProvider, UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
```

### Using the repository in a service

```ts
// src/modules/user/user.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "./user.repository";

@Injectable()
export class UserService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
    ) {}

    async getUserById(id: string) {
        return this.userRepository.get(id);
    }

    async getUserAuthByEmail(email: string) {
        return this.userRepository.findAuthByEmail(email);
    }

    async createUser(data: { email: string; password: string; name: string }) {
        return this.userRepository.save({
            email: data.email,
            password: data.password,
            name: data.name,
        });
    }
}
```

**Benefits of this approach:**

- ✅ Type-safe repositories with dependency injection
- ✅ Easy to test (mock the `USER_REPOSITORY`)
- ✅ Isolation of persistence logic
- ✅ Repository reuse across multiple services
- ✅ Transaction support via `PrismaService`

---

## Base methods

When calling `.build(prisma)`, the base methods below are automatically made available:

| Method                   | Description                                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------------------------------|
| `get(pk)`                | Fetches a record by its primary key                                                                          |
| `getOrThrow(pk)`         | Fetches a record by its primary key; throws `VSRepoRuntimeError` (code `"20727"`) if not found                |
| `getList(pks)`           | Fetches multiple records from a list of primary keys                                                          |
| `save(obj)`              | Creates or updates — if the object has a `pk` it performs an `upsert`, otherwise a `create`                  |
| `saveList(objs)`         | Saves an array of objects in a single automatic transaction                                                   |
| `patch(pk, obj)`         | Partially updates a record by its primary key                                                                 |
| `patchList(tuples)`      | Partially updates multiple records via an array of `[pk, obj]` tuples in an automatic transaction             |
| `merge(pk, obj)`         | Fetches a record and deep merges it in memory — **does not persist**, returns the merged object              |
| `remove(pk)`             | Removes a record by its primary key                                                                           |
| `removeList(pks)`        | Removes several records by a list of primary keys — returns `{ count }`                                       |
| `getAll()`               | Returns all records (accepts `pagination` and `order` in `options`)                                           |
| `total()`                | Returns the total number of records                                                                           |
| `has(pk)`                | Checks whether a record exists by its primary key — returns `boolean`                                         |

All of them accept `options` as the last argument.

### Soft-delete

When `softRemovekName` is configured on the repository, the following additional methods become available:

| Method                     | Description                                                                        |
| -------------------------- | ------------------------------------------------------------------------------------|
| `softRemove(pk)`           | Marks a record as removed by filling `softRemovekName` with the current date       |
| `softRemoveList(pks)`      | Marks multiple records as removed in batch — returns `{ count }`                    |
| `restore(pk)`              | Restores a soft-deleted record, clearing the `softRemovekName` field                |
| `restoreList(pks)`         | Restores multiple soft-deleted records in batch — returns `{ count }`               |

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  softRemovekName: "deletedAt", // must be a DateTime field in the Prisma schema
}).build(prisma);

await userRepository.softRemove(1);
await userRepository.restore(1);
```

> The field provided in `softRemovekName` **must** be of type `DateTime` in the Prisma schema. VSRepository validates this at `build` time and throws `VSRepoBuildError` if the type is incorrect.

### Batch operations

`saveList` and `patchList` automatically run all operations inside a single Prisma transaction. If any operation fails, all previous ones are rolled back.

```ts
// saveList — creates or updates multiple objects in an automatic transaction
const users = await userRepository.saveList([
  { name: "Mary", email: "mary@email.com" },
  { id: 2, name: "John Updated", email: "john@email.com" },
]);

// patchList — partially updates multiple records via [pk, obj] tuples
const updated = await userRepository.patchList([
  [1, { active: false }],
  [2, { name: "New Name" }],
]);
```

When you're already inside an existing transaction, pass it in `options.db`. In this case, `db` must be a `DbTransaction` (not the main client):

```ts
await prisma.$transaction(async (tx) => {
  await userRepository.saveList([{ name: "Mary" }, { name: "Gus" }], { db: tx });
  await userRepository.patchList([[1, { active: false }], [2, { active: true }]], { db: tx });
});
```

### Merge

The `merge` method fetches a record by its PK and deeply merges (`deepmerge`) the provided object with the existing data **in memory**. It **does not persist** the changes — it returns the merged result so you can decide what to do with it.

```ts
const existing = await userRepository.get(1);
// existing: { id: 1, name: "Mary", profile: { bio: "Hi", age: 25 } }

const merged = await userRepository.merge(1, {
  profile: { bio: "Updated bio" },
});
// merged: { id: 1, name: "Mary", profile: { bio: "Updated bio", age: 25 } }

// To persist, pass it to save or patch:
await userRepository.save(merged);
```

Returns `null` if the record is not found.

**Merging to-many relations (`otm`/`mtm`) is done by PK, not by simple concatenation.** For to-one relations (`oto`/`mto`), `merge` performs a regular deep merge of the object. For to-many relations, each item in the sent array is matched against the existing item that has the same PK (defined in `relations[key].pk`): if the PK matches, the two objects are merged together; if it doesn't match (a new item with no counterpart), it's simply added to the list. Existing items that don't appear in the sent array are kept.

```ts
const existing = await userRepository.get(1);
// existing: {
//   id: 1,
//   posts: [
//     { id: 10, title: "Post A", published: false },
//     { id: 11, title: "Post B", published: true },
//   ],
// }

const merged = await userRepository.merge(1, {
  posts: [
    { id: 10, published: true },  // same PK (id: 10) → merges with the existing item
    { title: "Post C" },          // no PK → added as a new item
  ],
});
// merged: {
//   id: 1,
//   posts: [
//     { id: 10, title: "Post A", published: true },  // merged
//     { id: 11, title: "Post B", published: true },  // kept, wasn't in the sent array
//     { title: "Post C" },                            // added
//   ],
// }
```

> Note that `merge` never removes items from a to-many relation — it only merges the ones that match by PK and adds the ones that don't. To remove items from a relation, use `save`/`patch` with `restriction: "set"` in the relation configuration.

### Configuring the base methods

The second argument of `.build(prisma, config)` lets you adjust the repository's global behavior and customize each base method individually through `baseMethods`.

```ts
userVSRepo.build(prisma, {
  // Shows VSRepository's internal logs on the console (built queries, detected prefix,
  // applied filters, etc). Great for debugging dynamic methods. Default = false.
  showWorking: true,

  baseMethods: {
    get: {
      // Enables/disables the method on the final repository. If `false`, the method
      // doesn't even appear in the repository's type (it's not just a runtime error). Default = true.
      active: true,

      // Select model applied by default when the method is called without `options.selectModel`.
      // Overrides the `defaultSelectModel` from setupVSRepo for this method only.
      defaultSelect: "public",
    },
    remove: {
      active: true,
      defaultSelect: "minimal",

      // When `true`, ignores the `requiredWhere` configured in setupVSRepo for
      // this specific method — useful when a method needs to "punch through" a
      // global filter (e.g. multi-tenancy) in a specific case. Default = false.
      ignoreRequiredWhere: false,
    },
    save: {
      // Here only `ignoreRequiredWhere` is set — `active` and `defaultSelect`
      // keep their defaults (true and the global `defaultSelectModel`).
      ignoreRequiredWhere: true,
    },
    patch: {
      // Only the select is overridden; the method stays active normally.
      defaultSelect: "minimal",
    },
    has: {
      active: false, // Disables 'has' (default = true) — the method disappears from the repository
    },
    softRemove: {
      // Soft-delete methods follow the same options (`active`, `defaultSelect`,
      // `ignoreRequiredWhere`). They're only available if `softRemovekName` is configured.
      active: true,
      defaultSelect: "minimal",
    },
  },
});
```

> Batch/aggregate methods like `removeList`, `softRemoveList`, `restoreList`, `total`, and `has` **do not** accept `defaultSelect` (they don't return a selectable record — they return `{ count }` or `boolean`). In these cases `BaseMethodConfig` is restricted to `active` and `ignoreRequiredWhere`.

---

## Select Models

`selectModels` defines named, reusable data projections.

```ts
selectModels: {
  public:   { id: true, name: true, email: true },
  internal: { id: true, name: true, email: true, password: true },
  minimal:  { id: true },
},
defaultSelectModel: "public",
```

`defaultSelectModel` defines which select is used automatically when none is specified in the call. It's recommended to always define it together with `selectModels`.

**Using a specific select in the call:**

```ts
const user = await userRepository.get(id, { selectModel: "minimal" });
```

**Returning Prisma's default payload (without select):**

```ts
const fullUser = await userRepository.get(id, { selectModel: false });
```

---

## Include Models

`includeModels` works similarly to `selectModels`, but instead of receiving a `select`, it receives a valid Prisma `include`.

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  selectModels: {
    public: { id: true, name: true, email: true },
  },
  defaultSelectModel: "public",
  includeModels: {
    withPosts: { posts: true },
    withPostsAndProfile: { posts: true, profile: true },
  },
}).build(prisma);
```

**Using an `includeModel` in the call:**

```ts
const user = await userRepository.get(id, { includeModel: "withPosts" });
```

In this case, the default `select` (`selectModels`/`defaultSelectModel`) is ignored and only the `include` is sent to Prisma.

### Differences from `selectModels`

- **Can only be passed in the method call**, via `options.includeModel`. There's no `defaultIncludeModel` or `defaultInclude` — there's no way to configure a default `includeModel` on the repository, unlike what happens with `defaultSelectModel`.
- **`includeModel` and `selectModel` cannot be passed together** in the same call. If an `includeModel` is provided, any `selectModel` (including the default one) is ignored.

```ts
// CORRECT ✅ — includeModel only
await userRepository.get(id, { includeModel: "withPosts" });

// CORRECT ✅ — selectModel only
await userRepository.get(id, { selectModel: "public" });

// WRONG ❌ — combining both is not allowed
await userRepository.get(id, { selectModel: "public", includeModel: "withPosts" });
```

---

## Required Where

`requiredWhere` defines filters that are automatically applied to every query on the repository.

```ts
requiredWhere: { active: true },
```

Now every query will automatically include `active: true`:

```ts
// Internally: WHERE active = true
const users = await userRepository.findMany();

// Internally: WHERE email = 'john@email.com' AND active = true
const user = await userRepository.findByEmail("john@email.com");
```

Useful for manual soft-deletes, multi-tenancy, and global filters of any kind.

---

## Default Ordenation

`defaultOrdenation` defines a default ordering that's automatically applied to every query that accepts `orderBy`, without needing to repeat the `order` argument on every call.

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  defaultOrdenation: { createdAt: "desc" },
}).build(prisma);
```

With this, every listing query will already come ordered by `createdAt` descending:

```ts
// Internally: ORDER BY createdAt DESC
const users = await userRepository.getAll();

// Also applies to getAll with pagination
const paginated = await userRepository.getAll({ pagination: { take: 10 } });
```

**`defaultOrdenation` is ignored when:**

- The method uses the `Ordered`, `OrderedAndPaginated`, or `PaginatedAndOrdered` suffix — in these cases the `order` argument passed in the call takes priority.
- The dynamic method has `injectOrdenation` configured — the method's fixed ordering takes precedence.

```ts
methods: {
  findManyPaginatedAndOrdered: { map: true },         // order comes from the argument → defaultOrdenation ignored
  findManyByActive:            { map: true },         // no Ordered → defaultOrdenation applied
  findManyByStatus: {
    map: true,
    injectOrdenation: { name: "asc" },                // injectOrdenation → defaultOrdenation ignored
  },
}
```

> `defaultOrdenation` accepts the same type as Prisma's native `orderBy` for the model — including arrays of chained orderings.

---

## `see` option

When `softRemovekName` is configured, every method accepts the `see` option to control the visibility of soft-deleted records:

| Value       | Behavior                                                     |
| ----------- | --------------------------------------------------------------|
| `"active"`  | Returns only records that are **not** removed (default)      |
| `"removed"` | Returns only removed records                                  |
| `"all"`     | Returns all records, regardless of status                     |

```ts
// Returns only active users (default)
const active = await userRepository.getAll();

// Returns only removed users
const removed = await userRepository.getAll({ see: "removed" });

// Returns all
const all = await userRepository.getAll({ see: "all" });
```

> The `see` option works independently of `requiredWhere` — it's applied on top of the soft-delete filter, not as a replacement for it.

---

## Dynamic methods

Dynamic methods are defined in the `methods` property and have their behavior inferred from their name.

```ts
methods: {
  findOneByEmail:     { map: true },
  findManyPaginated:  { map: true },
  updateById:         { map: true },
  deleteManyByIdIn:   { map: true },
}
```

---

### Available prefixes

The method name's prefix determines which Prisma operation will be called and which arguments are expected.

| Prefix                      | Prisma operation           | Return                  | Notes                                                                     |
| ---------------------------- | -------------------------- | ------------------------ | ---------------------------------------------------------------------------|
| `findOneBy`                 | `findFirst`                 | `T \| null`              | Single return.                                                             |
| `findBy`                    | `findMany` / `findFirst`   | `T[]` or `T \| null`     | Default is list; use `fbMode: "one"` for a single return (**deprecated**, use `findOneBy`) |
| `findUniqueBy`               | `findUnique`                | `T \| null`              |                                                                             |
| `findUniqueOrThrowBy`        | `findUniqueOrThrow`         | `T`                       | Throws an error if not found                                               |
| `findFirstBy`                | `findFirst`                 | `T \| null`              | Accepts fields as filter                                                   |
| `findFirstOrThrowBy`         | `findFirstOrThrow`          | `T`                       | Accepts fields as filter; throws an error if not found                     |
| `findFirst`                  | `findFirst`                 | `T \| null`              | No field filters; applies only `requiredWhere` and `pushWhere`             |
| `findFirstOrThrow`           | `findFirstOrThrow`          | `T`                       | No field filters; applies only `requiredWhere` and `pushWhere`; throws an error if not found |
| `findManyBy`                 | `findMany`                  | `T[]`                     | Accepts fields as filter                                                   |
| `findMany`                   | `findMany`                  | `T[]`                     | No field filters; applies only `requiredWhere` and `pushWhere`             |
| `findOneWhere`                | `findFirst`                 | `T \| null`              | Receives an explicit `where` object as argument                            |
| `findListWhere`               | `findMany`                  | `T[]`                     | Receives an explicit `where` object as argument                            |
| `existsBy`                    | `findFirst`                 | `boolean`                 | Returns `true` if found, `false` otherwise                                 |
| `existsWhere`                 | `findFirst`                 | `boolean`                 | Receives an explicit `where` object and returns whether it exists          |
| `countBy`                     | `count`                      | `number`                  | Accepts fields as filter                                                   |
| `countWhere`                  | `count`                      | `number`                  | Receives an explicit `where` object as argument                            |
| `count`                       | `count`                      | `number`                  | No field filters; applies only `requiredWhere` and `pushWhere`             |
| `create`                      | `create`                     | `T`                        | Receives `data` as argument                                                |
| `createMany`                  | `createMany`                 | `{ count: number }`       | Receives `data` as argument; supports `SkipDuplicates`                     |
| `createManyAndReturn`         | `createManyAndReturn`        | `T[]`                      | Receives `data` as argument; supports `SkipDuplicates`                     |
| `updateBy`                    | `update`                      | `T`                        | Receives `data` as argument                                                |
| `updateManyBy`                | `updateMany`                  | `{ count: number }`       | Receives `data` as argument                                                |
| `updateManyWhere`             | `updateMany`                  | `{ count: number }`       | Receives a `where` object and a `data` object as arguments                 |
| `updateManyAndReturnBy`       | `updateManyAndReturn`         | `T[]`                      | Receives `data` as argument                                                |
| `updateManyAndReturnWhere`    | `updateManyAndReturn`         | `T[]`                      | Receives a `where` object and a `data` object as arguments                 |
| `upsertBy`                    | `upsert`                       | `T`                        | Receives `update` and `create` as arguments                                |
| `deleteBy`                    | `delete`                       | `T`                        |                                                                             |
| `deleteManyBy`                | `deleteMany`                   | `{ count: number }`       |                                                                             |
| `deleteManyWhere`             | `deleteMany`                   | `{ count: number }`       | Receives an explicit `where` object as argument                            |
| `aggregate`                   | `aggregate`                     | `Dynamic`                  | Name must be exact; receives native Prisma args; ignores `selectModels`, `pushWhere`, and `requiredWhere` |
| `groupBy`                     | `groupBy`                       | `Dynamic[]`                | Name must be exact; receives native Prisma args; ignores `selectModels`, `pushWhere`, and `requiredWhere` |

---

### Field filters

Filters are suffixes applied to the field name inside the method. The field itself comes capitalized right after the prefix (or after `By`).

| Suffix              | Prisma operator       | Argument required          |
| -------------------- | ---------------------- | ---------------------------|
| *(no suffix)*        | equality (`=`)          | yes                        |
| `Not`                | `not`                    | yes                        |
| `In`                 | `in`                     | yes (array)                 |
| `NotIn`              | `notIn`                  | yes (array)                 |
| `Contains`           | `contains`               | yes                         |
| `NotContains`        | `not.contains`           | yes                         |
| `StartsWith`         | `startsWith`             | yes                         |
| `NotStartsWith`      | `not.startsWith`         | yes                         |
| `EndsWith`           | `endsWith`               | yes                         |
| `NotEndsWith`        | `not.endsWith`           | yes                         |
| `GreaterThan`        | `gt`                      | yes                         |
| `GreaterThanEqual`   | `gte`                     | yes                         |
| `LessThan`           | `lt`                      | yes                         |
| `LessThanEqual`      | `lte`                     | yes                         |
| `Between`            | `gte` + `lte`             | yes (tuple `[min, max]`)     |
| `NotBetween`         | `not.gte` + `not.lte`     | yes (tuple `[min, max]`)     |
| `IsNull`             | `null`                    | no                          |
| `IsNotNull`          | `not: null`               | no                          |
| `IsTrue`             | `true`                    | no                          |
| `IsFalse`            | `false`                   | no                          |
| `Insensitive`        | `mode: 'insensitive'`     | combinator                  |

`Insensitive` is a combinator and can be used together with another text filter:

```ts
findByNameContainsInsensitive    // { name: { contains: value, mode: 'insensitive' } }
findByEmailStartsWithInsensitive // { email: { startsWith: value, mode: 'insensitive' } }
findByNameInsensitive            // { name: { equals: value, mode: 'insensitive' } }
```

`Between` and `NotBetween` receive a **tuple `[minValue, maxValue]`**:

```ts
methods: {
  findManyByAgeBetween:      { map: true },
  findManyBySalaryNotBetween: { map: true },
  findManyByCreatedAtBetween: { map: true },
}

await userRepository.findManyByAgeBetween([18, 65]);
await userRepository.findManyBySalaryNotBetween([1000, 5000]);
await userRepository.findManyByCreatedAtBetween([new Date("2024-01-01"), new Date("2024-12-31")]);
```

The `Optional` suffix can be added to any field to make the argument optional:

```ts
findByNameOptionalAndEmail // name is optional, email is required
```

---

### Logical operators

| Operator  | Usage in the name             | Example                          |
| --------- | ------------------------------ | -----------------------------------|
| `And`     | between two fields              | `findOneByIdAndEmail`              |
| `Or`      | between two fields              | `findByNameOrEmail`                |
| `AND`     | separates a final `AND` block   | `findByEmailOrNameANDActiveStatus` |

`AND` (in caps) has a specific rule:

- Only **one** `AND` can exist per method.
- All fields after `AND` are injected inside `AND: []`.
- After an `AND`, there can't be an `Or`.

Example:

```ts
methods: {
  findOneByIdAndEmail:   { map: true },
  findByNameOrEmail:  { map: true },
  findFirstByIdOrEmailAndName: { map: true },
  findByEmailOrNameANDActiveStatusAndAgeGreaterThan: { map: true }
}

await userRepository.findOneByIdAndEmail(1, "john@email.com");
await userRepository.findByNameOrEmail("John", "john@email.com");
await userRepository.findFirstByIdOrEmailAndName(1, "john@email.com", "John");
await userRepository.findByEmailOrNameANDActiveStatusAndAgeGreaterThan("john@email.com", "John", true, 17)
```

Generates (`findOneByIdAndEmail`):

```ts
{
  id: 1,
  email: "john@email.com"
}
```

Generates (`findByNameOrEmail`):

```ts
{
  OR: [
    { name: "John" },
    { email: "john@email.com" }
  ]
}
```

Generates (`findFirstByIdOrEmailAndName`):

```ts
{
  OR: [
    { id: 1 },
    {
      email: "john@email.com",
      name: "John"
    }
  ]
}
```

Generates (`findByEmailOrNameANDActiveStatusAndAgeGreaterThan`):

```ts
{
  OR: [
    { email: "john@email.com" },
    { name: "John" }
  ],
  AND: [
    { activeStatus: true },
    { age: { gt: 17 } }
  ]
}
```

---

### Relation filters

Allow filtering by fields of related models.

> [!IMPORTANT]
> - **Relation typing**: For TypeScript to recognize the types of relation fields in dynamic methods, the generic entity type passed to `setupVSRepo` must include the structured relations (e.g. using Prisma's `UserGetPayload<{ include: { profile: true, posts: true } }>`).
> - **Suffix compatibility**:
>   - The `Some`, `Every`, and `None` suffixes only work for **to-many** relations (`many-to-many` and `one-to-many`).
>   - The `With` and `Without` suffixes only work for **to-one** relations (`one-to-one` and `many-to-one`).

| Relation suffix         | Prisma operator  | Note                                                  |
| ------------------------ | ----------------- | -------------------------------------------------------|
| `Some`                    | `some: {}`         | Relation has *some* record                             |
| `SomeField`               | `some.field`       | Filters within the relation's records                  |
| `EveryField`              | `every.field`      | Filters within the relation's records                  |
| `None`                    | `none: {}`         | Relation has *no* records                               |
| `NoneField`               | `none.field`       | Filters within the relation's records                  |
| `With`                    | `is: {}`           | Relation exists (not null)                              |
| `WithField`               | `is.field`         | Filters a field within the relation                     |
| `Without`                 | `isNot: {}`        | Relation doesn't exist (is null)                        |
| `WithoutField`            | `isNot.field`      | Filters a field within the relation with negation       |

Considering `user` with a to-one relation `profile` and a to-many relation `posts`:

```ts
methods: {
  // to-many (posts)
  findByPostsSome:                { map: true }, // has at least one post
  findByPostsSomeTitle:           { map: true }, // has at least one post with that title
  findByPostsEveryPublishedIsTrue:{ map: true }, // all posts are published
  findByPostsNone:                { map: true }, // has no posts
  findByPostsNoneTitle:           { map: true }, // no post has that title

  // to-one (profile)
  findByProfileWith:             { map: true }, // has a profile (not null)
  findByProfileWithBio:          { map: true }, // has a profile with that bio
  findByProfileWithout:          { map: true }, // has no profile (is null)
  findByProfileWithoutBio:       { map: true }, // has a profile, but with a different bio than the one provided
}

await userRepository.findByPostsSome();
await userRepository.findByPostsSomeTitle("My first post");
await userRepository.findByPostsEveryPublishedIsTrue();
await userRepository.findByPostsNone();
await userRepository.findByPostsNoneTitle("Draft");

await userRepository.findByProfileWith();
await userRepository.findByProfileWithBio("Hello, world!");
await userRepository.findByProfileWithout();
await userRepository.findByProfileWithoutBio("Old bio");
```

Generates (`findByPostsSomeTitle`):

```ts
{
  posts: {
    some: { title: "My first post" }
  }
}
```

Generates (`findByPostsEveryPublishedIsTrue`):

```ts
{
  posts: {
    every: { published: true }
  }
}
```

Generates (`findByProfileWithBio`):

```ts
{
  profile: {
    is: { bio: "Hello, world!" }
  }
}
```

Generates (`findByProfileWithout`):

```ts
{
  profile: {
    isNot: {}
  }
}
```

> `Some`, `None`, `With`, and `Without` (without a field) don't receive an argument — the whole relation is tested for the existence of records (`some`/`none`) or for being `null`/not `null` (`is`/`isNot`). The `SomeField`, `EveryField`, `NoneField`, `WithField`, and `WithoutField` variants receive the filtered field's value as an argument.

---

### Pagination and ordering suffixes

Applied at the **end** of the method name, they automatically inject the pagination and ordering arguments.

| Suffix                 | Additional arguments           |
| ------------------------ | -------------------------------|
| `Paginated`               | `(pagination)`                  |
| `Ordered`                 | `(order)`                       |
| `OrderedAndPaginated`     | `(order, pagination)`           |
| `PaginatedAndOrdered`     | `(pagination, order)`           |

For `createMany` and `createManyAndReturn`, the `SkipDuplicates` suffix is available:

| Suffix              | Effect                                     |
| --------------------- | ---------------------------------------------|
| `SkipDuplicates`       | Skips duplicate records during insertion      |

---

### Distinct

The `Distinct` suffix lets you get only unique records based on one or more fields, equivalent to Prisma's `distinct` option.

To use it, put `Distinct` in the method name (after the field filters, if any) followed by the desired fields separated by `And`. The first character of each field must be uppercase, just like in regular field filters.

```ts
methods: {
    // Returns unique users combining "age" and "role" (no field filter)
    findManyDistinctAgeAndRole: { map: true },

    // Distinct combined with the Paginated suffix
    findManyDistinctNamePaginated: { map: true },

    // Distinct combined with a field filter (name) — filters by name and then applies distinct on role
    findManyByNameDistinctRole: { map: true },
},
```

```ts
// No arguments: the distinct fields are already fixed in the method name
await userRepository.findManyDistinctAgeAndRole();

// The pagination argument still works normally
await userRepository.findManyDistinctNamePaginated({ take: 10, skip: 0 });

// The "name" field filter is still passed normally as an argument
await userRepository.findManyByNameDistinctRole("John");
```

> The fields specified after `Distinct` are resolved from the method name at build time — they **don't** become runtime arguments, unlike regular field filters.

`Distinct` is available on prefixes that read multiple or single records: `findMany`, `findManyBy`, `findFirst`, `findFirstBy`, `findFirstOrThrow`, `findFirstOrThrowBy`, `findBy`, `findOneBy`, `findWhere`, `findOneWhere`, `findListWhere`, `existsBy`, and `existsWhere`.

---

### Method configuration

Each entry in `methods` accepts the following options:

| Option               | Type                             | Default       | Description                                                                                                     |
| --------------------- | --------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------|
| `map`                 | `boolean`                          | —              | **Required.** Defines whether the method will be exposed on the repository.                                       |
| `whereType`           | `'extending'` \| `'overwrite'`    | `extending`    | `extending` combines with `requiredWhere`. `overwrite` ignores `requiredWhere`.                                    |
| `selectModel`         | `keyof SelectModels \| false`     | —              | Overrides `defaultSelectModel` for this method.                                                                    |
| `fbMode`              | `'one'` \| `'list'`                | `'list'`       | (**Deprecated. Use `findOneBy`**) Only for `findBy`. `'one'` returns `T \| null`; `'list'` returns `T[]`.          |
| `proxyTo`             | `Valid method pattern`             | —              | Delegates the logic to another valid method pattern.                                                               |
| `pushWhere`           | `WhereModel<M>`                    | —              | Extra `where` added to the query in addition to `requiredWhere`.                                                   |
| `injectOrdenation`    | `OrdenationModel<M>`               | —              | Fixed ordering automatically injected into the query.                                                              |
| `injectPagination`    | `PaginationModel<M>`               | —              | Fixed pagination automatically injected into the query.                                                            |

---

### Aggregate and GroupBy

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  methods: {
    aggregate: { map: true },
    groupBy: { map: true },
  },
}).build(prisma);
```

> [!NOTE]
> These methods must have exactly these names (`aggregate` and `groupBy`).
> Unlike the other dynamic methods, they receive native Prisma arguments and **ignore** the `selectModels`, `pushWhere`, and `requiredWhere` configurations.

---

## Relations in save

Configure relations so that `save` and `patch` manage them automatically (`saveList` and `patchList` also manage relations automatically).

```ts
import type { Prisma } from "../../generated/prisma/client";

type User = Prisma.userGetPayload<{
  include: { profile: true; posts: true };
}>;

const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",

  relations: {
    profile: {
      pk: "id",
      mode: "oto",
      restriction: "set",
    },
    posts: {
      pk: "id",
      mode: "otm",
      restriction: "add",
    },
  },
}).build(prisma);
```

**Relation modes:**

| Mode  | Relation      |
| ----- | -------------- |
| `oto` | one-to-one     |
| `otm` | one-to-many    |
| `mto` | many-to-one    |
| `mtm` | many-to-many   |

**Restrictions:**

| Restriction | Behavior on update                                             |
| ------------ | ----------------------------------------------------------------|
| `set`         | Fully replaces (removes the ones that weren't sent)             |
| `add`         | Adds/updates without removing existing ones                      |

> [!WARNING]
> **`set` means different things depending on the relation's `mode` — and this can cause data loss if you're not careful.**
>
> In relations where the related record **belongs** to the parent record (`oto` and `otm`), "removing the ones that weren't sent" means **deleting the record from the database** (`delete`/`deleteMany`). In relations where the related record is **independent** (`mto` and `mtm`), "removing" just means **unlinking** (`disconnect`/`set: []`) — the related record continues to exist in the database, it just stops pointing to the parent (or being in the join table).
>
> | Mode  | `restriction: "set"` when an item is omitted | Does the item continue to exist in the database? |
> | ----- | ------------------------------------------------ | -----------------------------------------------------|
> | `oto` | Passing `null` in the field → **deletes** the related record (`delete: true`) | No |
> | `otm` | Items outside the sent list → **deleted** (`deleteMany` with `notIn`)          | No |
> | `mto` | Passing `null` in the field (with `nullable: true`) → **unlinks** (`disconnect: true`) | Yes |
> | `mtm` | Items outside the sent list → **unlinked** from the join table (`set: []`)     | Yes |
>
> Practical example: if `posts` is `otm` with `restriction: "set"`, a `save`/`patch` that sends the user with only 2 of the 5 existing posts will **delete the other 3 posts from the database**, not just unlink them from the user. If the expected behavior is just to unlink without deleting, use `restriction: "add"` (which never removes anything) and handle removal manually.

**`mto` relation with nullable:**

Use `nullable` (lowercase) to allow unlinking a many-to-one relation:

```ts
relations: {
  category: {
    pk: "id",
    mode: "mto",
    restriction: "set",
    nullable: true, // allows passing null to unlink
  },
}
```

---

## Transactions

All methods accept `options.db` to participate in a transaction:

```ts
await userRepository.prisma.$transaction(async (tx) => {
  const user = await userRepository.save(
    { name: "Mary", email: "mary@email.com", password: "password" },
    { db: tx }
  );

  await userLogsRepository.save(
    { action: "User registration", data: { registeredUser: user.id } },
    { db: tx }
  );
});
```

For `saveList` and `patchList`, the `db` field must be a `DbTransaction`:

```ts
await prisma.$transaction(async (tx) => {
  // CORRECT: tx is a DbTransaction
  const registeredUsers = await userRepository.saveList([{ name: "Mary" }, { name: "Lucas" }], { db: tx });

  await userLogsRepository.save(
    { action: "User registration", data: { registeredUsers: registeredUsers.map(u => u.id) } },
    { db: tx }
  );
});
```

---

## Extending a repository

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  methods: {
    findOneByEmailEndsWith: { map: true },
  },
})
  .build(prisma)
  .extend((repo) => ({
    findActiveByDomain: async (domain: string) => {
      return repo.findOneByEmailEndsWith(`@${domain}`);
    },

    activateMultiple: async (ids: string[]) => {
      return repo.patchList(ids.map(id => [id, { active: true }]));
    },
  }));
```

---

## Error handling

VSRepository throws `VSRepoError` and its subclasses in specific situations (Prisma errors are not overridden):

```ts
import { VSRepoError, VSRepoRuntimeError } from "../../generated/vsrepo";

try {
  const user = await userRepository.getOrThrow("id-that-does-not-exist");
} catch (error) {
  if (error instanceof VSRepoRuntimeError && error.code === "20727") {
    console.error("Record not found");
  } else if (error instanceof VSRepoError) {
    console.error("Repository error:", error.message);
  } else {
    console.error("Error:", error.message)
  }
}
```

**Available subclasses:**

| Class                 | When it's thrown                                                    |
| ---------------------- | ------------------------------------------------------------------------|
| `VSRepoConfigError`     | Invalid configuration in `setupVSRepo`                                   |
| `VSRepoBuildError`      | Invalid method name, field type, or configuration in `build`             |
| `VSRepoExtendError`     | Invalid argument in `extend`                                             |
| `VSRepoRuntimeError`    | Runtime error during an operation                                        |

`VSRepoRuntimeError` has a `code` property for programmatic identification. Code `"20727"` is thrown by `getOrThrow` when the record is not found, for example.

---

## Utility types

### Client types

```ts
import type { DbClient, DbTransaction, ClientOrTransaction } from "../../generated/vsrepo";

type DbClient            = PrismaClient;
type DbTransaction       = Prisma.TransactionClient;
type ClientOrTransaction = DbClient | DbTransaction;
```

### Soft-delete visibility type

```ts
import type { SeeMode } from "../../generated/vsrepo";

type SeeMode = "active" | "removed" | "all";
```

### Types derived from the Prisma model

```ts
import type {
  SelectModel,
  SelectModels,
  IncludeModel,
  IncludeModels,
  WhereModel,
  OrdenationModel,
  PaginationModel,
  ModelUpsertInput,
  PrismaModelInputs,
} from "../../generated/vsrepo";
```

### Method options types

```ts
import type { MethodOptions, MethodOptionsModel } from "../../generated/vsrepo";

// MethodOptions<S, IM> — options passed into the repository's methods
type Opts = MethodOptions<"public" | "minimal", "withPosts">;

// MethodOptionsModel<TRepo> — derived from a configured VSRepository instance
const userVSRepo = setupVSRepo<User, "user">()(config);
type OptsModel = MethodOptionsModel<typeof userVSRepo>;
```

> The second parameter of `MethodOptions` (`IM`) represents the valid keys of `includeModels`. When provided, `selectModel` and `includeModel` become mutually exclusive in the type — it's not possible to pass both in the same call.

### Configuration types

```ts
import type {
  MethodConfig,
  RepoConfig,
  BuildConfig,
  RepositoryRelations,
  ExtractRelationConfig,
} from "../../generated/vsrepo";
```

### Built repository type

```ts
import type { RepositoryOf } from "../../generated/vsrepo";

const userVSRepo = setupVSRepo<User, "user">()({ ... });
type UserRepository = RepositoryOf<typeof userVSRepo>;
```

`RepositoryOf` accepts three parameters:

```ts
type RepositoryOf<TRepo, C extends BuildConfig | undefined = undefined, E = unknown>
```

### `save` and `patch` payload types

```ts
import type { SaveObject, PatchObject } from "../../generated/vsrepo";

const userVSRepo = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  relations: {
    profile: { pk: "id", mode: "oto", restriction: "set" },
  },
});

type UserSavePayload  = SaveObject<Prisma.UserCreateInput, typeof userVSRepo>;
type UserPatchPayload = PatchObject<Prisma.UserUpdateInput, typeof userVSRepo>;
```

---

## API Reference

### `setupVSRepo<T, M>()(config)`

```ts
setupVSRepo<TPayload, TTableName>()({
  tableName: Uncapitalize<M>;                     // Table name in Prisma
  pkName: keyof T;                                // Primary key name
  softRemovekName?: keyof T & string;             // DateTime field for soft-delete
  selectModels?: SelectModels<M>;                 // Named data projections (select)
  defaultSelectModel?: keyof SM;                  // Select applied by default
  includeModels?: IncludeModels<M>;               // Named data projections (include) — no default, only in the call
  requiredWhere?: WhereModel<M>;                  // Always-applied filters
  defaultOrdenation?: OrdenationModel<M>;         // Default ordering for queries without Ordered/injectOrdenation
  relations?: RepositoryRelations<T>;             // Relation configuration
  methods?: Record<string, MethodConfig<M, SM>>;  // Dynamic methods
});
```

### `.build(prisma, config?)`

```ts
vsRepo.build(prisma, {
  showWorking?: boolean;   // Shows internal logs on the console (default = false)

  baseMethods?: {
    // Methods that can use a defaultSelect
    get?:             { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getOrThrow?:      { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getList?:         { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    remove?:          { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    save?:            { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    saveList?:        { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    patch?:           { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    patchList?:       { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    merge?:           { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getAll?:          { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    softRemove?:      { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    restore?:         { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };

    // Methods that do NOT accept defaultSelect
    removeList?:      { active?: boolean; ignoreRequiredWhere?: boolean };
    softRemoveList?:  { active?: boolean; ignoreRequiredWhere?: boolean };
    restoreList?:     { active?: boolean; ignoreRequiredWhere?: boolean };
    total?:           { active?: boolean; ignoreRequiredWhere?: boolean };
    has?:             { active?: boolean; ignoreRequiredWhere?: boolean };
  };
});
```

### `.extend(fn)`

```ts
repo.extend((repo) => ({
  myMethod: () => { ... }
}));
```

---

## Practical examples

Besides this README, the repository has an **[`examples/`](https://github.com/jaobrabo123/VSRepository/tree/main/examples)** folder with practical, commented, ready-to-run examples — it's the best place to see VSRepository being used in real scenarios.

```
examples/
├── prisma.ts             # PrismaClient instance used by the examples
├── repositories.ts       # Repository configuration (User, Address, Product) with setupVSRepo
└── tests/
    ├── base-methods.test.ts       # Base methods: get, save, patch, remove, getAll, total, has...
    ├── relations.test.ts          # How to configure and use relations in save/patch and in filters
    ├── required-where.test.ts     # How requiredWhere is automatically applied to queries
    ├── dynamic-methods.test.ts    # Prefixes, field filters, logical operators, and pagination/ordering
    ├── transactions.test.ts       # Transactions with options.db and instance access via repository.prisma
    ├── soft-delete.test.ts        # Soft-delete: softRemove, softRemoveList, restore, restoreList and SeeMode
    └── batch-methods.test.ts      # Batch operations: getList, saveList, patchList and merge
```

Each file in `tests/` is an independent, runnable script (via `tsx`) that demonstrates a specific set of features, with `console.log` at each step so you can follow the result in the terminal. The folder itself has a [README](https://github.com/jaobrabo123/VSRepository/blob/main/examples/README.md) explaining the suggested reading order, how to set up the environment, and how to run the tests.

---

## Contributing

Contributions are welcome! If you found a bug, have an improvement idea, or want to help with the documentation, feel free to get involved (**[GitHub Repository](https://github.com/jaobrabo123/VSRepository)**):

1. **Fork** the project.
2. Create a new branch with your change: `git checkout -b fixing-bug`.
3. Push to your branch: `git push origin fixing-bug`.
4. Open a **Pull Request**.

To report issues or suggest new features, open an **Issue**.

---

## Requirements

- Node.js 18+ (ESM)
- Prisma
- TypeScript (optional, but strongly recommended)
- `"moduleResolution": "bundler"` or `"nodenext"` in tsconfig

Recommended `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "lib": ["ES2020"]
  }
}
```

---

## Troubleshooting

**Generic types not inferred** — Check that `strict: true` and `moduleResolution: "bundler"` or `"nodenext"` are set in `tsconfig.json`.

**Dynamic method doesn't exist at runtime** — The field referenced in the method name must exist in the Prisma model. E.g.: `findByEmail` requires the model to have an `email` field.

**`proxyTo` required** — Names outside the standard patterns (e.g. `searchByEmail`) aren't parsed directly. Use `proxyTo: "findByEmail"` in these cases.

**Select model returns unexpected fields** — Check that the select model defines exactly the fields your TypeScript type expects.

**`selectModel` and `includeModel` together in the same call** — Not allowed. Choose one or the other: if `includeModel` is provided, the `select` (including `defaultSelectModel`) is ignored and only the `include` is sent to Prisma.

**`includeModel` doesn't appear as a default repository option** — This is expected. Unlike `defaultSelectModel`, there's no `defaultIncludeModel`/`defaultInclude`. An `includeModel` can only be set in the method call, via `options.includeModel`.

**`softRemovekName` throws an error at build** — The provided field must be of type `DateTime` in the Prisma schema. Types like `Boolean` or `String` are not accepted.

**`defaultOrdenation` isn't being applied** — Check whether the method uses the `Ordered`, `OrderedAndPaginated`, or `PaginatedAndOrdered` suffix, and whether it has `injectOrdenation` configured. Both take priority over the default ordering.

**`Distinct` suffix not recognized** — `Distinct` is only resolved on read prefixes (`findMany`, `findFirst`, `findBy`, `existsBy`, etc). In methods like `count`, `createMany`, `updateMany`, or `deleteMany` the suffix is ignored.

**`saveList`/`patchList` with invalid `db`** — The `db` field in these methods only accepts a `DbTransaction` (the return of `prisma.$transaction`), not the main client. Passing the `PrismaClient` directly will cause unexpected behavior.
