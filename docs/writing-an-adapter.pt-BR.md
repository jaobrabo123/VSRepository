<a id="top"></a>

🇧🇷 Português | [🇺🇸 English](./writing-an-adapter.md)

[← Voltar para o Sumário](./README.pt-BR.md)

# Escrevendo seu próprio adapter

Como o núcleo é agnóstico de ORM e é distribuído sem um adapter embutido, adicionar suporte a um ORM/banco — seja como solução provisória para o seu próprio projeto, seja como candidato a um futuro pacote `@vsrepo/*-adapter` — significa implementar a classe abstrata `VSRepoAdapter<T>`:

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

O `getPkName()` opcional permite que o adapter declare ao repository qual campo é a primary key da entidade. Ao instanciar um `VSRepository`, você pode omitir o `pkName` das options do construtor e ele será lido do `adapter.getPkName()`. Se você omitir e o adapter não implementar o `getPkName()`, o construtor lança um `VSRepoError`.

O `VSRepository` nunca fala diretamente com o ORM — ele só chama esses métodos com um `VSRepoWhere<T>` e um `AdapterMethodOptions<T>` já resolvidos. Uma vez que um adapter implemente esse contrato, todo método base, método dinâmico e query method passa a funcionar com ele automaticamente. Pra uma implementação completa e funcional, veja o repositório externo [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter).

## Logging a partir do seu adapter

O `vsrepo` exporta a mesma classe `VSLogger` usada internamente pelo core, então seu adapter pode logar no mesmo formato/estilo (timestamps, labels de nível coloridos, avisos de operação lenta) em vez de implementar o seu próprio:

```typescript
import { VSLogger, VSLogLevel } from "vsrepo";

export class MyOrmAdapter<T> extends VSRepoAdapter<T> {
    private readonly logger = new VSLogger(VSLogLevel.WARN, "MyOrmAdapterLogger");

    async findOne(where: VSRepoWhere<T>, options?: AdapterMethodOptions<T>) {
        const start = this.logger.startPerformLog("adapter findOne");
        try {
            // ... fala com o ORM ...
            this.logger.endPerformLog(start);
            return result;
        } catch (err) {
            this.logger.endPerformLog(start);
            this.logger.logError("adapter findOne falhou", err);
            throw err;
        }
    }
}
```

| Método                                               | Descrição                                                                                                                                                                                                                                                  |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `new VSLogger(logLevel, name, slowThresholdMs?)`     | Cria um logger; `name` prefixa cada linha. `slowThresholdMs` controla o threshold de operação lenta: um `number` define o valor em ms (padrão 300), `false` desabilita os avisos de operação lenta completamente, `true` ou omitido usa o padrão de 300ms. |
| `logDebug/logInfo/logWarn(text, obj?)`               | Loga no nível dado se `logLevel` permitir; `obj` é anexado como JSON formatado.                                                                                                                                                                            |
| `logError(text, err?)`                               | Loga em `ERROR`; se `err` for uma `Error`, só `name`/`message`/`stack`/`cause` são logados.                                                                                                                                                                |
| `startPerformLog(operation)` / `endPerformLog(data)` | Envolve um trecho de código para logar sua duração, escalando pra `WARN` se ultrapassar `slowThresholdMs`.                                                                                                                                                 |
| `getLogLevel()`                                      | Retorna o `VSLogLevel` configurado do logger.                                                                                                                                                                                                              |

Isso é puramente uma conveniência para autores de adapters — nada no core exige que seu adapter o utilize.

[⬆️ Voltar ao topo](#top)