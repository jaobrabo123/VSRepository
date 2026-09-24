<a id="top"></a>

🇺🇸 English | [🇧🇷 Português](./migrating-from-v1.pt-BR.md)

[← Back to the table of contents](./README.md)

# Migrating from v1

v1 was the original, **Prisma-only** release of VSRepository. v2 — the current version — is a rewrite that made the core **ORM-agnostic**: instead of talking to Prisma directly, every operation is delegated to a pluggable `VSRepoAdapter`, so the same repository API works against Prisma, Drizzle, or any other ORM/database that implements the adapter contract.

The v1 source code and documentation live on the dedicated [`v1` branch](https://github.com/jaobrabo123/VSRepository/tree/v1), for anyone who still needs the previous Prisma-only release.

This page is the single reference for what changed between v1 and v2. If you're migrating an existing v1 repository, the [quick walkthrough](#migrating-a-v1-repository-to-v2) below summarizes the steps; the [full comparison table](#v1-vs-v2-comparison) covers every area in detail.

## v1 vs v2 comparison

| Area | v1 | v2 |
| --- | --- | --- |
| Database access | Talks to **Prisma** directly, bundled in the core package | Talks to a **`VSRepoAdapter`**; ORM support ships as separate packages (`@vsrepo/prisma7-adapter`, `@vsrepo/drizzle-adapter`, ...) instead of being bundled in the core `vsrepo` package |
| Defining a repository | Functional `setupVSRepo<T, M>()({...}).build(prisma)`, **or** a `DynamicRepository` class | A single **class-based** API: `extends VSRepository<Entity, PKType, OrmTypes>` |
| Dynamic methods | `methods: { findByEmail: { map: true } }` config object | `@DynamicMethod()` decorator on a `declare` field |
| Data projections | Named, reusable `selectModels` + `defaultSelectModel` | Ad-hoc `select`/`relations` passed per call (no named models) |
| Eager loading | `include`/`includeModels` (Prisma-specific) | ORM-agnostic `relations` option |
| Global filters | `requiredWhere` and `pushWhere` | **Removed**; only `softRemoveKey` + `see: "active" \| "removed" \| "all"` remain |
| Case-insensitive filter suffix | `Insensitive` | `IgnoreCase` |
| Inline ordering in method name | Not supported (`order` had to be passed as an argument via `Ordered`) | `OrderBy<Field>Asc`/`OrderBy<Field>Desc` chains baked directly into the method name |
| Duplicate handling on `createMany` | `SkipDuplicates` suffix | `IgnoreConflicts` suffix |
| `aggregate` / `groupBy` | Supported (Prisma-native passthrough) | `groupBy` is **not planned** for v2. `aggregate` as a prefix is also unlikely: the most common operations are already covered by dedicated base methods (`sum`, `average`, `min`, `max`, `increment`, `decrement`, `multiply`, `divide`) — see [Atomic and aggregate methods](./base-methods.md#atomic-and-aggregate-methods). For anything more complex, use `@QueryMethod`. |
| Error types | `VSRepoError` + subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`, `VSRepoRuntimeError`) | A base `VSRepoError` class with a `type: VSRepoErrorType` field (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`, `ADAPTER`, `QUERY_BUILDER`), plus a `VSRepoAdapterError` subclass carrying an `AdapterErrorCode` and the original ORM error |
| Debug logging | `showWorking: true` boolean | `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) + `logSlowThresholdMs` for slow-query warnings |
| `vsrepo generate` CLI (type generation step) | Required before use | Not part of the v2 core — types come directly from your entity/ORM types |
| CRUD extras | `patchList`, raw `options.select`/`options.include` | `select`/`relations` are the default (always "raw"); `patch`/`merge` keep the same semantics. **`patchList` was removed** — for a batch partial update, use a `updateManyBy`/`updateManyReturningBy` dynamic method instead |

## Renamed suffixes

Two suffix names changed between v1 and v2 — the feature is identical, only the name differs:

| v1 | v2 | Where it's used |
| --- | --- | --- |
| `Insensitive` | `IgnoreCase` | Case-insensitive combinator for text filters in [dynamic methods](./dynamic-methods.md#field-filters) |
| `SkipDuplicates` | `IgnoreConflicts` | Duplicate handling on `createMany`/`createManyReturning` in [dynamic methods](./dynamic-methods.md#ordering-pagination-and-distinct) |

## Removed features

- **`patchList`** — removed. For a batch partial update, use a `updateManyBy`/`updateManyReturningBy` dynamic method instead.
- **`requiredWhere` / `pushWhere`** — removed. Only `softRemoveKey` + `see` remain.
- **`selectModels` / `defaultSelectModel` (named projections)** — removed. Pass `select`/`relations` per call instead (see [`select` and `relations`](./select-and-relations.md#select-and-relations)).
- **`vsrepo generate` CLI** — no longer part of the core; types come from your entity/ORM types directly.

## Where each concept now lives

| v1 concept | v2 replacement | Current guide |
| --- | --- | --- |
| `setupVSRepo` / `DynamicRepository` | `extends VSRepository<Entity, PKType, OrmTypes>` | [Base methods, configuration & soft-delete](./base-methods.md) |
| `methods: {...}` config | `@DynamicMethod()` decorator | [Dynamic methods](./dynamic-methods.md) |
| `options.select` / `options.include` raw | `select` / `relations` per call | [`select` and `relations`](./select-and-relations.md) |
| `showWorking: true` | `logLevel` + `logSlowThresholdMs` | [Logging](./logging.md) |
| `VSRepoConfigError` + subclasses | `VSRepoError` + `type` field, `VSRepoAdapterError` | [Error handling](./error-handling.md) |
| Prisma `aggregate`/`groupBy` passthrough | Base methods (`sum`, `average`, `min`, `max`, ...) or `@QueryMethod` | [Base methods](./base-methods.md#atomic-and-aggregate-methods), [Query methods](./query-methods.md) |

## Migrating a v1 repository to v2

1. **Install** the core package plus an adapter for your ORM — e.g. `npm i vsrepo @vsrepo/prisma7-adapter`.
2. **Replace** `setupVSRepo<T, M>()({...}).build(prisma)` (or a `DynamicRepository` class) with a class extending `VSRepository<Entity, PKType, OrmTypes>`.
3. **Move** your `methods: {...}` config to `@DynamicMethod()` decorators on `declare`d fields.
4. **Replace** `selectModels`/`defaultSelectModel` (and raw `options.select`/`options.include`) with per-call `select`/`relations`.
5. **Rename** the suffixes: `Insensitive` → `IgnoreCase`, `SkipDuplicates` → `IgnoreConflicts`.
6. **Swap** `showWorking: true` for `logLevel` (and `logSlowThresholdMs` for slow-query warnings).
7. **Update** your error handling to the new `VSRepoError` `type` field and the `VSRepoAdapterError` (see [Error handling](./error-handling.md)).
8. **Drop** the `vsrepo generate` step — types now come from your entity/ORM types directly.
9. **Migrate** `patchList` calls to `updateManyBy`/`updateManyReturningBy` dynamic methods.

> See the [main README](../README.md) for installation, adapter status, and basic usage.