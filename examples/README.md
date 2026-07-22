# VSRepository Examples

This folder contains practical, commented examples of how to use **VSRepository**. The idea here isn't just to show ready-made code, but to teach you the "why" behind each thing through comments in the code itself (`*`, `?`, `!`, and `TODO`).

> 💡 Before touching these examples, it's worth reading the [project's main README](../README.md), which documents VSRepository's full API in detail.

---

## Table of contents

- [Folder structure](#folder-structure)
- [The domain used in the examples](#the-domain-used-in-the-examples)
- [How to read the examples](#how-to-read-the-examples)
- [How to set up the environment](#how-to-set-up-the-environment)
- [How to run the tests](#how-to-run-the-tests)
- [Comment legend](#comment-legend)
- [Suggested reading order](#suggested-reading-order)

---

## Folder structure

```
examples/
├── prisma.ts                       # PrismaClient instance used by the examples
├── repositories.ts                  # Configuration of all repositories (User, Address, Product) — functional "setupVSRepo" approach
├── dynamic-repositories.ts          # Same User/Product domain, but using the class-based "DynamicRepository" approach
└── tests/
    ├── base-methods.test.ts       # Base methods: get, save, patch, remove, getAll, total, has...
    ├── relations.test.ts          # How to configure and use relations in save/patch and in filters
    ├── required-where.test.ts     # How requiredWhere is automatically applied to queries
    ├── dynamic-methods.test.ts    # Prefixes, field filters, logical operators, pagination/ordering and distinct
    ├── transactions.test.ts       # Transactions with options.db and instance access via repository.prisma
    ├── soft-delete.test.ts        # Soft-delete: softRemove, softRemoveList, restore, restoreList and SeeMode
    ├── batch-methods.test.ts      # Batch operations: getList, saveList, patchList and merge
    └── dynamic-repository.test.ts # The class-based "DynamicRepository" approach in practice (@DynamicMethod, include, soft-delete)
```

- **`prisma.ts`** configures the `PrismaClient` instance (with the Postgres adapter) used by all repositories.
- **`repositories.ts`** is the starting point: this is where the `User`, `Address`, and `Product` repositories are configured with `setupVSRepo`, including `selectModels`, `requiredWhere`, `softRemovekName`, `relations`, and the dynamic methods (`methods`). All files in `tests/` import the already-configured repositories from here.
- **`dynamic-repositories.ts`** configures the same `User` and `Product` domain, but with the OOP class-based `DynamicRepository` + `@DynamicMethod` approach — useful for comparing both styles side by side. See [README-DynamicRepo.md](../README-DynamicRepo.md) for the full documentation of this approach.
- **`tests/`** is where the hands-on part happens: each file is an independent, runnable script that demonstrates a specific set of features, with `console.log` at each step so you can see the result of each operation in the terminal.

---

## The domain used in the examples

All the examples revolve around the same Prisma schema (see [`prisma/schema.prisma`](../prisma/schema.prisma)):

- **`User`** → has an address (`Address`, **one-to-one** relation) and several products (`Product`, **one-to-many** relation).
- **`Address`** → belongs to a single `User` (**one-to-one**).
- **`Product`** → belongs to a single `User` (**many-to-one**) and can have several `Tag`s (**many-to-many** relation). The `deletedAt` field enables soft-delete on this model.
- **`Tag`** → can be on multiple products.

Understanding this layout helps a lot when following the `relations.test.ts` examples, since it uses exactly these relations (`oto`, `otm`, `mto`, `mtm`) in practice.

---

## How to read the examples

Each test file is **self-contained**: it creates the data it needs, runs the example operations with `console.log` explaining the expected result, and at the end cleans up what it created in the database (so you can run it again without leaving leftover data).

We strongly recommend opening the files in **VS Code** (or another IDE with TypeScript support) instead of just reading them on GitHub, because:

- Many `TODO` comments ask you to hover over a variable to see the type VSRepository infers automatically — this only works with the TypeScript LSP running.
- You'll get autocomplete on the repository methods, which helps you explore other possibilities beyond what's in the examples.

---

## How to set up the environment

Before running any test, you need a running Postgres database and the project configured:

1. **Clone the repository** (if you haven't already):
   ```
   git clone https://github.com/jaobrabo123/VSRepository.git
   cd VSRepository
   ```

2. **Install the dependencies**:
   ```
   pnpm install
   ```

3. **Configure the environment variable**: copy `.env.example` to `.env` and adjust `DATABASE_URL` to point to your Postgres database:
   ```
   cp .env.example .env
   ```

4. **Run the migrations** to create the tables (`User`, `Address`, `Product`, `Tag`):
   ```
   npx prisma migrate dev
   ```

5. **Generate the Prisma Client and the VSRepository types**:
   ```
   npm run build
   npx prisma generate
   npx vsrepo generate
   ```
   > These two commands generate the `generated/prisma` and `generated/vsrepo` folders, which are imported both in `repositories.ts` and in the test files themselves.

After these steps, the files inside `examples/` should already be free of typing errors in your IDE.

---

## How to run the tests

Each file in `tests/` is run individually with `tsx` (already included in the project's dependencies):

```
npx tsx examples/tests/base-methods.test.ts
npx tsx examples/tests/relations.test.ts
npx tsx examples/tests/required-where.test.ts
npx tsx examples/tests/dynamic-methods.test.ts
npx tsx examples/tests/transactions.test.ts
npx tsx examples/tests/soft-delete.test.ts
npx tsx examples/tests/batch-methods.test.ts
npx tsx examples/tests/dynamic-repository.test.ts
```

Or, if you prefer to use `pnpm`:

```
pnpm tsx examples/tests/base-methods.test.ts
pnpm tsx examples/tests/relations.test.ts
pnpm tsx examples/tests/required-where.test.ts
pnpm tsx examples/tests/dynamic-methods.test.ts
pnpm tsx examples/tests/transactions.test.ts
pnpm tsx examples/tests/soft-delete.test.ts
pnpm tsx examples/tests/batch-methods.test.ts
pnpm tsx examples/tests/dynamic-repository.test.ts
```

> ⚠️ The tests create and remove real data in the database configured in your `DATABASE_URL`. Because of this, it's recommended to run them against a development/test database.

Follow the terminal output: each `console.log` shows the result of a specific operation, usually with a `TODO` comment in the code explaining what to expect from that log.

---

## Comment legend

To make reading easier, the comments in the examples follow a pattern:

| Prefix  | Meaning |
| ------- | ----------- |
| `*`     | Explanation of what's being done in that piece of code |
| `?`     | A question you might be asking yourself, answered right there |
| `!`     | An important warning or detail worth paying attention to (behavior that might be surprising) |
| `TODO`  | A suggested action for you (e.g. hover over a variable, or run a command) |

---

## Suggested reading order

If you're just starting out with VSRepository, this is the recommended order for going through the examples:

1. **[`repositories.ts`](./repositories.ts)** — understand how the repositories are configured (`selectModels`, `requiredWhere`, `softRemovekName`, `relations`, `methods`).
2. **[`tests/base-methods.test.ts`](./tests/base-methods.test.ts)** — see the base methods (`get`, `save`, `patch`, `remove`, `getAll`, `total`, `has`...) in action.
3. **[`tests/relations.test.ts`](./tests/relations.test.ts)** — understand how `save`/`patch` manage relations automatically (`set` vs `add`) and how to use relation filters (`Some`, `None`, `With`, `Without`).
4. **[`tests/required-where.test.ts`](./tests/required-where.test.ts)** — see how `requiredWhere` is automatically injected into queries and how to ignore it when needed (`ignoreRequiredWhere`, `whereType: "overwrite"`).
5. **[`tests/dynamic-methods.test.ts`](./tests/dynamic-methods.test.ts)** — explore the dynamic methods: prefixes, field filters, logical operators (`And`/`Or`), `proxyTo`, pagination/ordering suffixes, and the `Distinct` suffix.
6. **[`tests/transactions.test.ts`](./tests/transactions.test.ts)** — understand how to access the Prisma instance with `repository.prisma`, open a transaction with `$transaction`, and have multiple repositories participate in it via `options.db`, including a rollback example.
7. **[`tests/soft-delete.test.ts`](./tests/soft-delete.test.ts)** — learn how to use soft-delete (`softRemovekName`, `softRemove`, `softRemoveList`, `restore`, `restoreList`) and `SeeMode` to control which records the queries see (`"active"`, `"removed"`, `"all"`).
8. **[`tests/batch-methods.test.ts`](./tests/batch-methods.test.ts)** — explore the batch operations: `getList` (fetch by a list of PKs), `saveList` (creates several in an automatic transaction), `patchList` (updates several via tuples in an automatic transaction), and `merge` (fetch + deep merge in memory).
9. **[`dynamic-repositories.ts`](./dynamic-repositories.ts)** and **[`tests/dynamic-repository.test.ts`](./tests/dynamic-repository.test.ts)** — once you're comfortable with the functional approach, see the same `User`/`Product` domain rebuilt with the OOP class-based `DynamicRepository` + `@DynamicMethod` decorator, including `include`, soft-delete, and transactions. See [README-DynamicRepo.md](../README-DynamicRepo.md) for the full write-up of this approach.

After going through these files, you'll have seen practically everything documented in the [main README](../README.md) and in [README-DynamicRepo.md](../README-DynamicRepo.md) in practice. From there, the best way to learn is to edit the examples yourself: swap out fields, create new dynamic methods, and watch the autocomplete and typing react in real time.

---

Found something that could be clearer in the examples? Open an [issue](https://github.com/jaobrabo123/VSRepository/issues) or contribute directly with a Pull Request 😁
