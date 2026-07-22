# DynamicRepository (Class-based approach)

VSRepository offers two ways to create repositories: the functional `setupVSRepo` approach and the OOP `DynamicRepository` class-based approach. This document covers the class-based approach using `DynamicRepository` and the `@DynamicMethod` decorator.

> For the functional approach, see the main [README.md](./README.md).

## Table of contents

- [When to use DynamicRepository](#when-to-use-dynamicrepository)
- [Creating a class](#creating-a-class)
- [The @DynamicMethod decorator](#the-dynamicmethod-decorator)
- [Decorator config options](#decorator-config-options)
- [Base methods](#base-methods)
- [Working with relations](#working-with-relations)
- [Transactions](#transactions)
- [Working with includes](#working-with-includes)
- [DynamicMethodOptions](#dynamicmethodoptions)
- [NestJS integration](#nestjs-integration)
- [API Reference](#api-reference)
- [Differences from setupVSRepo](#differences-from-setupvsrepo)

---

## When to use DynamicRepository

Use `DynamicRepository` when you prefer an **OOP style with decorators** over the functional `setupVSRepo` approach. Key characteristics:

- Methods are defined as `declare` fields with `@DynamicMethod()` decorators
- The repository is a class you can extend and inject via dependency injection
- `selectModels` and `includeModels` are **not supported** (use raw `include` via `DynamicMethodOptions` instead)
- Base methods are always active (no `active` toggle per method)
- The repository is built automatically in the constructor (no explicit `.build()` call)

---

## Creating a class

Extend `DynamicRepository` with four generic parameters:

```typescript
import {
    DynamicRepository,
    DynamicMethod,
    DynamicMethodOptions,
    PaginationModel,
} from "../../generated/vsrepo";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaClient } from "../../generated/prisma/client";

type User = Prisma.UserGetPayload<{
    include: { address: true; posts: true };
}>;

class UserRepository extends DynamicRepository<
    User,        // Entity type (with relations included)
    "User",      // Prisma model name
    string,      // Primary key type
    { address: true; posts: true }  // Which fields are relations (flags)
> {
    constructor(prisma: PrismaClient) {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            relations: {
                address: { mode: "oto", pk: "id", restriction: "set" },
                posts: { mode: "otm", pk: "id", restriction: "add" },
            },
            requiredWhere: { active: true },
            build: {
                showWorking: false,
                baseMethods: {
                    save: { ignoreRequiredWhere: true },
                },
            },
        });
    }
}
```

**Generic parameters:**

| Parameter | Description |
|-----------|-------------|
| `TEntity` | The full entity type, including any relations you want available |
| `UName` | The Prisma model name as a string literal (capitalized, e.g. `"User"`) |
| `VPKType` | The type of the primary key (`string`, `number`, etc.) |
| `WRelations` | An object flags indicating which fields are relations (e.g. `{ address: true }`) |

---

## The @DynamicMethod decorator

Declare dynamic methods as class fields using `declare` and decorate them with `@DynamicMethod()`:

```typescript
class UserRepository extends DynamicRepository<User, "User", string> {
    // Simple dynamic method - name determines behavior
    @DynamicMethod()
    declare findByEmail: (email: string) => Promise<User | null>;

    // With decorator config
    @DynamicMethod<"User">({ proxyTo: "findMany", pushWhere: { active: false } })
    declare findDisabled () => Promise<User[]>;

    // Proxy to another method
    @DynamicMethod<"User">({ proxyTo: "findOneByEmail", whereType: "overwrite" })
    declare findInternalByEmail: (email: string) => Promise<User | null>;
}
```

The method **name** determines the behavior (same rules as the functional approach). The decorator config object adjusts that behavior.

> **Important:** Always use `declare` (not a regular property) for decorated fields. The decorator provides runtime metadata; the `declare` keyword tells TypeScript the property exists without emitting initialization code.

---

## Decorator config options

The `@DynamicMethod<M>()` decorator accepts an optional config object:

```typescript
@DynamicMethod<"User">({
    proxyTo: "findByEmail",           // Delegate to another method pattern
    whereType: "overwrite",           // "extending" (default) or "overwrite"
    pushWhere: { active: false },      // Extra where clause
    injectOrdenation: [{ name: "asc" }],  // Fixed ordering
    injectPagination: { skip: 0, take: 10 },  // Fixed pagination
})
```

| Option | Type | Description |
|--------|------|-------------|
| `proxyTo` | `string` | Delegates to another valid method pattern (e.g. `"findOneByEmail"`) |
| `whereType` | `"extending" \| "overwrite"` | `extending` combines with `requiredWhere`; `overwrite` ignores it |
| `pushWhere` | `WhereModel<M>` | Extra `where` clause added on top of `requiredWhere` |
| `injectOrdenation` | `OrdenationModel<M>` | Fixed ordering injected into the query |
| `injectPagination` | `PaginationModel<M>` | Fixed pagination injected into the query |

---

## Base methods

All `DynamicRepository` instances automatically include these methods:

| Method | Description |
|--------|-------------|
| `get(pk)` | Fetch a record by primary key |
| `getOrThrow(pk)` | Fetch by PK, throws if not found |
| `getList(pks)` | Fetch multiple records by PKs |
| `save(obj)` | Create or upsert a record |
| `saveList(objs)` | Batch save in an automatic transaction |
| `patch(pk, obj)` | Partial update by PK |
| `patchList(tuples)` | Batch partial update via `[pk, obj]` tuples |
| `merge(pk, obj)` | Fetch and deep-merge in memory (does not persist) |
| `remove(pk)` | Delete a record by PK |
| `removeList(pks)` | Batch delete by PKs |
| `getAll()` | Fetch all records (respects `requiredWhere`) |
| `total()` | Count all records |
| `has(pk)` | Check if a record exists |
| `softRemove(pk)` | Soft-delete (requires `softRemovekName` config) |
| `softRemoveList(pks)` | Batch soft-delete |
| `restore(pk)` | Restore soft-deleted record |
| `restoreList(pks)` | Batch restore |

All methods accept `options?: DynamicMethodOptions` with `db`, `see`, and `include`.

---

## Working with relations

Configure relations in the constructor so `save` and `patch` manage them automatically:

```typescript
class UserRepository extends DynamicRepository<
    User, "User", string,
    { address: true; posts: true }
> {
    constructor(prisma: PrismaClient) {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            relations: {
                address: { mode: "oto", pk: "id", restriction: "set" },
                posts: { mode: "otm", pk: "id", restriction: "add" },
            },
        });
    }
}
```

The fourth generic parameter (`WRelations`) must flag which fields are relations. This ensures `DynamicSaveInput` and `DynamicPatchInput` resolve those fields into their nested Prisma create/update payload shapes.

**Relation modes:** `oto` (one-to-one), `otm` (one-to-many), `mto` (many-to-one), `mtm` (many-to-many).

**Restrictions:** `set` (replace all) or `add` (add/update without removing).

See the main [README.md](./README.md#relations-in-save) for full details on relation behavior.

---

## Transactions

All methods accept `{ db: tx }` to participate in a transaction:

```typescript
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.save(
        { name: "Mary", email: "mary@email.com", password: "password" },
        { db: tx }
    );

    await postRepository.save(
        { title: "First Post", authorId: user.id },
        { db: tx }
    );
});
```

Access the Prisma client via `repository.prisma`.

---

## Working with includes

`DynamicRepository` does not support `includeModels` (named presets), but you can use raw Prisma `include` via `DynamicMethodOptions`:

```typescript
// Include address only
const user = await userRepository.get(id, {
    include: { address: true },
});

// Nested include
const userFull = await userRepository.get(id, {
    include: {
        address: true,
        posts: { include: { tags: true } },
    },
});

// Works on any method that accepts options
const all = await userRepository.getAll({
    include: { posts: true },
});
```

---

## DynamicMethodOptions

Every base method and every decorated dynamic method accepts an optional second argument of type `DynamicMethodOptions`. This object has three optional fields:

```typescript
type DynamicMethodOptions<TName extends PrismaModelName> = {
    db?: ClientOrTransaction;          // Prisma client or transaction
    see?: "active" | "removed" | "all"; // Soft-delete visibility
    include?: IncludeModel<TName>;      // Raw Prisma include
};
```

### `db` — Using a transaction

Pass `{ db: tx }` to route a single method call inside an existing transaction:

```typescript
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.save(
        { name: "Mary", email: "mary@email.com", password: "password" },
        { db: tx },
    );

    await postRepository.save(
        { title: "First Post", authorId: user.id },
        { db: tx },
    );
});
```

You can also use the transaction for reads:

```typescript
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.get(id, { db: tx });
    const total = await userRepository.total({ db: tx });
});
```

### `see` — Soft-delete visibility

If `softRemovekName` is configured, the `see` field controls which records are visible:

| Value | Behavior |
|-------|----------|
| `"active"` (default) | Only non-deleted records |
| `"removed"` | Only soft-deleted records |
| `"all"` | Both active and deleted records |

```typescript
// Fetch only soft-deleted users
const deleted = await userRepository.getAll({ see: "removed" });

// Fetch all users including soft-deleted
const all = await userRepository.getAll({ see: "all" });

// Restore a soft-deleted user by fetching it first
const [removed] = await userRepository.getAll({ see: "removed", include: { address: true } });
```

### `include` — Raw Prisma include

Use `include` to eagerly load relations in any method call. This is the equivalent of `includeModels` in the functional approach, but with raw Prisma include syntax:

```typescript
// Simple include
const user = await userRepository.get(id, {
    include: { address: true },
});

// Nested include
const userFull = await userRepository.get(id, {
    include: {
        address: true,
        posts: { include: { author: true } },
    },
});

// Works on dynamic methods too
const admin = await userRepository.findAdminByEmail(email, {
    include: { address: true, posts: true },
});
```

### Combining options

All three fields can be used together:

```typescript
// Inside a transaction, fetch a user with relations, including soft-deleted
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.get(id, {
        db: tx,
        see: "all",
        include: { address: true, posts: true },
    });
});
```

---

## NestJS integration

`DynamicRepository` works naturally with NestJS dependency injection.

### Repository provider

```typescript
// src/modules/user/user.repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { DynamicRepository, DynamicMethod, DynamicMethodOptions } from "../../../generated/vsrepo";

type User = /* Prisma UserGetPayload with relations */;

@Injectable()
class UserRepository extends DynamicRepository<User, "User", string, { profile: true }> {
    constructor(prisma: PrismaService) {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            relations: {
                profile: { mode: "oto", pk: "id", restriction: "add" },
            },
            build: {
                baseMethods: {
                    save: { ignoreRequiredWhere: true },
                },
            },
        });
    }

    @DynamicMethod()
    declare findByEmail: (email: string, options?: DynamicMethodOptions<"User">) => Promise<User | null>;
}

```

### Registering the module

```typescript
// src/modules/user/user.module.ts
import { Module } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
    providers: [UserRepository, UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
```

### Using in a service

```typescript
// src/modules/user/user.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async getUserById(id: string) {
        return this.userRepository.get(id);
    }

    async getUserAuthByEmailWithProfile(email: string) {
        return this.userRepository.findByEmail(email, { include: { profile: true } });
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

---

## API Reference

### `DynamicRepository<TEntity, UName, VPKType, WRelations>`

```typescript
abstract class DynamicRepository<
    TEntity extends object,
    UName extends PrismaModelName,
    VPKType,
    WRelations extends Partial<Record<keyof TEntity, true>> | undefined = undefined,
>
```

**Constructor:**

```typescript
constructor(prisma: DbClient, config: DynamicRepositoryConstructorConfig<TEntity, UName>)
```

### DynamicRepositoryConstructorConfig

| Property | Type | Description |
|----------|------|-------------|
| `tableName` | `Uncapitalize<UName>` | Table name in Prisma |
| `pkName` | `keyof TEntity` | Primary key field |
| `softRemovekName?` | `keyof TEntity` | DateTime field for soft-delete |
| `requiredWhere?` | `WhereModel<UName>` | Global filters |
| `defaultOrdenation?` | `OrdenationModel<UName>` | Default ordering |
| `relations?` | `RepositoryRelations<TEntity>` | Relation configuration |
| `build?` | `DynamicRepositoryBuildConfig` | Build-time options |

### DynamicRepositoryBuildConfig

| Property | Type | Description |
|----------|------|-------------|
| `showWorking?` | `boolean` | Show internal logs (default: `false`) |
| `showQueries?` | `boolean` | Show Prisma queries |
| `baseMethods?` | `Record<string, { ignoreRequiredWhere?: boolean }>` | Per-method config |

### @DynamicMethod<M>(config?)

```typescript
function DynamicMethod<M extends PrismaModelName>(
    config?: DynamicMethodConfig<M>,
): PropertyDecorator;
```

### DynamicMethodOptions<TName>

| Property | Type | Description |
|----------|------|-------------|
| `db?` | `ClientOrTransaction` | Database client or transaction |
| `see?` | `"active" \| "removed" \| "all"` | Soft-delete visibility |
| `include?` | `IncludeModel<TName>` | Raw Prisma include |

---

## Differences from setupVSRepo

| Aspect | `setupVSRepo` | `DynamicRepository` |
|--------|---------------|---------------------|
| **Style** | Functional / curried | OOP / class-based |
| **Methods defined via** | `methods` config object | `@DynamicMethod()` decorators |
| **selectModels** | Supported | Not supported |
| **includeModels** | Supported | Not supported |
| **Default select** | `defaultSelectModel` config | Not available |
| **Build step** | Explicit `.build(prisma)` | Automatic in constructor |
| **Base method toggles** | `active`, `defaultSelect` per method | Always active, no defaultSelect |
| **Prisma instance** | Passed at `.build()` time | Passed to `super()` in constructor |
| **Extensibility** | `.extend()` method | Class inheritance |
| **Raw includes** | Via `options.include` | Via `DynamicMethodOptions.include` |
