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

🇧🇷 Você está lendo a versão em português. [🇺🇸 Read in English](./README.md)

> ✅ **Lançado.** O VSRepository v2.0.0 (o core agnóstico de ORM) e o [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) já foram publicados e estão prontos para uso. O Prisma 7 é o primeiro adapter totalmente suportado; outros ORMs (TypeORM, Drizzle, etc.) ainda estão em desenvolvimento — veja [Status dos adapters](#status-dos-adapters). Se você precisa da versão anterior, somente Prisma, use o código/docs da [`v1`](https://github.com/jaobrabo123/VSRepository/tree/v1).

Biblioteca de repository pattern **agnóstica de ORM**, com suporte completo a **TypeScript** e **type inference** automático. O VSRepository v2 é uma reescrita da biblioteca [v1](https://github.com/jaobrabo123/VSRepository/tree/v1): em vez de falar diretamente com o Prisma, o núcleo agora delega toda operação a um **adapter** plugável, permitindo que a mesma API de repository funcione com Prisma, TypeORM ou qualquer outro ORM/banco que implemente o contrato de adapter.

O VSRepository permite criar repositories fortemente tipados com:

- **Métodos base** automáticos: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `merge`, `getAll`, `total`, `has`
- **Soft-delete nativo**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Métodos dinâmicos** inferidos a partir do nome de um campo `declare` via o decorador `@DynamicMethod`: `findByEmail`, `findManyByStatusPaginated`, `updateById`
- **Métodos de query SQL raw** através do novo decorador `@QueryMethod`, ignorando totalmente o engine de parsing por nome
- **`select`/`relations`** ad-hoc em cada chamada — sem mais projeções nomeadas pré-declaradas
- **Type safety** em 100% das operações
- **Transações** nativas do ORM, compartilhadas entre repositories
- Um **núcleo agnóstico de ORM** — a mesma classe de repository funciona com qualquer implementação de `VSRepoAdapter`

---

## Sumário

- [O que mudou da v1](#o-que-mudou-da-v1)
- [Status dos adapters](#status-dos-adapters)
- [Instalação](#instalação)
- [Uso básico](#uso-básico)
- [Options do construtor](#options-do-construtor)
- [Métodos base](#métodos-base)
- [Soft-delete](#soft-delete)
- [`select` e `relations`](#select-e-relations)
- [Métodos dinâmicos](#métodos-dinâmicos)
    - [Prefixos disponíveis](#prefixos-disponíveis)
    - [Filtros de campo](#filtros-de-campo)
    - [Operadores lógicos](#operadores-lógicos)
    - [Filtros de relação](#filtros-de-relação)
    - [Ordenação, paginação e distinct](#ordenação-paginação-e-distinct)
    - [Options do decorador](#options-do-decorador)
- [Query methods (SQL raw)](#query-methods-sql-raw)
    - [Queries raw pontuais com `query()`](#queries-raw-pontuais-com-query)
- [Transações](#transações)
- [Tipos utilitários](#tipos-utilitários)
- [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)
- [Tratamento de erros](#tratamento-de-erros)
    - [`VSRepoAdapterError` e `AdapterErrorCode`](#vsrepoadaptererror-e-adaptererrorcode)
- [Logging](#logging)
- [Desenvolvimento](#desenvolvimento)
- [Requisitos](#requisitos)
- [Contribuindo](#contribuindo)

---

## O que mudou da v1

Se você vem do código/docs da [v1](https://github.com/jaobrabo123/VSRepository/tree/v1), aqui está o resumo. Veja cada seção linkada para detalhes.

| Área                                              | v1                                                                                                              | v2                                                                                                                                                                                                                                             |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso ao banco                                   | Fala diretamente com o **Prisma**, embutido no pacote core                                                      | Fala com um **`VSRepoAdapter`**; o suporte a cada ORM é distribuído em pacotes separados (`@vsrepo/prisma7-adapter`, `@vsrepo/typeorm-adapter`, ...) em vez de vir embutido no pacote core `vsrepo`                                            |
| Definindo um repository                           | `setupVSRepo<T, M>()({...}).build(prisma)` funcional, **ou** uma classe `DynamicRepository`                     | Uma única API **baseada em classes**: `extends VSRepository<Entity, PKType, OrmTypes>`                                                                                                                                                         |
| Métodos dinâmicos                                 | Objeto de config `methods: { findByEmail: { map: true } }`                                                      | Decorador `@DynamicMethod()` em um campo `declare`                                                                                                                                                                                             |
| Projeções de dados                                | `selectModels` + `defaultSelectModel` nomeados e reutilizáveis                                                  | `select`/`relations` ad-hoc passados em cada chamada (sem modelos nomeados)                                                                                                                                                                    |
| Eager loading                                     | `include`/`includeModels` (específico do Prisma)                                                                | Option `relations` agnóstica de ORM                                                                                                                                                                                                            |
| Filtros globais                                   | `requiredWhere` (qualquer filtro arbitrário, sempre aplicado)                                                   | **Removido**; Agora aceita apenas `softRemoveKey` + `see: "active" \| "removed" \| "all"`                                                                                                                                                      |
| Sufixo de filtro case-insensitive                 | `Insensitive`                                                                                                   | `IgnoreCase`                                                                                                                                                                                                                                   |
| Ordenação inline no nome do método                | Não suportado (`order` tinha que ser passado como argumento via `Ordered`/`Paginated`)                          | Cadeias `OrderBy<Campo>Asc`/`OrderBy<Campo>Desc` embutidas diretamente no nome do método                                                                                                                                                       |
| Tratamento de duplicatas no `createMany`          | Sufixo `SkipDuplicates`                                                                                         | Sufixo `IgnoreConflicts`                                                                                                                                                                                                                       |
| `aggregate` / `groupBy`                           | Suportado (passthrough nativo do Prisma)                                                                        | **Ainda não implementado**                                                                                                                                                                                                                     |
| Tipos de erro                                     | `VSRepoError` + subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`, `VSRepoRuntimeError`) | Uma classe base `VSRepoError` com um campo `type: VSRepoErrorType` (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`, `ADAPTER`), além de uma subclasse `VSRepoAdapterError` que carrega um `AdapterErrorCode` e o erro original do ORM |
| Log de debug                                      | Boolean `showWorking: true`                                                                                     | `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) + `logSlowThresholdMs` para avisos de queries lentas                                                                                                                                    |
| CLI `vsrepo generate` (etapa de geração de tipos) | Obrigatória antes de usar                                                                                       | Não faz parte do núcleo da v2 — os tipos vêm diretamente das suas entidades/tipos do ORM                                                                                                                                                       |
| Extras de CRUD                                    | `patchList`, `options.select`/`options.include` raw                                                             | `select`/`relations` já são o padrão (sempre "raw"); `patch`/`merge` mantêm a mesma semântica. **`patchList` foi removido** — para uma atualização parcial em lote, use um dynamic method `updateManyBy`/`updateManyWhere`                    |

---

## Status dos adapters

O VSRepository v2 é **agnóstico de ORM por design**. O pacote core (`vsrepo`) traz apenas a classe de repository, os decoradores, o engine de parsing de nomes, o tratamento de erros e o logging — ele **não** inclui um adapter de produção. O suporte de fato a cada ORM/banco deve viver em **pacotes separados, versionados de forma independente**, um por ORM (e, quando fizer sentido, um por versão principal do ORM), por exemplo:

- `@vsrepo/prisma7-adapter`
- `@vsrepo/prisma8-adapter`
- `@vsrepo/typeorm-adapter`
- `@vsrepo/drizzle-adapter`

O adapter do Prisma 7 já foi publicado no npm como `@vsrepo/prisma7-adapter` — por enquanto é o **único** adapter publicado. Os adapters para os outros ORMs listados acima (Prisma 8, TypeORM, Drizzle) estão **planejados**; eles só ainda não foram publicados. Até que exista um pacote `@vsrepo/*-adapter` oficial para o seu ORM, você pode escrever o seu próprio para o seu projeto e, se quiser, publicá-lo e abrir um PR para ajudar a fazer o ecossistema crescer — contribuições nesse sentido são muito bem-vindas.

| Adapter                                                                                  | Status                                                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma 7 (`@vsrepo/prisma7-adapter`)                                                     | 🟢 **Lançado** — publicado no npm, implementa todo o contrato de `VSRepoAdapter` (CRUD, relations, transactions, `merge`, logging) com testes; veja o [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) para o código-fonte e docs. |
| TypeORM (`@vsrepo/typeorm-adapter`)                                                      | 🟡 **Planejado, ainda não publicado.** Só foi escrito um parser de referência da cláusula `where` (`parseVSRepoWhere`) para validar o design; é o ponto de partida planejado do futuro pacote `@vsrepo/typeorm-adapter`. Contribuições da comunidade nessa frente são bem-vindas. |
| Outros ORMs (Prisma 8, Drizzle, etc.)                                                    | 🟡 **Planejados, ainda não publicados.** Nenhum pacote oficial existe ainda — por enquanto, escreva o seu próprio adapter (veja [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)) e considere publicá-lo/contribuir de volta com o projeto. |
| Adapters customizados                                                                    | 🟢 Totalmente suportados hoje — implemente você mesmo a classe abstrata [`VSRepoAdapter`](#escrevendo-seu-próprio-adapter) para qualquer ORM/banco que precisar, no seu próprio projeto ou pacote, seguindo o mesmo formato esperado dos `@vsrepo/*-adapter`. |

Resumindo: a classe de repository, os decoradores `@DynamicMethod`/`@QueryMethod`, o engine de parsing de nomes, o tratamento de erros e o logging já funcionam de ponta a ponta, e o suporte ao Prisma 7 agora é um adapter lançado e publicado. Adapters oficiais para os demais ORMs estão no roadmap e serão distribuídos como pacotes `@vsrepo/*-adapter` separados, e não como parte do pacote core `vsrepo` — mas você não precisa esperar por isso: escrever (e opcionalmente publicar) o seu próprio adapter enquanto isso é uma forma totalmente suportada de usar a v2 hoje e de contribuir de volta com o projeto.

---

## Instalação

A v2 é instalada como o pacote core mais um pacote de adapter para o seu ORM, por exemplo:

```bash
npm i vsrepo @vsrepo/prisma7-adapter
```

> O `vsrepo` v2.0.0 e o `@vsrepo/prisma7-adapter` já foram publicados no npm e estão prontos para uso. Para qualquer ORM além do Prisma 7, ainda não existe um pacote de adapter — instale o core e escreva o seu próprio (veja [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)).

---

## Uso básico

### Implementando/escolhendo um adapter

```typescript
// src/configs/db.ts
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### Criando um repository

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

> A API do core (`VSRepository`, `VSRepoAdapter`, `DynamicMethod`, `QueryMethod`, `VSRepoError`, enums e tipos) é importada do entry point único `vsrepo`. O adapter concreto vem de um pacote **separado** (`@vsrepo/*-adapter`). No Prisma 7, instale o [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) já publicado (o construtor dele recebe um objeto de config — `tableName`, `pkName`, `relations`/`logLevel` opcionais — como no exemplo acima). Adapters oficiais para outros ORMs estão planejados, mas ainda não publicados; até lá, você pode implementar o contrato `VSRepoAdapter` você mesmo (veja [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)) — e publicá-lo para ajudar o projeto é muito bem-vindo.

> **O terceiro generic (`OrmTypes`):** `VSRepository<Entity, PKType, OrmTypes>` aceita um terceiro type parameter opcional descrevendo os tipos de client/transaction do seu ORM, via `VSRepoOrmTypes` (`{ dbClient; dbTransaction }`). Ao fornecê-lo, `getDbClient()`, o callback de `transaction()` e a option `db` de todo método passam a ser tipados corretamente, em vez de `any`:
> ```typescript
> type PrismaOrmTypes = { dbClient: PrismaClient; dbTransaction: Prisma.TransactionClient };
>
> class UserRepository extends VSRepository<User, string, PrismaOrmTypes> {
>     // getDbClient() agora retorna PrismaClient, e transaction(fn) tipa `tx` como Prisma.TransactionClient
> }
> ```
> Se omitido, o padrão é `VSRepoOrmTypes` (`dbClient`/`dbTransaction` como `any`).

### Usando o repository

```typescript
import userRepository from "./repositories/user.repository";

const usuario = await userRepository.save({
    name: "Joao",
    email: "joao@email.com",
    password: "password",
});

const encontrado = await userRepository.get(usuario.id);
const todos = await userRepository.getAll();
const porEmail = await userRepository.findByEmail("joao@email.com");

await userRepository.patch(usuario.id, { name: "Joao Pedro" });
await userRepository.remove(usuario.id);
```

---

## Options do construtor

`VSRepoOptions<T, K>`, passado para o `super(...)` dentro do construtor do seu repository:

| Option               | Tipo               | Descrição                                                                                                                                   |
| -------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `adapter`            | `VSRepoAdapter<T>` | **Obrigatório.** A instância do adapter que traduz as chamadas do repository em chamadas contra o ORM/banco por trás dele.                  |
| `pkName`             | `keyof T`          | **Obrigatório.** Nome do campo que representa a primary key da entidade.                                                                    |
| `softRemoveKey`      | `keyof T`          | Opcional. Quando definido, habilita `softRemove`, `softRemoveList`, `restore` e `restoreList`.                                              |
| `defaultOrdering`    | `Ordering<T>`      | Opcional. Ordenação padrão aplicada automaticamente em queries que aceitam `order`, a menos que seja sobrescrita em uma chamada específica. |
| `logLevel`           | `VSLogLevel`       | Opcional. Severidade mínima impressa pelo logger interno. Padrão: `VSLogLevel.WARN`.                                                        |
| `logSlowThresholdMs` | `number`           | Opcional. Duração (ms) acima da qual uma operação concluída é logada como `WARN` em vez de `DEBUG`. Padrão: 300ms.                          |

---

## Métodos base

Disponíveis automaticamente em toda subclasse de `VSRepository`:

| Método                      | Descrição                                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `get(pk, options?)`         | Busca um registro pela primary key.                                                                                                   |
| `getOrThrow(pk, options?)`  | Busca um registro pela primary key, lançando erro se não encontrar.                                                                   |
| `getList(pks, options?)`    | Busca vários registros por uma lista de primary keys.                                                                                 |
| `getAll(options?)`          | Busca todos os registros; aceita `pagination` e `order` em `options`.                                                                 |
| `save(obj, options?)`       | Cria ou atualiza (upsert) um único registro.                                                                                          |
| `saveList(objs, options?)`  | Cria ou atualiza (upsert) vários registros em uma única chamada.                                                                      |
| `patch(pk, obj, options?)`  | Atualiza parcialmente um registro pela primary key.                                                                                   |
| `merge(pk, obj, options?)`  | Busca um registro e o retorna mesclado (deep-merge), em memória, com o objeto informado — **não** persiste nada.                      |
| `remove(pk, options?)`      | Remove um registro pela primary key.                                                                                                  |
| `removeList(pks, options?)` | Remove vários registros pela primary key, retornando `{ count }`.                                                                     |
| `total(options?)`           | Retorna o total de registros.                                                                                                         |
| `has(pk, options?)`         | Verifica se um registro existe, retornando `boolean`.                                                                                 |
| `transaction(fn, options?)` | Executa `fn` dentro de uma transação nativa do ORM.                                                                                   |
| `getDbClient()`             | Retorna a instância do client do ORM usada fora de transações.                                                                        |
| `query<T>(query, options?)` | Executa uma instrução SQL raw diretamente contra o banco. Veja [Queries raw pontuais com `query()`](#queries-raw-pontuais-com-query). |

Todos os métodos acima (exceto `transaction`, `query` e `getDbClient`, que recebem options proprias ou nenhuma) aceitam um objeto `MethodOptions<Entity, OrmTypes>` como último argumento (`select`, `relations`, `see`, `db`).

---

## Soft-delete

O soft-delete agora é um **conceito nativo de primeira classe**. Configure `softRemoveKey` uma vez no repository:

```typescript
super({
    pkName: "id",
    adapter,
    softRemoveKey: "deletedAt",
});
```

Isso libera quatro métodos extras:

| Método                          | Efeito                                  |
| ------------------------------- | --------------------------------------- |
| `softRemove(pk, options?)`      | Define `deletedAt` para a data atual.   |
| `softRemoveList(pks, options?)` | O mesmo, em lote — retorna `{ count }`. |
| `restore(pk, options?)`         | Volta `deletedAt` para `null`.          |
| `restoreList(pks, options?)`    | O mesmo, em lote — retorna `{ count }`. |

Todo o restante dos métodos aceita uma option `see` que controla a visibilidade de registros com soft-delete:

```typescript
await userRepository.getAll({ see: "active" }); // padrão — apenas registros não removidos
await userRepository.getAll({ see: "removed" }); // apenas registros com soft-delete
await userRepository.getAll({ see: "all" }); // todos, ignorando o soft-delete
```

---

## `select` e `relations`

Os `selectModels`/`defaultSelectModel` nomeados e reutilizáveis da v1 não existem mais. Na v2 você passa `select` e `relations` diretamente em cada chamada — não há nada para pré-registrar:

```typescript
const usuario = await userRepository.get(id, {
    select: { id: true, name: true, address: { city: true } },
});

const usuarioComEndereco = await userRepository.get(id, {
    relations: { address: true },
});
```

- `select` espelha o formato da entidade: campos escalares recebem um `boolean`; campos de relação recebem um `boolean` ou um `select` aninhado.
- `relations` carrega registros relacionados; cada campo de relação recebe um `boolean` ou um objeto `relations` aninhado.
- Se `select` e `relations` podem ser combinados depende do adapter (veja abaixo).

> ⚠️ **Comportamento de `relations` depende do adapter:**
>
> O core apenas repassa `MethodOptions.select` e `MethodOptions.relations` ao adapter — cada adapter decide como traduzi-los para o ORM subjacente:
>
> - **TypeORM (`@vsrepo/typeorm-adapter`)** — `relations` é **obrigatório** para carregar qualquer relação, mesmo quando você quer apenas uma projeção aninhada via `select`. O TypeORM não fará JOIN/carregar a relação a menos que ela esteja listada em `relations`:
>     ```typescript
>     // TypeORM: apenas select NÃO é suficiente
>     await userRepository.get(id, {
>         select: { id: true, address: { city: true } },
>         relations: { address: true }, // ← obrigatório no TypeORM
>     });
>     ```
> - **Prisma 7 (`@vsrepo/prisma7-adapter` / `VSRepoPrisma7Adapter`)** — `relations` é convertido para `include` do Prisma (`parsePrismaInclude`). **Se `select` estiver presente, `relations` é ignorado** porque o Prisma não permite `select` + `include` na mesma query:
>     ```typescript
>     // Prisma7: relations é ignorado quando select existe
>     await userRepository.get(id, {
>         select: { id: true, name: true },
>         relations: { address: true }, // ← ignorado, include = undefined
>     });
>     ```
>
> Adapters customizados podem mapear `relations` de forma diferente — consulte a documentação do adapter para a semântica exata.

---

## Métodos dinâmicos

Métodos dinâmicos são declarados como um campo `declare` anotado com `@DynamicMethod()`. O comportamento deles — qual método do adapter chamar, quais filtros aplicar e como os argumentos se mapeiam para eles — é inferido inteiramente a partir do **nome** do campo, seguindo a mesma filosofia de convenção sobre configuração da v1.

```typescript
class UserRepository extends VSRepository<User, string> {
    @DynamicMethod()
    declare findByEmail: (email: string) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmail: (email: string) => Promise<User | null>;

    @DynamicMethod()
    declare updateById: (id: string, data: DeepPartial<User>) => Promise<User>;

    // Baseado em where: VSRepoWhere<T> como primeiro parâmetro, pagination penúltimo, MethodOptions por último
    @DynamicMethod()
    declare findWherePaginated: (
        where: VSRepoWhere<User>,
        pagination: Pagination,
        options?: MethodOptions<User>,
    ) => Promise<User[]>;

    // OrderedAndPaginated: filtros de campo, depois order, depois pagination, depois MethodOptions
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

### Prefixos disponíveis

| Prefixo                    | Método do adapter     | Observações                                                                                          |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `findBy`                   | `findMany`            | Filtros de campo seguem o prefixo.                                                                   |
| `findOneBy`                | `findOne`             | Filtros de campo seguem o prefixo; resultado único.                                                  |
| `findOneOrThrowBy`         | `findOneOrThrow`      | Lança erro se não encontrar.                                                                         |
| `findOneOrThrow`           | `findOneOrThrow`      | Sem filtros de campo; aplica só soft-delete/`see`.                                                   |
| `findOneOrThrowWhere`      | `findOneOrThrow`      | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `findWhere`                | `findMany`            | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `findOneWhere`             | `findOne`             | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `findOne`                  | `findOne`             | Sem filtros de campo; aplica só soft-delete/`see`.                                                   |
| `countBy`                  | `count`               | Filtros de campo seguem o prefixo.                                                                   |
| `countWhere`               | `count`               | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `count`                    | `count`               | Sem filtros de campo.                                                                                |
| `existsBy`                 | `exists`              | Retorna `boolean`.                                                                                   |
| `existsWhere`              | `exists`              | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `create`                   | `create`              | Recebe `data` como argumento.                                                                        |
| `createMany`               | `createMany`          | Recebe `data[]` como argumento; suporta `IgnoreConflicts`.                                           |
| `createManyReturning`      | `createManyReturning` | Recebe `data[]` como argumento; suporta `IgnoreConflicts`; retorna os registros criados (`T[]`), em vez de `CountResult`. |
| `updateBy`                 | `update`              | Filtros de campo + `data` como argumento.                                                            |
| `updateWhere`              | `update`              | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois `data`.                                   |
| `updateManyBy`             | `updateMany`          | Filtros de campo + `data`.                                                                           |
| `updateManyWhere`          | `updateMany`          | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois `data`.                                   |
| `updateManyReturningBy`    | `updateManyReturning` | Filtros de campo + `data`; retorna os registros atualizados.                                         |
| `updateManyReturningWhere` | `updateManyReturning` | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois `data`; retorna os registros atualizados. |
| `upsertBy`                 | `upsert`              | Filtros de campo + payloads `create`/`update`.                                                       |
| `upsertWhere`              | `upsert`              | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois os payloads `create`/`update`.            |
| `deleteBy`                 | `delete`              | Filtros de campo seguem o prefixo.                                                                   |
| `deleteWhere`              | `delete`              | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `deleteManyBy`             | `deleteMany`          | Filtros de campo seguem o prefixo.                                                                   |
| `deleteManyWhere`          | `deleteMany`          | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                  |
| `deleteManyReturningBy`    | `deleteManyReturning` | Filtros de campo seguem o prefixo; retorna os registros removidos.                                   |
| `deleteManyReturningWhere` | `deleteManyReturning` | Recebe um `VSRepoWhere<T>` como primeiro argumento; retorna os registros removidos.                  |

> `aggregate` e `groupBy` **ainda não estão implementados** na v2 (existiam na v1). Está planejado, mas não disponível no momento.

### Filtros de campo

Aplicados como sufixos ao nome do campo dentro do método (mesma ideia da v1, com um sufixo renomeado):

| Sufixo             | Significado                                                                                                                                                | Argumento                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| _(sem sufixo)_     | igualdade (`=`)                                                                                                                                            | sim                                      |
| `Not`              | negação                                                                                                                                                    | sim                                      |
| `In`               | está em                                                                                                                                                    | sim (array)                              |
| `NotIn`            | não está em                                                                                                                                                | sim (array)                              |
| `Contains`         | contém substring                                                                                                                                           | sim                                      |
| `NotContains`      | não contém substring                                                                                                                                       | sim                                      |
| `StartsWith`       | começa com                                                                                                                                                 | sim                                      |
| `NotStartsWith`    | não começa com                                                                                                                                             | sim                                      |
| `EndsWith`         | termina com                                                                                                                                                | sim                                      |
| `NotEndsWith`      | não termina com                                                                                                                                            | sim                                      |
| `GreaterThan`      | `>`                                                                                                                                                        | sim                                      |
| `GreaterThanEqual` | `>=`                                                                                                                                                       | sim                                      |
| `LessThan`         | `<`                                                                                                                                                        | sim                                      |
| `LessThanEqual`    | `<=`                                                                                                                                                       | sim                                      |
| `Between`          | intervalo inclusivo                                                                                                                                        | sim (tupla `[min, max]`)                 |
| `NotBetween`       | fora de um intervalo inclusivo                                                                                                                             | sim (tupla `[min, max]`)                 |
| `IsNull`           | campo é `null`                                                                                                                                             | não                                      |
| `IsNotNull`        | campo não é `null`                                                                                                                                         | não                                      |
| `IsTrue`           | campo é `true`                                                                                                                                             | não                                      |
| `IsFalse`          | campo é `false`                                                                                                                                            | não                                      |
| `IgnoreCase`       | combinador case-insensitive para filtros de texto                                                                                                          | não _(renomeado do `Insensitive` da v1)_ |
| `Optional`         | **explícita** o argumento do campo como opcional — ele já é opcional por padrão, então esse sufixo é facultativo e serve apenas para deixar isso explícito | —                                        |

```typescript
@DynamicMethod()
declare findByNameContainsIgnoreCase: (name: string) => Promise<User[]>;

@DynamicMethod()
declare findByAgeBetween: (age: [number, number]) => Promise<User[]>;
```

### Operadores lógicos

| Operador | Uso no nome                    | Exemplo                                             |
| -------- | ------------------------------ | --------------------------------------------------- |
| `And`    | entre dois campos              | `findOneByIdAndEmail`                               |
| `Or`     | entre dois campos              | `findByNameOrEmail`                                 |
| `AND`    | separa um bloco final em `AND` | `findByEmailOrNameANDActiveStatusAndAgeGreaterThan` |

Regras do `AND` (em capslock), iguais às da v1: só é permitido **um** `AND` por nome de método; todo campo conectado por `And` depois dele é aninhado dentro de `AND: []`; `Or` não pode aparecer depois de um `AND`.

### Filtros de relação

Filtram por campos de entidades relacionadas. Internamente, mapeiam para os operadores `_some`/`_every`/`_none`/`_with`/`_without` de `VSRepoWhere` (veja [`select` e `relations`](#select-e-relations) para o equivalente de eager loading).

| Sufixo         | Significado                                       | Restrição                                                               |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `Some`         | pelo menos um registro relacionado corresponde    | apenas relações to-many                                                 |
| `SomeField`    | filtra dentro dos registros relacionados          | apenas relações to-many                                                 |
| `Every`        | todo registro relacionado corresponde             | apenas relações to-many (precisa de `Field` para ser um filtro efetivo) |
| `EveryField`   | filtra dentro dos registros relacionados          | apenas relações to-many                                                 |
| `None`         | nenhum registro relacionado corresponde           | apenas relações to-many                                                 |
| `NoneField`    | filtra dentro dos registros relacionados          | apenas relações to-many                                                 |
| `With`         | o registro relacionado existe                     | apenas relações to-one                                                  |
| `WithField`    | filtra um campo dentro do registro relacionado    | apenas relações to-one                                                  |
| `Without`      | o registro relacionado não existe                 | apenas relações to-one                                                  |
| `WithoutField` | filtro negado em um campo do registro relacionado | apenas relações to-one                                                  |

```typescript
@DynamicMethod()
declare findByAddressWithCityStartsWithIgnoreCase: (city: string) => Promise<User[]>;

@DynamicMethod()
declare findByProductsSome: () => Promise<User[]>;
```

### Ordenação, paginação e distinct

| Sufixo                                     | Efeito                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Paginated`                                | Injeta um argumento `pagination` (`{ limit?, offset? }`) como **penúltimo** parâmetro (antes do `MethodOptions` opcional).                                                     |
| `Ordered`                                  | Injeta um argumento `order: Ordering<T>` como **penúltimo** parâmetro (antes do `MethodOptions` opcional).                                                                     |
| `OrderedAndPaginated`                      | Injeta `order` como antepenúltimo, depois `pagination` como penúltimo — ambos antes do `MethodOptions`.                                                                        |
| `PaginatedAndOrdered`                      | Injeta `pagination` como antepenúltimo, depois `order` como penúltimo — ambos antes do `MethodOptions`.                                                                        |
| `OrderBy<Campo>Asc` / `OrderBy<Campo>Desc` | **Novo na v2.** Embute uma ordenação fixa diretamente no nome do método — encadeie campos com `And` (ex.: `OrderByCreatedAtAscAndNameDesc`). Não precisa de argumento `order`. |
| `Distinct<Campo>And<Campo>...`             | Embute campos `distinct` fixos diretamente no nome do método (só válido em métodos da família `findBy`/`findWhere`).                                                           |
| `IgnoreConflicts`                          | No `createMany`/`createManyReturning`, ignora registros que violariam uma constraint única, em vez de lançar erro. _(Renomeado do `SkipDuplicates` da v1.)_                    |

> ⚠️ **Ordem dos parâmetros:** `pagination` e `order` sempre vêm **antes** do último argumento opcional `MethodOptions<T>`. Quando `order` e `pagination` estão presentes juntos, a ordem relativa entre eles segue o nome do sufixo (`OrderedAndPaginated` → order, pagination; `PaginatedAndOrdered` → pagination, order).

```typescript
// Paginated: pagination é o penúltimo parâmetro (antes do MethodOptions)
@DynamicMethod()
declare findByActiveOrderByCreatedAtDescPaginated:
    (active: boolean, pagination: Pagination, options?: MethodOptions<User>) => Promise<User[]>;

// OrderedAndPaginated: order, depois pagination, depois MethodOptions
@DynamicMethod()
declare findByNameContainsIgnoreCaseOrderedAndPaginated:
    (name: string, order: Ordering<User>, pagination: Pagination, options?: MethodOptions<User>) => Promise<User[]>;

@DynamicMethod()
declare createManyIgnoreConflicts: (data: DeepPartial<User>[]) => Promise<{ count: number }>;

// createManyReturning: mesmo comportamento do createMany, mas retorna os registros criados
@DynamicMethod()
declare createManyReturningIgnoreConflicts: (data: DeepPartial<User>[]) => Promise<User[]>;

// findOne sem filtro (equivalente ao findOneOrThrow sem filtro, mas retorna null em vez de lançar)
@DynamicMethod()
declare findOne: (options?: MethodOptions<User>) => Promise<User | null>;
```

> ⚠️ **Precedência entre `Distinct` e `OrderBy`:** quando os dois são usados no mesmo nome de método, **`Distinct` deve vir antes de `OrderBy`**:
>
> ```typescript
> @DynamicMethod()
> declare findByActiveDistinctNameOrderByCreatedAtDesc:
>     (active: boolean) => Promise<User[]>;
> ```
>
> Colocar `OrderBy` antes de `Distinct` (ex.: `findByActiveOrderByCreatedAtDescDistinctName`) não é um padrão válido e não será interpretado como esperado.

### Options do decorador

`@DynamicMethod<T>(options?)` aceita:

| Option           | Tipo          | Descrição                                                                                                                                |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `proxyTo`        | `string`      | Redireciona a lógica do método para outro padrão de método dinâmico válido — útil para nomes que não seguem a convenção de nomenclatura. |
| `injectOrdering` | `Ordering<T>` | Ordenação fixa injetada automaticamente, sobrescrevendo o `defaultOrdering` do repository.                                               |

```typescript
@DynamicMethod<User>({ injectOrdering: { createdAt: "desc" } })
declare findByStatus: (status: string) => Promise<User[]>;
```

---

## Query methods (SQL raw)

`@QueryMethod` ignora totalmente o engine de parsing por nome e executa uma instrução SQL raw através do método `query()` do adapter. Use placeholders `$1`, `$2`, ... — nunca interpole valores diretamente na string SQL.

```typescript
class UserRepository extends VSRepository<User, string> {
    @QueryMethod('SELECT * FROM "user" WHERE email = $1')
    declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;

    @QueryMethod('UPDATE "user" SET active = true WHERE id = $1', { modifying: true })
    declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;
}
```

| Option      | Tipo      | Padrão  | Descrição                                                                                                                                                                                             |
| ----------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modifying` | `boolean` | `false` | Quando `true`, executa como `INSERT`/`UPDATE`/`DELETE` e o método resolve para o número de linhas afetadas. Quando `false`, executa como query de leitura e resolve para o tipo de retorno declarado. |

Query methods aceitam `{ args, db? }` na chamada — `db` permite que participem de um bloco `transaction()`, assim como os métodos base e dinâmicos.

### Queries raw pontuais com `query()`

Para SQL raw pontual que não justifica declarar um `@QueryMethod` na classe do repository, chame `query()` diretamente — ele está disponível em toda instância de `VSRepository` e passa pela mesma implementação de `query()` do adapter por baixo dos panos:

```typescript
query<T = any>(query: string, options?: { args?: any[]; db?: any; modifying?: boolean }): Promise<T>;
```

```typescript
const users = await userRepository.query<User[]>('SELECT * FROM "user" WHERE email = $1', {
    args: ["maria@email.com"],
});

const linhasAfetadas = await userRepository.query<number>(
    'UPDATE "user" SET active = true WHERE id = $1',
    { args: ["123"], modifying: true },
);
```

| Option      | Tipo      | Padrão                      | Descrição                                                                                                            |
| ----------- | --------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `args`      | `any[]`   | `undefined`                 | Parâmetros posicionais injetados nos placeholders `$1`, `$2`, ... Nunca interpole valores diretamente na string SQL. |
| `db`        | `any`     | Client padrão do repository | Client ou transação do banco em que essa query deve rodar.                                                           |
| `modifying` | `boolean` | `false`                     | Quando `true`, trata a instrução como `INSERT`/`UPDATE`/`DELETE`.                                                    |

Assim como os métodos base, dinâmicos e query, `query()` aceita `db` em `options` para participar de um bloco `transaction()`.

---

## Transações

Todos os métodos (base, dinâmicos e de query) aceitam `options.db` para participar de uma transação compartilhada:

```typescript
await userRepository.transaction(async tx => {
    const usuario = await userRepository.save(
        { name: "Maria", email: "maria@email.com" },
        { db: tx },
    );

    await userLogsRepository.save(
        { action: "Usuário criado", data: { userId: usuario.id } },
        { db: tx },
    );
});
```

Repositories diferentes podem compartilhar a mesma transação, desde que seus adapters apontem para a mesma conexão do ORM por trás deles.

`transaction()` aceita um `VSRepoTransactionOptions` opcional como segundo argumento:

```typescript
import { TransactionIsolationLevel } from "vsrepo";

await userRepository.transaction(
    async tx => {
        await userRepository.save({ name: "Maria", email: "maria@email.com" }, { db: tx });
    },
    { isolationLevel: TransactionIsolationLevel.SERIALIZABLE, timeoutMs: 5000 },
);
```

| Option           | Type                       | Descrição                                                                    |
| ----------------- | -------------------------- | -------------------------------------------------------------------------------- |
| `isolationLevel` | `TransactionIsolationLevel` | Nível de isolamento usado na transação. O padrão é o default do ORM por trás dela. |
| `timeoutMs`       | `number`                    | Tempo máximo (em ms) que a transação pode rodar antes de ser abortada.     |

`TransactionIsolationLevel` espelha os níveis de isolamento SQL padrão: `READ_UNCOMMITTED`, `READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`. O suporte a um determinado nível depende do adapter/ORM e do banco de dados por trás dele.

---

## Tipos utilitários

Além dos tipos que descrevem o formato da entidade já vistos acima (`VSRepoSelect`, `VSRepoRelations`, `VSRepoWhere`), o VSRepository exporta um conjunto de tipos utilitários. Eles aparecem ao longo de várias seções anteriores, mas aqui está uma referência consolidada. Todos fazem parte da API pública e podem ser importados diretamente:

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
    VSRepoWhere,
    VSRepoOrmTypes,
    VSRepoTransactionOptions,
    TransactionIsolationLevel,
} from "vsrepo";
```

| Tipo                                                | Descrição                                                                                                                                                                                                           | Usado por                                                                                                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MethodOptions<T, K>`                               | Options aceitas como último argumento por todo método base e dinâmico: `select`, `relations`, `see`, `db`.                                                                                                          | [Métodos base](#métodos-base), [Métodos Dinâmicos](#métodos-dinâmicos).                                                                                             |
| `Pagination`                                        | `{ limit?, offset? }` aceito por `getAll` e pelos métodos dinâmicos com `Paginated`.                                                                                                                                | [Métodos base](#métodos-base), [Ordenação, paginação e distinct](#ordenação-paginação-e-distinct).                                                                  |
| `Ordering<T>` / `OrderByField<T>` / `SortDirection` | Formato de ordenação aceito por `getAll`, `defaultOrdering` e `injectOrdering`, e pelos métodos dinâmicos com `Ordered`. Pode ser um único objeto ou um array encadeado; objetos aninhados ordenam relações to-one. | [Options do construtor](#options-do-construtor), [Options do decorador](#options-do-decorador), [Ordenação, paginação e distinct](#ordenação-paginação-e-distinct). |
| `SeeMode`                                           | `"active" \| "removed" \| "all"` — controla a visibilidade de registros com soft-delete.                                                                                                                            | [Soft-delete](#soft-delete).                                                                                                                                        |
| `DeepPartial<T>`                                    | Torna todas as propriedades de `T` opcionais recursivamente, incluindo objetos aninhados e elementos de array.                                                                                                      | `save`, `saveList`, `patch`, `merge`, e todo método de escrita do `VSRepoAdapter`.                                                                                  |
| `CountResult`                                       | `{ count: number }` — o formato retornado por operações em lote.                                                                                                                                                    | `removeList`, `softRemoveList`, `restoreList`, `createManyIgnoreConflicts`.                                                                                         |
| `QueryMethodArg<T>`                                 | `{ args?: T, db? }` — parâmetros posicionais do SQL (`$1`, `$2`, ...) e cliente de transação para o `@QueryMethod`.                                                                                                 | [Query methods (SQL raw)](#query-methods-sql-raw).                                                                                                                  |
| `KeysOfType<T, K>`                                  | Extrai as chaves de `T` cujo tipo de valor é atribuível a `K`.                                                                                                                                                      | Restringe `pkName`, em [Options do construtor](#options-do-construtor), aos campos da entidade compatíveis com o tipo de chave primária configurado.                |
| `Primitive`                                         | União de tipos escalares (`string \| number \| boolean \| bigint \| symbol \| undefined \| null \| Date`) tratados como valores-folha — e não relações — ao percorrer o formato de uma entidade.                    | Usado por `Ordering<T>` para distinguir campos escalares de campos de relação.                                                                                      |
| `VSRepoWhere<T>`                                    | Tipo de filtro agnóstico de ORM aceito pelos métodos dinâmicos `*Where` (ex.: `findWhere`, `findOneWhere`, `updateWhere`). Suporta filtros de campo, operadores lógicos (`AND`/`OR`/`NOT`) e filtros de relação.    | [Prefixos `findWhere`, `findOneWhere` e demais `*Where`](#prefixos-disponíveis).                                                                                    |
| `VSRepoOrmTypes`                                    | `{ dbClient; dbTransaction }` — descreve os tipos de client/transaction do seu ORM. Passado como terceiro generic de `VSRepository<Entity, PKType, OrmTypes>` para tipar `getDbClient()`, `transaction()` e a option `db` em vez de `any`. | [Criando um repository](#criando-um-repository).                                                                                                                    |
| `VSRepoTransactionOptions`                          | `{ isolationLevel?, timeoutMs? }` — options aceitas como segundo argumento de `transaction()`.                                                                                                                      | [Transações](#transações).                                                                                                                                          |
| `TransactionIsolationLevel`                         | Enum dos níveis de isolamento SQL padrão (`READ_UNCOMMITTED`, `READ_COMMITTED`, `REPEATABLE_READ`, `SERIALIZABLE`) aceitos por `VSRepoTransactionOptions.isolationLevel`.                                          | [Transações](#transações).                                                                                                                                          |

### `DeepPartial<T>`

Torna todas as propriedades opcionais recursivamente, percorrendo objetos aninhados e elementos de array — diferente do `Partial<T>` nativo do TypeScript, que só torna o nível superior opcional:

```typescript
type User = { id: string; name: string; address: { city: string; zip: string } };

const patch: DeepPartial<User> = {
    address: { city: "São Paulo" }, // zip pode ser omitido; city mantém seu tipo
};

await userRepository.patch(id, patch);
```

### `KeysOfType<T, K>`

Filtra um tipo de objeto para as chaves cujo valor corresponde a um tipo dado — é isso que permite que `pkName` aceite apenas campos da entidade que sejam de fato atribuíveis ao tipo de chave primária do repository:

```typescript
type User = { id: string; age: number; name: string };
type StringKeys = KeysOfType<User, string>; // "id" | "name"
```

### `Ordering<T>`

Aceita um único objeto de ordenação ou um array deles, aplicados na ordem declarada:

```typescript
const order: Ordering<User> = { createdAt: "desc" };
const chained: Ordering<User> = [{ name: "asc" }, { createdAt: "desc" }];

await userRepository.getAll({ order: chained });
```

---

## Escrevendo seu próprio adapter

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
}
```

O `VSRepository` nunca fala diretamente com o ORM — ele só chama esses métodos com um `VSRepoWhere<T>` e um `AdapterMethodOptions<T>` já resolvidos. Uma vez que um adapter implemente esse contrato, todo método base, método dinâmico e query method passa a funcionar com ele automaticamente. Pra uma implementação completa e funcional, veja o repositório externo [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter).

### Logging a partir do seu adapter

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

| Método                             | Descrição                                                                                      |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| `new VSLogger(logLevel, name, slowThresholdMs?)` | Cria um logger; `name` prefixa cada linha, `slowThresholdMs` tem default 300.                    |
| `logDebug/logInfo/logWarn(text, obj?)` | Loga no nível dado se `logLevel` permitir; `obj` é anexado como JSON formatado.       |
| `logError(text, err?)`              | Loga em `ERROR`; se `err` for uma `Error`, só `name`/`message`/`stack`/`cause` são logados.        |
| `startPerformLog(operation)` / `endPerformLog(data)` | Envolve um trecho de código para logar sua duração, escalando pra `WARN` se ultrapassar `slowThresholdMs`. |
| `getLogLevel()`                     | Retorna o `VSLogLevel` configurado do logger.                                                     |

Isso é puramente uma conveniência para autores de adapters — nada no core exige que seu adapter o utilize.

---

## Tratamento de erros

A v2 simplifica a hierarquia de erros da v1: em vez de várias subclasses, existe uma classe base `VSRepoError` carregando um campo `type: VSRepoErrorType`, além de uma subclasse dedicada `VSRepoAdapterError` (veja abaixo) para falhas vindas do ORM/banco subjacente.

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

| `VSRepoErrorType` | Quando é lançado                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `DECORATOR`       | Argumentos inválidos foram passados para `@DynamicMethod` ou `@QueryMethod`.                                                               |
| `RESOLVER`        | A biblioteca falhou ao resolver a configuração de um método dinâmico/de query em um método chamável (ex.: um nome de método desconhecido). |
| `DYNAMIC`         | Um método dinâmico já resolvido falhou em tempo de execução (ex.: argumentos faltando).                                                    |
| `VALIDATOR`       | Options ou argumentos de método inválidos foram detectados durante a validação.                                                            |
| `BASE`            | Uso inválido de um método base (`get`, `save`, `remove`, etc).                                                                             |
| `ADAPTER`         | Um `VSRepoAdapter` falhou ao falar com o ORM/banco subjacente — sempre é lançado como `VSRepoAdapterError`.                                |

### `VSRepoAdapterError` e `AdapterErrorCode`

Quando um adapter fala com o ORM/banco subjacente e essa operação falha, o adapter encapsula a falha em um `VSRepoAdapterError` — uma subclasse de `VSRepoError` com `type: VSRepoErrorType.ADAPTER`. Ele carrega um `code: AdapterErrorCode` **estável e agnóstico de adapter** além do erro bruto lançado pelo ORM/driver, para que quem chama possa reagir às falhas sem depender do formato de erro de nenhum ORM específico:

```typescript
import { VSRepoAdapterError, AdapterErrorCode } from "vsrepo";

try {
    await userRepository.save({ name: "Maria" });
} catch (error) {
    if (error instanceof VSRepoAdapterError) {
        console.error(`[${error.code}] ${error.message}`, error.originalError);

        if (error.code === AdapterErrorCode.UNIQUE_CONSTRAINT_VIOLATION) {
            // tratar chave duplicada, ex.: retornar uma mensagem amigável
        }
    }
}
```

| Propriedade     | Tipo               | Descrição                                                                         |
| --------------- | ------------------ | --------------------------------------------------------------------------------- |
| `code`          | `AdapterErrorCode` | Código estável e agnóstico que classifica a falha.                                |
| `originalError` | `unknown`          | O erro bruto (ou `null`/`undefined`) lançado pelo driver do ORM/banco subjacente. |
| `message`       | `string`           | Descrição legível da falha do adapter.                                            |
| `type`          | `VSRepoErrorType`  | Sempre `VSRepoErrorType.ADAPTER`.                                                 |
| `cause`         | `unknown`          | Causa raiz opcional da qual o erro foi encadeado.                                 |

As implementações de adapter o constroem diretamente ao mapear uma falha do ORM:

```typescript
import { VSRepoAdapterError, AdapterErrorCode } from "vsrepo";

throw new VSRepoAdapterError(
    "falha ao criar o usuário",
    AdapterErrorCode.UNIQUE_CONSTRAINT_VIOLATION,
    originalError, // erro bruto do banco/driver
);
```

#### `AdapterErrorCode`

`AdapterErrorCode` é um enum de códigos granulares e agnósticos que um adapter pode lançar através de `VSRepoAdapterError`. Eles espelham as falhas mais comuns lançadas por ORMs e drivers de banco, para que erros de qualquer ORM possam ser mapeados para o mesmo código estável:

```typescript
import { AdapterErrorCode } from "vsrepo";

console.log(AdapterErrorCode.UNIQUE_CONSTRAINT_VIOLATION); // "UNIQUE_CONSTRAINT_VIOLATION"
```

| Código                        | Significado                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `UNKNOWN`                     | Erro não classificado/desconhecido; o fallback quando nenhum código mais específico corresponde.              |
| `MISSING_DB_CLIENT`           | Cliente de banco (ou pool de conexões) não fornecido ou que não pôde ser resolvido.                           |
| `CONNECTION_FAILED`           | Não foi possível alcançar/conectar ao banco, ou uma conexão estabelecida foi perdida/terminada.               |
| `CONNECTION_POOL_EXHAUSTED`   | Pool de conexões esgotado/depletado — nenhuma conexão disponível, todas ocupadas ou o limite foi atingido.    |
| `TIMEOUT`                     | O banco não respondeu a tempo; uma query excedeu o timeout permitido.                                         |
| `UNIQUE_CONSTRAINT_VIOLATION` | Violação de constraint unique (chave duplicada). Ex.: Postgres/SQLite `23505`, MySQL `1062`.                  |
| `FOREIGN_KEY_VIOLATION`       | Violação de constraint de foreign key (linha referenciada não existe).                                        |
| `NOT_NULL_VIOLATION`          | Violação de constraint NOT NULL.                                                                              |
| `CHECK_VIOLATION`             | Violação de constraint CHECK.                                                                                 |
| `CONSTRAINT_VIOLATION`        | Violação geral de integridade/constraint não coberta por um código mais específico.                           |
| `NOT_FOUND`                   | Registro solicitado não encontrado (ex.: uma operação tipo `findOneOrThrow`).                                 |
| `INVALID_DATA`                | Valor de campo inválido para o tipo/tamanho, ou um valor obrigatório ausente.                                 |
| `VALUE_TOO_LONG`              | Valor fornecido excede o limite de tamanho da coluna/campo.                                                   |
| `CONVERSION_ERROR`            | Um valor não pôde ser convertido/convertido para o tipo alvo. Ex.: Postgres `22P02`, MySQL `1366`.            |
| `INVALID_QUERY`               | A query/stored procedure SQL está malformada ou é inválida.                                                   |
| `TABLE_OR_COLUMN_NOT_FOUND`   | A tabela/coluna/relação referenciada não existe.                                                              |
| `DEADLOCK`                    | Operação abortada por timeout de lock ou deadlock entre transações concorrentes.                              |
| `LOCK_TIMEOUT`                | Não foi possível adquirir um lock de banco obrigatório a tempo.                                               |
| `LOCKED`                      | O registro está travado e não pode ser modificado.                                                            |
| `ACCESS_DENIED`               | O usuário/role atual não tem permissão para a operação.                                                       |
| `INVALID_CREDENTIALS`         | Credenciais de conexão inválidas (host/usuário/senha).                                                        |
| `ROW_NOT_ALLOWED`             | O usuário autenticado não é dono do registro / a segurança em nível de linha rejeitou.                        |
| `MODEL_NOT_FOUND`             | Entidade/modelo ou tabela não definida/mapeada no ORM, ou o adapter não tem os metadados do modelo.           |
| `FIELD_NOT_FOUND`             | Nome de campo/coluna nos dados ou no `where` não existe na entidade/modelo.                                   |
| `TRANSACTION_CLOSED`          | Transação usada depois de commit/rollback.                                                                    |
| `TRANSACTION_ALREADY_STARTED` | Uma transação aninhada não pôde ser aberta (ex.: chamadas `transaction()` aninhadas).                         |
| `TRANSACTION_CONFLICT`        | Uma transação falhou ao commitar e foi desfeita.                                                              |
| `TRANSACTION_NOT_STARTED`     | Nenhuma transação ativa quando uma era obrigatória.                                                           |
| `CONNECTION_CLOSED`           | Conexão fechada/terminada enquanto uma transação ou query estava em andamento.                                |
| `INVALID_PARTIAL`             | `merge`/`upsert`/`update` recebeu um objeto parcial inválido ou faltando chaves obrigatórias.                 |
| `NOT_SUPPORTED`               | Feature/operação não suportada solicitada ao adapter (ex.: `query()` bruto não suportado).                    |
| `INVALID_ADAPTER_CONFIG`      | Configuração do adapter inválida ou incompleta (options obrigatórias ausentes, ou com tipo/valor inválido).   |
| `INTERNAL`                    | Bug interno do adapter ou estado irrecuperável; deve raramente ser usado — prefira um código mais específico. |

#### `VSRepoError` vs. erros brutos do ORM

Erros de uso/configuração fora do adapter lançam o `VSRepoError` base. Falhas lançadas _pelo ORM subjacente_ enquanto um método do adapter roda são **encapsuladas** em `VSRepoAdapterError` (classificadas por um `AdapterErrorCode`, com o erro original preservado em `originalError`) em vez de se propagarem cruas — é isso que torna quem chama independente do formato de erro de qualquer ORM específico.

---

## Logging

Todo repository tem um logger interno, configurado via `logLevel` e `logSlowThresholdMs` nas options do construtor:

```typescript
import { VSLogLevel } from "vsrepo";

super({
    pkName: "id",
    adapter,
    logLevel: VSLogLevel.DEBUG,
    logSlowThresholdMs: 200,
});
```

| Nível           | Significado                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `DEBUG`         | Detalhes internos verbosos, incluindo toda query resolvida — muito útil para debugar métodos dinâmicos. |
| `INFO`          | Eventos de alto nível do ciclo de vida, como a inicialização do repository.                             |
| `WARN` (padrão) | Problemas recuperáveis e operações lentas (veja `logSlowThresholdMs`, padrão de 300ms).                 |
| `ERROR`         | Falhas lançadas durante a execução de uma operação.                                                     |

---

## Desenvolvimento

O core da v2 é compilado e empacotado a partir desta branch como um pacote npm padrão:

```bash
# 1. Instalar as dependências
pnpm install

# 2. Compilar os fontes TypeScript em dist/ (remove um dist/ anterior primeiro)
pnpm build

# 3. (Opcional) Inspecionar o que seria publicado sem gerar um tarball
npm pack --dry-run

# 4. Gerar o tarball instalável (roda `prepack` -> `pnpm build` automaticamente)
npm pack

# 5. Consumir localmente em outro projeto
npm install ../caminho/vsrepo-1.4.0.tgz
```

Observações:

- `pnpm build` executa `tsc -p tsconfig.build.json`, que gera o JS compilado e as declarações de tipo em `dist/` com `rootDir: src`.
- O pacote publicado contém **apenas** a pasta `dist/` além dos READMEs e da `LICENSE` (veja `files` no `package.json`). Os adapters viverão em seus próprios pacotes `@vsrepo/*-adapter`.
- O core é ORM-agnóstico e não tem dependência peer de `@prisma/client`.

---

## Requisitos

- Node.js 18+
- TypeScript, com **decorators legacy/experimentais** habilitados (necessário para `@DynamicMethod`/`@QueryMethod`):

```json
{
    "compilerOptions": {
        "experimentalDecorators": true
    }
}
```

- `reflect-metadata` (já incluso como dependência, importado internamente — você não precisa importá-lo você mesmo)
- Pelo menos um `VSRepoAdapter` funcional para o seu banco — no Prisma 7, instale o [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) já publicado (veja [Status dos adapters](#status-dos-adapters)); adapters oficiais para outros ORMs estão planejados, mas ainda não publicados, então por enquanto isso significa escrever o seu próprio (veja [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)) — e, se publicá-lo, contribuir de volta com o projeto é bem-vindo

---

## Contribuindo

Contribuições são bem-vindas, especialmente para finalizar os adapters do Prisma e do TypeORM! (**[Repositório do GitHub](https://github.com/jaobrabo123/VSRepository)**):

1. Faça um **Fork** do projeto.
2. Crie uma branch a partir de `v2` para sua alteração: `git checkout -b v2-minha-alteracao`.
3. Faça o push da sua branch: `git push origin v2-minha-alteracao`.
4. Abra um **Pull Request** contra a `v2`.

Para reportar problemas ou sugerir funcionalidades, abra uma **Issue**.
