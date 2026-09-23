🇺🇸 English | [🇧🇷 Português](./writing-an-adapter.pt-BR.md)

[← Back to the main README](../README.md)

# Writing your own adapter

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
    getPkName?(): string;
}
```

The optional `getPkName()` lets the adapter declare the entity's primary-key field to the repository. When instantiating a `VSRepository`, you can omit `pkName` from the constructor options and it will be read from `adapter.getPkName()`. If you omit it and the adapter doesn't implement `getPkName()`, the constructor throws a `VSRepoError`.

`VSRepository` never talks to the ORM directly — it only calls these methods with an already-resolved `VSRepoWhere<T>` and `AdapterMethodOptions<T>`. Once an adapter implements this contract, every base method, dynamic method, and query method works against it automatically. For a full, working implementation, see the external [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) repo.

## Logging from your adapter

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

| Method                                               | Description                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new VSLogger(logLevel, name, slowThresholdMs?)`     | Creates a logger; `name` prefixes every line. `slowThresholdMs` controls the slow-operation threshold: a `number` sets it in ms (default 300), `false` disables slow-operation warnings entirely, `true` or omitted uses the 300ms default. |
| `logDebug/logInfo/logWarn(text, obj?)`               | Logs at the given level if `logLevel` allows it; `obj` is appended as pretty-printed JSON.                                                                                                                                                  |
| `logError(text, err?)`                               | Logs at `ERROR`; if `err` is an `Error`, only `name`/`message`/`stack`/`cause` are logged.                                                                                                                                                  |
| `startPerformLog(operation)` / `endPerformLog(data)` | Bracket a block to log its duration, escalating to `WARN` if it exceeds `slowThresholdMs`.                                                                                                                                                  |
| `getLogLevel()`                                      | Returns the logger's configured `VSLogLevel`.                                                                                                                                                                                               |

This is purely a convenience for adapter authors — nothing in the core requires your adapter to use it.
