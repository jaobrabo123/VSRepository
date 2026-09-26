<div align="center">
  <img src="https://res.cloudinary.com/ddbfifdxd/image/upload/w_200,q_auto,f_auto/v1786386427/VS_logo_TextoAbaixo_yev4tq.png" alt="VSRepository Logo" width="200"/>

  <p style="margin-top: 12px;">
    <img src="https://img.shields.io/npm/v/vsrepo?style=flat-square" alt="npm version"/>
    <img src="https://img.shields.io/npm/l/vsrepo?style=flat-square" alt="npm license"/>
    <img src="https://img.shields.io/npm/dt/vsrepo?style=flat-square" alt="npm downloads"/>
    <img src="https://img.shields.io/badge/inspired%20by-JpaRepository-E73121?style=flat-square" alt="inspired by JpaRepository"/>
  </p>
</div>

# VSRepository

🇺🇸 You're reading the English version. [🇧🇷 Ler em português](./README.pt-BR.md)

**ORM-agnostic** repository pattern library, with full **TypeScript** support and automatic **type inference**. The core delegates every operation to a pluggable **adapter**, so the same repository API can work against Prisma, Drizzle, or any other ORM/database that implements the adapter contract. Coming from the old [v1](https://github.com/jaobrabo123/VSRepository/tree/v1)? See [Migrating from v1](./docs/migrating-from-v1.md).

VSRepository lets you create strongly-typed repositories with:

- Automatic **base methods**: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `merge`, `getAll`, `total`, `has`
- **Native soft-delete**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Dynamic methods** inferred from a `declare` field name via the `@DynamicMethod` decorator: `findOneByEmail`, `findByStatusPaginated`, `updateById`
- **Raw SQL query methods** via the `@QueryMethod` decorator (bypassing the name-parsing engine entirely), parameterized `VSSql` fragments for ad-hoc `query()` calls, and agnostic `?1`, `?2` placeholders with `vsPlaceholders`
- Ad-hoc **`select`/`relations`** per call — no more pre-declared named projections
- **Type safety** across 100% of operations
- Native ORM **transactions**, shared across repositories
- An **ORM-agnostic core** — the same repository class works with any `VSRepoAdapter` implementation

---

## Documentation

The sections below (adapter status, installation, basic usage) are the essentials to get you started. Everything about a specific feature — with more detail and more examples — lives in its own guide under [`docs/`](./docs/README.md), each available in English and in [Português](./docs/README.pt-BR.md):

| Guide | Covers |
| --- | --- |
| [Base methods, configuration & soft-delete](./docs/base-methods.md) | Constructor options, the 12 automatic CRUD methods, native soft-delete, and the 8 atomic/aggregate methods (`increment`, `sum`, ...). |
| [`select` and `relations`](./docs/select-and-relations.md) | Ad-hoc field selection and eager relation loading on any call, and `InferMethodReturn` to narrow the return type accordingly. |
| [Dynamic methods](./docs/dynamic-methods.md) | `findByEmail`-style methods parsed from a `declare`d method name: prefixes, field filters, logical operators, relation filters, ordering/pagination/distinct. |
| [Query methods (raw SQL)](./docs/query-methods.md) | Raw SQL via `@QueryMethod`, parameterized `VSSql` fragments and the agnostic `?1`/`?2` placeholders (`vsPlaceholders`). |
| [Query builder](./docs/query-builder.md) | The fluent `createQueryBuilder()` API for queries assembled at runtime, including pagination, soft-delete visibility and transactions. |
| [Raw query builder](./docs/raw-query-builder.md) | The fluent `createRawQueryBuilder()` API for hand-written `SELECT` queries too SQL-specific for the query builder — joins, subqueries, CTEs (`with`/`withRecursive`). |
| [Transactions](./docs/transactions.md) | Running several repositories against the same native ORM transaction. |
| [Utility types](./docs/utility-types.md) | The exported helper types (`InferMethodType`, `InferMethodReturn`, `KeysOfType`, ...) and where each one is used. |
| [Writing your own adapter](./docs/writing-an-adapter.md) | How to implement `VSRepoAdapter` for a new ORM or database, method by method. |
| [Error handling](./docs/error-handling.md) | `VSRepoError`, `VSRepoErrorType`, and `VSRepoAdapterError`/`AdapterErrorCode`. |
| [Logging](./docs/logging.md) | `logLevel`, `logSlowThresholdMs`, and the log format used by the repository and the query builder. |
| [Migrating from v1](./docs/migrating-from-v1.md) | Everything that changed between v1 and v2 — API, config, renamed suffixes, removed features — in a single reference for migrating existing repositories. |

---

## Adapter status

VSRepository is **ORM-agnostic by design**. The core package (`vsrepo`) only ships the repository class, the decorators, the name-parsing engine, error handling and logging — it does **not** ship a production adapter. Actual ORM/database support is meant to live in **separate, independently versioned packages**, one per ORM (and, where it makes sense, one per major ORM version), for example:

- `@vsrepo/prisma7-adapter`
- `@vsrepo/prisma8-adapter`
- `@vsrepo/typeorm-adapter`
- `@vsrepo/drizzle-adapter`

The Prisma 7 adapter is published to npm as `@vsrepo/prisma7-adapter`. The Drizzle adapter is available as an **alpha** release — install it with `@vsrepo/drizzle-adapter@alpha`. Adapters for other ORMs are **planned** but not published yet. Until an official `@vsrepo/*-adapter` package exists for your ORM, you're welcome to write your own for your project, and if you'd like, publish it and open a PR to help grow the ecosystem — contributions here are very welcome.

| Adapter                              | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma 7 (`@vsrepo/prisma7-adapter`) | 🟢 **Released** — published to npm, implements the `VSRepoAdapter` contract (CRUD, relations, transactions, `merge`, logging, etc.) with tests; see [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) for source and docs. |
| Drizzle (`@vsrepo/drizzle-adapter`)  | 🔵 **Alpha** — an early release is available on npm; install it with `npm i @vsrepo/drizzle-adapter@alpha`. The API may still change before the stable release. Check the [`DrizzleAdapter`](https://github.com/jaobrabo123/VSRepoDrizzleAdapter) repository for the current status and known limitations, and feel free to contribute.                                                                                                                                                                                                                                                                                                         |
| Other ORMs (Prisma 8, TypeORM, etc.) | 🟡 **Planned, not published yet.** No official package exists yet — write your own adapter for now (see [Writing your own adapter](./docs/writing-an-adapter.md#writing-your-own-adapter)), and consider publishing/contributing it back.                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Custom adapters                      | 🟢 Fully supported today — implement the [`VSRepoAdapter`](./docs/writing-an-adapter.md#writing-your-own-adapter) abstract class yourself for any ORM/database you need, in your own project or package.                                                                                                                                                                                                                                                                                                                                                                                               |

In short: the repository class, the `@DynamicMethod`/`@QueryMethod` decorators, the name-parsing engine, error handling and logging are all working end-to-end, and Prisma 7 support is a released, published adapter. The Drizzle adapter is available in alpha. Official adapters for the remaining ORMs are on the roadmap and will ship as separate `@vsrepo/*-adapter` packages rather than as part of the core `vsrepo` package — but you don't have to wait for that: writing (and optionally publishing) your own adapter in the meantime is a fully supported way to use VSRepository today and to contribute back to the project.

---

## Installation

VSRepository is installed as the core package plus one adapter package for your ORM, for example:

```bash
npm i vsrepo @vsrepo/prisma7-adapter
```

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

> The core API (`VSRepository`, `VSRepoAdapter`, `DynamicMethod`, `QueryMethod`, `VSRepoError`, enums and types) is imported from the single `vsrepo` entry point. The concrete adapter comes from a **separate** package (`@vsrepo/*-adapter`). On Prisma 7, install the [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter).

> **The third generic parameter (`OrmTypes`):** `VSRepository<Entity, PKType, OrmTypes>` accepts an optional third type parameter describing your ORM's client/transaction types, via `VSRepoOrmTypes` (`{ dbClient; dbTransaction }`). Supplying it gives you a correctly-typed `getDbClient()`, `transaction()` callback, and `db` option on every method, instead of `any`:
>
> ```typescript
> import { Prisma7OrmTypes } from "@vsrepo/prisma7-adapter";
> 
> type MyOrmTypes = Prisma7OrmTypes<PrismaClient>;
>
> class UserRepository extends VSRepository<User, string, MyOrmTypes> {
>     // getDbClient() now returns PrismaClient, and transaction(fn) types `tx` as Prisma.TransactionClient
> }
> ```
>
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

## Development

```bash
# 1. Install dependencies
bun install

# 2. Compile the TypeScript sources into dist/ (removes a previous dist/ first)
bun run build

# 3. (Optional) Inspect what would be published without writing a tarball
npm pack --dry-run

# 4. Produce the installable tarball (runs `prepack` -> `bun run build` automatically)
npm pack

# 5. Consume it locally in another project
npm install ../path/to/vsrepo-*.tgz
```

Notes:

- `bun run build` runs `tsc -p tsconfig.build.json`, which outputs the compiled JS and generated type declarations into `dist/` with `rootDir: src`.
- The published package contains **only** the `dist/` folder, the READMEs, `CHANGELOG.md` and `LICENSE` (see `files` in `package.json`). The adapters will live in their own `@vsrepo/*-adapter` packages.

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
- At least one working `VSRepoAdapter` for your database — on Prisma 7, install the published [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) (see [Adapter status](#adapter-status)); official adapters for other ORMs are planned but not published yet, so for now this means writing your own (see [Writing your own adapter](./docs/writing-an-adapter.md#writing-your-own-adapter)) — and if you publish it, contributing it back to the project is welcome

---

## Contributing

Contributions are welcome, especially for improving the Prisma adapter and finishing the Drizzle one! (**[GitHub repository](https://github.com/jaobrabo123/VSRepository)**):

1. **Fork** the project.
2. Create a branch for your change: `git checkout -b my-change`.
3. Push your branch: `git push origin my-change`.
4. Open a **Pull Request**.

To report issues or suggest features, open an **Issue**.
