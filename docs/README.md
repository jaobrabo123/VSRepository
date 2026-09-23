# Documentation

🇺🇸 English | [🇧🇷 Português](./README.pt-BR.md)

[← Back to the main README](../README.md)

Detailed, example-heavy guides for each VSRepository feature. For the quickstart, migration notes from v1, and adapter status, see the [main README](../README.md).

| Guide | Covers |
| --- | --- |
| [Base methods, configuration & soft-delete](./base-methods.md) | Constructor options, the 12 automatic CRUD methods, native soft-delete, and the 8 atomic/aggregate methods (`increment`, `sum`, ...). |
| [`select` and `relations`](./select-and-relations.md) | Ad-hoc field selection and eager relation loading on any call, and `InferMethodReturn` to narrow the return type accordingly. |
| [Dynamic methods](./dynamic-methods.md) | `findByEmail`-style methods parsed from a `declare`d method name: prefixes, field filters, logical operators, relation filters, ordering/pagination/distinct. |
| [Query methods (raw SQL)](./query-methods.md) | Raw SQL methods via `@QueryMethod`, bypassing the dynamic-method name parser entirely. |
| [Query builder](./query-builder.md) | The fluent `createQueryBuilder()` API for queries assembled at runtime, including pagination, soft-delete visibility and transactions. |
| [Transactions](./transactions.md) | Running several repositories against the same native ORM transaction. |
| [Utility types](./utility-types.md) | The exported helper types (`InferMethodType`, `InferMethodReturn`, `KeysOfType`, ...) and where each one is used. |
| [Writing your own adapter](./writing-an-adapter.md) | How to implement `VSRepoAdapter` for a new ORM or database, method by method. |
| [Error handling](./error-handling.md) | `VSRepoError`, `VSRepoErrorType`, and `VSRepoAdapterError`/`AdapterErrorCode`. |
| [Logging](./logging.md) | `logLevel`, `logSlowThresholdMs`, and the log format used by the repository and the query builder. |
