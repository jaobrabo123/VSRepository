<div align="center">
  <img src="https://res.cloudinary.com/ddbfifdxd/image/upload/w_200,q_auto,f_auto/v1786386427/VS_logo_TextoAbaixo_yev4tq.png" alt="VSRepository Logo" width="200"/>

  <p style="margin-top: 12px;">
    <img src="https://img.shields.io/npm/v/vsrepo?style=flat-square" alt="npm version"/>
    <img src="https://img.shields.io/npm/l/vsrepo?style=flat-square" alt="npm license"/>
    <img src="https://img.shields.io/badge/inspired%20by-JpaRepository-E73121?style=flat-square" alt="inspired by JpaRepository"/>
  </p>
</div>

# VSRepository v2

🇧🇷 Você está lendo a versão em português. [🇺🇸 Read in English](./README.md)

> ⚠️ **Trabalho em andamento.** Este documento descreve a branch `v2`, uma reescrita em andamento do VSRepository. O núcleo (classe de repositório, parser de métodos dinâmicos, decoradores, tratamento de erros) já funciona de ponta a ponta, mas nem todos os adapters estão completos ainda — veja [Status dos adapters](#status-dos-adapters) antes de depender desta branch. Se você precisa da versão estável, somente Prisma, use o código/docs da [`v1`](https://github.com/jaobrabo123/VSRepository/tree/v1).

Biblioteca de repository pattern **agnóstica de ORM**, com suporte completo a **TypeScript** e **type inference** automático. O VSRepository v2 é uma reescrita da biblioteca [v1](./v1): em vez de falar diretamente com o Prisma, o núcleo agora delega toda operação a um **adapter** plugável, permitindo que a mesma API de repository funcione com Prisma, TypeORM ou qualquer outro ORM/banco que implemente o contrato de adapter.

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
- [Transações](#transações)
- [Tipos utilitários](#tipos-utilitários)
- [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)
- [Tratamento de erros](#tratamento-de-erros)
- [Logging](#logging)
- [Desenvolvimento](#desenvolvimento)
- [Requisitos](#requisitos)
- [Contribuindo](#contribuindo)

---

## O que mudou da v1

Se você vem do código/docs da [v1](./v1), aqui está o resumo. Veja cada seção linkada para detalhes.

| Área | v1 | v2 |
| --- | --- | --- |
| Acesso ao banco | Fala diretamente com o **Prisma**, embutido no pacote core | Fala com um **`VSRepoAdapter`**; o suporte a cada ORM é distribuído em pacotes separados (`@vsrepo/prisma7-adapter`, `@vsrepo/typeorm-adapter`, ...) em vez de vir embutido no pacote core `vsrepo` |
| Definindo um repository | `setupVSRepo<T, M>()({...}).build(prisma)` funcional, **ou** uma classe `DynamicRepository` | Uma única API **baseada em classes**: `extends VSRepository<Entity, PKType, OrmTypes>` |
| Métodos dinâmicos | Objeto de config `methods: { findByEmail: { map: true } }` | Decorador `@DynamicMethod()` em um campo `declare` |
| Projeções de dados | `selectModels` + `defaultSelectModel` nomeados e reutilizáveis | `select`/`relations` ad-hoc passados em cada chamada (sem modelos nomeados) |
| Eager loading | `include`/`includeModels` (específico do Prisma) | Option `relations` agnóstica de ORM |
| Filtros globais | `requiredWhere` (qualquer filtro arbitrário, sempre aplicado) | `softRemoveKey` + `see: "active" \| "removed" \| "all"` (apenas soft-delete, não é mais um filtro genérico) |
| Sufixo de filtro case-insensitive | `Insensitive` | `IgnoreCase` |
| Ordenação inline no nome do método | Não suportado (`order` tinha que ser passado como argumento via `Ordered`/`Paginated`) | Cadeias `OrderBy<Campo>Asc`/`OrderBy<Campo>Desc` embutidas diretamente no nome do método |
| Tratamento de duplicatas no `createMany` | Sufixo `SkipDuplicates` | Sufixo `IgnoreConflicts` |
| Escape hatch de SQL raw | Não disponível | Decorador `@QueryMethod(sql, { modifying })`, com placeholders `$1`, `$2`, ... |
| Upsert em lote | Não disponível | `saveList` |
| `aggregate` / `groupBy` | Suportado (passthrough nativo do Prisma) | **Ainda não implementado** (planejado) |
| Tipos de erro | `VSRepoError` + subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`, `VSRepoRuntimeError`) | Uma única classe `VSRepoError` com um campo `type: VSRepoErrorType` (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`) |
| Log de debug | Boolean `showWorking: true` | `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) + `logSlowThresholdMs` para avisos de queries lentas |
| CLI `vsrepo generate` (etapa de geração de tipos) | Obrigatória antes de usar | Não faz parte do núcleo da v2 — os tipos vêm diretamente das suas entidades/tipos do ORM |
| Extras de CRUD | `patchList`, `options.select`/`options.include` raw | `select`/`relations` já são o padrão (sempre "raw"); `patch`/`merge` mantêm a mesma semântica |

---

## Status dos adapters

O VSRepository v2 é **agnóstico de ORM por design**. O pacote core (`vsrepo`) traz apenas a classe de repository, os decoradores, o engine de parsing de nomes, o tratamento de erros e o logging — ele **não** inclui um adapter de produção. O suporte de fato a cada ORM/banco deve viver em **pacotes separados, versionados de forma independente**, um por ORM (e, quando fizer sentido, um por versão principal do ORM), por exemplo:

- `@vsrepo/prisma7-adapter`
- `@vsrepo/prisma8-adapter`
- `@vsrepo/typeorm-adapter`
- `@vsrepo/drizzle-adapter`

Nenhum desses pacotes de adapter foi publicado ainda. O que existe nesta branch, dentro de `src/adapters/`, são **protótipos/implementações de referência** usados para desenhar e validar o contrato do `VSRepoAdapter` enquanto o core estava sendo construído — não são os adapters reais e distribuíveis:

| Protótipo | Status |
| --- | --- |
| `VSRepoPrisma7Adapter` (`src/adapters/prisma7`) | 🟡 **Protótipo de referência.** `findOne` está implementado; todos os outros métodos (`findMany`, `save`, `update`, `delete`, `count`, `exists`, `query`, etc.) atualmente lançam `"Method not implemented."`. É o ponto de partida do futuro pacote `@vsrepo/prisma7-adapter`, não o pacote em si. |
| TypeORM (`src/adapters/typeorm.adapter.ts`) | 🟡 **Protótipo de referência.** Só existe o parser da cláusula `where` (`parseVSRepoWhere`) até agora; ele **ainda não** implementa o contrato completo de `VSRepoAdapter`. É o ponto de partida do futuro pacote `@vsrepo/typeorm-adapter`. |
| Adapters customizados | 🟢 Totalmente suportados hoje — implemente você mesmo a classe abstrata [`VSRepoAdapter`](#escrevendo-seu-próprio-adapter) para qualquer ORM/banco que precisar, no seu próprio projeto ou pacote, seguindo o mesmo formato esperado dos `@vsrepo/*-adapter`. |

Resumindo: a classe de repository, os decoradores `@DynamicMethod`/`@QueryMethod`, o engine de parsing de nomes, o tratamento de erros e o logging já funcionam de ponta a ponta — o que ainda está sendo construído é a integração concreta com cada ORM, que será distribuída como pacotes `@vsrepo/*-adapter` separados, e não como parte do pacote core `vsrepo`. Trate esta branch como um preview da arquitetura da v2, e não como um substituto imediato para a v1.

---

## Instalação

Quando lançada, a v2 será instalada como o pacote core mais um pacote de adapter para o seu ORM, por exemplo:

```bash
npm i vsrepo @vsrepo/prisma7-adapter
```

> Nem o `vsrepo` v2 nem nenhum pacote `@vsrepo/*-adapter` foram publicados no npm ainda. O core já pode ser compilado e empacotado a partir desta branch (`pnpm build` + `npm pack` + `npm install ../caminho/vsrepo-<versão>.tgz`) e o seu `package.json` reflete a API da v2. O que ainda falta para um release publicado de verdade são os pacotes `@vsrepo/*-adapter` e o publish em si. Até lá, se quiser usar a v2 hoje, instale o core a partir do tarball empacotado ou consuma da pasta `src/` e escreva seu próprio adapter (veja [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)) ou adapte um dos protótipos em `src/adapters/`.

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

> A API do core (`VSRepository`, `VSRepoAdapter`, `DynamicMethod`, `QueryMethod`, `VSRepoError`, enums e tipos) é importada do entry point único `vsrepo`. O adapter concreto vem de um pacote **separado** (`@vsrepo/*-adapter`). Até que esses pacotes de adapter sejam publicados, implemente o contrato `VSRepoAdapter` você mesmo (veja [Escrevendo seu próprio adapter](#escrevendo-seu-próprio-adapter)) ou adapte um dos protótipos de referência em `src/adapters/`.

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

| Option | Tipo | Descrição |
| --- | --- | --- |
| `adapter` | `VSRepoAdapter<T>` | **Obrigatório.** A instância do adapter que traduz as chamadas do repository em chamadas contra o ORM/banco por trás dele. |
| `pkName` | `keyof T` | **Obrigatório.** Nome do campo que representa a primary key da entidade. |
| `softRemoveKey` | `keyof T` | Opcional. Quando definido, habilita `softRemove`, `softRemoveList`, `restore` e `restoreList`. |
| `defaultOrdering` | `Ordering<T>` | Opcional. Ordenação padrão aplicada automaticamente em queries que aceitam `order`, a menos que seja sobrescrita em uma chamada específica. |
| `logLevel` | `VSLogLevel` | Opcional. Severidade mínima impressa pelo logger interno. Padrão: `VSLogLevel.WARN`. |
| `logSlowThresholdMs` | `number` | Opcional. Duração (ms) acima da qual uma operação concluída é logada como `WARN` em vez de `DEBUG`. Padrão: 300ms. |

---

## Métodos base

Disponíveis automaticamente em toda subclasse de `VSRepository`:

| Método | Descrição |
| --- | --- |
| `get(pk, options?)` | Busca um registro pela primary key. |
| `getOrThrow(pk, options?)` | Busca um registro pela primary key, lançando erro se não encontrar. |
| `getList(pks, options?)` | Busca vários registros por uma lista de primary keys. |
| `getAll(options?)` | Busca todos os registros; aceita `pagination` e `order` em `options`. |
| `save(obj, options?)` | Cria ou atualiza (upsert) um único registro. |
| `saveList(objs, options?)` | Cria ou atualiza (upsert) vários registros em uma única chamada. |
| `patch(pk, obj, options?)` | Atualiza parcialmente um registro pela primary key. |
| `merge(pk, obj, options?)` | Atualiza parcialmente um registro e o retorna mesclado (deep-merge) com o objeto informado. |
| `remove(pk, options?)` | Remove um registro pela primary key. |
| `removeList(pks, options?)` | Remove vários registros pela primary key, retornando `{ count }`. |
| `total(options?)` | Retorna o total de registros. |
| `has(pk, options?)` | Verifica se um registro existe, retornando `boolean`. |
| `transaction(fn, options?)` | Executa `fn` dentro de uma transação nativa do ORM. |
| `getDbClient()` | Retorna a instância do client do ORM usada fora de transações. |

Todos os métodos acima aceitam um objeto `MethodOptions<Entity, OrmTypes>` como último argumento (`select`, `relations`, `see`, `db`).

---

## Soft-delete

O soft-delete agora é um **conceito nativo de primeira classe**, em vez de algo que você tinha que modelar sozinho com `requiredWhere`. Configure `softRemoveKey` uma vez no repository:

```typescript
super({
    pkName: "id",
    adapter,
    softRemoveKey: "deletedAt",
});
```

Isso libera quatro métodos extras:

| Método | Efeito |
| --- | --- |
| `softRemove(pk, options?)` | Define `deletedAt` para a data atual. |
| `softRemoveList(pks, options?)` | O mesmo, em lote — retorna `{ count }`. |
| `restore(pk, options?)` | Volta `deletedAt` para `null`. |
| `restoreList(pks, options?)` | O mesmo, em lote — retorna `{ count }`. |

Todo o restante dos métodos aceita uma option `see` que controla a visibilidade de registros com soft-delete:

```typescript
await userRepository.getAll({ see: "active" });  // padrão — apenas registros não removidos
await userRepository.getAll({ see: "removed" }); // apenas registros com soft-delete
await userRepository.getAll({ see: "all" });      // todos, ignorando o soft-delete
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
>   ```typescript
>   // TypeORM: apenas select NÃO é suficiente
>   await userRepository.get(id, {
>     select: { id: true, address: { city: true } },
>     relations: { address: true }, // ← obrigatório no TypeORM
>   });
>   ```
> - **Prisma 7 (`@vsrepo/prisma7-adapter` / `VSRepoPrisma7Adapter`)** — `relations` é convertido para `include` do Prisma (`parsePrismaInclude`). **Se `select` estiver presente, `relations` é ignorado** porque o Prisma não permite `select` + `include` na mesma query:
>   ```typescript
>   // Prisma7: relations é ignorado quando select existe
>   await userRepository.get(id, {
>     select: { id: true, name: true },
>     relations: { address: true }, // ← ignorado, include = undefined
>   });
>   ```
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
    declare updateById: (id: string, data: Partial<User>) => Promise<User>;

    @DynamicMethod()
    declare findByNameIgnoreCaseOrAgeBetweenANDActiveIsNullDistinctNameAndAgeOrderByCreatedAtAscAndUpdatedAtDescPaginated:
        (name: string, age: [number, number], pagination: { limit?: number; offset?: number }) => Promise<User[]>;
}
```

### Prefixos disponíveis

| Prefixo | Método do adapter | Observações |
| --- | --- | --- |
| `findBy` | `findMany` | Filtros de campo seguem o prefixo. |
| `findOneBy` | `findOne` | Filtros de campo seguem o prefixo; resultado único. |
| `findOneOrThrowBy` | `findOneOrThrow` | Lança erro se não encontrar. |
| `findOneOrThrow` | `findOneOrThrow` | Sem filtros de campo; aplica só soft-delete/`see`. |
| `findOneOrThrowWhere` | `findOneOrThrow` | Recebe um objeto `where` explícito como argumento. |
| `findWhere` | `findMany` | Recebe um objeto `where` explícito como argumento. |
| `findOneWhere` | `findOne` | Recebe um objeto `where` explícito como argumento. |
| `countBy` | `count` | Filtros de campo seguem o prefixo. |
| `countWhere` | `count` | Recebe um objeto `where` explícito como argumento. |
| `count` | `count` | Sem filtros de campo. |
| `existsBy` | `exists` | Retorna `boolean`. |
| `existsWhere` | `exists` | Recebe um objeto `where` explícito como argumento. |
| `create` | `create` | Recebe `data` como argumento. |
| `createMany` | `createMany` | Recebe `data[]` como argumento; suporta `IgnoreConflicts`. |
| `updateBy` | `update` | Filtros de campo + `data` como argumento. |
| `updateWhere` | `update` | `where` explícito + `data` como argumentos. |
| `updateManyBy` | `updateMany` | Filtros de campo + `data`. |
| `updateManyWhere` | `updateMany` | `where` explícito + `data`. |
| `updateManyReturningBy` | `updateManyReturning` | Filtros de campo + `data`; retorna os registros atualizados. |
| `updateManyReturningWhere` | `updateManyReturning` | `where` explícito + `data`; retorna os registros atualizados. |
| `upsertBy` | `upsert` | Filtros de campo + payloads `create`/`update`. |
| `upsertWhere` | `upsert` | `where` explícito + payloads `create`/`update`. |
| `deleteBy` | `delete` | Filtros de campo seguem o prefixo. |
| `deleteWhere` | `delete` | Objeto `where` explícito como argumento. |
| `deleteManyBy` | `deleteMany` | Filtros de campo seguem o prefixo. |
| `deleteManyWhere` | `deleteMany` | Objeto `where` explícito como argumento. |
| `deleteManyReturningBy` | `deleteManyReturning` | Filtros de campo seguem o prefixo; retorna os registros removidos. |
| `deleteManyReturningWhere` | `deleteManyReturning` | Objeto `where` explícito; retorna os registros removidos. |

> `aggregate` e `groupBy` **ainda não estão implementados** na v2 (existiam na v1). Está planejado, mas não disponível no momento.

### Filtros de campo

Aplicados como sufixos ao nome do campo dentro do método (mesma ideia da v1, com um sufixo renomeado):

| Sufixo | Significado | Argumento |
| --- | --- | --- |
| *(sem sufixo)* | igualdade (`=`) | sim |
| `Not` | negação | sim |
| `In` | está em | sim (array) |
| `NotIn` | não está em | sim (array) |
| `Contains` | contém substring | sim |
| `NotContains` | não contém substring | sim |
| `StartsWith` | começa com | sim |
| `NotStartsWith` | não começa com | sim |
| `EndsWith` | termina com | sim |
| `NotEndsWith` | não termina com | sim |
| `GreaterThan` | `>` | sim |
| `GreaterThanEqual` | `>=` | sim |
| `LessThan` | `<` | sim |
| `LessThanEqual` | `<=` | sim |
| `Between` | intervalo inclusivo | sim (tupla `[min, max]`) |
| `NotBetween` | fora de um intervalo inclusivo | sim (tupla `[min, max]`) |
| `IsNull` | campo é `null` | não |
| `IsNotNull` | campo não é `null` | não |
| `IsTrue` | campo é `true` | não |
| `IsFalse` | campo é `false` | não |
| `IgnoreCase` | combinador case-insensitive para filtros de texto | não *(renomeado do `Insensitive` da v1)* |
| `Optional` | torna o argumento do campo opcional (pode ser `undefined`) | — |

```typescript
@DynamicMethod()
declare findByNameContainsIgnoreCase: (name: string) => Promise<User[]>;

@DynamicMethod()
declare findByAgeBetween: (age: [number, number]) => Promise<User[]>;
```

### Operadores lógicos

| Operador | Uso no nome | Exemplo |
| --- | --- | --- |
| `And` | entre dois campos | `findOneByIdAndEmail` |
| `Or` | entre dois campos | `findByNameOrEmail` |
| `AND` | separa um bloco final em `AND` | `findByEmailOrNameANDActiveStatusAndAgeGreaterThan` |

Regras do `AND` (em capslock), iguais às da v1: só é permitido **um** `AND` por nome de método; todo campo conectado por `And` depois dele é aninhado dentro de `AND: []`; `Or` não pode aparecer depois de um `AND`.

### Filtros de relação

Filtram por campos de entidades relacionadas. Internamente, mapeiam para os operadores `_some`/`_every`/`_none`/`_with`/`_without` de `VSRepoWhere` (veja [`select` e `relations`](#select-e-relations) para o equivalente de eager loading).

| Sufixo | Significado | Restrição |
| --- | --- | --- |
| `Some` | pelo menos um registro relacionado corresponde | apenas relações to-many |
| `SomeField` | filtra dentro dos registros relacionados | apenas relações to-many |
| `Every` | todo registro relacionado corresponde | apenas relações to-many (precisa de `Field` para ser um filtro efetivo) |
| `EveryField` | filtra dentro dos registros relacionados | apenas relações to-many |
| `None` | nenhum registro relacionado corresponde | apenas relações to-many |
| `NoneField` | filtra dentro dos registros relacionados | apenas relações to-many |
| `With` | o registro relacionado existe | apenas relações to-one |
| `WithField` | filtra um campo dentro do registro relacionado | apenas relações to-one |
| `Without` | o registro relacionado não existe | apenas relações to-one |
| `WithoutField` | filtro negado em um campo do registro relacionado | apenas relações to-one |

```typescript
@DynamicMethod()
declare findByAddressWithCityStartsWithIgnoreCase: (city: string) => Promise<User[]>;

@DynamicMethod()
declare findByProductsSome: () => Promise<User[]>;
```

### Ordenação, paginação e distinct

| Sufixo | Efeito |
| --- | --- |
| `Paginated` | injeta um argumento `pagination` (`{ limit?, offset? }`) no final da chamada. |
| `Ordered` | injeta um argumento `order` no final da chamada. |
| `OrderedAndPaginated` | injeta `order`, depois `pagination`. |
| `PaginatedAndOrdered` | injeta `pagination`, depois `order`. |
| `OrderBy<Campo>Asc` / `OrderBy<Campo>Desc` | **Novo na v2.** Embute uma ordenação fixa diretamente no nome do método — encadeie campos com `And` (ex.: `OrderByCreatedAtAscAndNameDesc`). Não precisa de argumento `order`. |
| `Distinct<Campo>And<Campo>...` | **Novo na v2.** Embute campos `distinct` fixos diretamente no nome do método (só válido em métodos da família `findBy`/`findWhere`). |
| `IgnoreConflicts` | No `createMany`, ignora registros que violariam uma constraint única, em vez de lançar erro. *(Renomeado do `SkipDuplicates` da v1.)* |

```typescript
@DynamicMethod()
declare findByActiveOrderByCreatedAtDescPaginated:
    (active: boolean, pagination: { limit?: number; offset?: number }) => Promise<User[]>;

@DynamicMethod()
declare createManyIgnoreConflicts: (data: Partial<User>[]) => Promise<{ count: number }>;
```

### Options do decorador

`@DynamicMethod<T>(options?)` aceita:

| Option | Tipo | Descrição |
| --- | --- | --- |
| `proxyTo` | `string` | Redireciona a lógica do método para outro padrão de método dinâmico válido — útil para nomes que não seguem a convenção de nomenclatura. |
| `injectOrdering` | `Ordering<T>` | Ordenação fixa injetada automaticamente, sobrescrevendo o `defaultOrdering` do repository. |

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

| Option | Tipo | Padrão | Descrição |
| --- | --- | --- | --- |
| `modifying` | `boolean` | `false` | Quando `true`, executa como `INSERT`/`UPDATE`/`DELETE` e o método resolve para o número de linhas afetadas. Quando `false`, executa como query de leitura e resolve para o tipo de retorno declarado. |

Query methods aceitam `{ args, db? }` na chamada — `db` permite que participem de um bloco `transaction()`, assim como os métodos base e dinâmicos.

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

---

## Tipos utilitários

Além dos tipos que descrevem o formato da entidade já vistos acima (`VSRepoSelect`, `VSRepoRelations`, `VSRepoWhere`), o VSRepository exporta um conjunto de tipos utilitários pequenos e focados em `src/types/utils/`. Eles aparecem ao longo de várias seções anteriores, mas aqui está uma referência consolidada. Todos fazem parte da API pública e podem ser importados diretamente:

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

| Tipo | Descrição | Usado por |
| --- | --- | --- |
| `MethodOptions<T, K>` | Options aceitas como último argumento por todo método base e dinâmico: `select`, `relations`, `see`, `db`. | [Métodos base](#métodos-base). |
| `Pagination` | `{ limit?, offset? }` aceito por `getAll` e pelos métodos dinâmicos com `Paginated`. | [Métodos base](#métodos-base), [Ordenação, paginação e distinct](#ordenação-paginação-e-distinct). |
| `Ordering<T>` / `OrderByField<T>` / `SortDirection` | Formato de ordenação aceito por `getAll`, `defaultOrdering` e `injectOrdering`, e pelos métodos dinâmicos com `Ordered`. Pode ser um único objeto ou um array encadeado; objetos aninhados ordenam relações to-one. | [Options do construtor](#options-do-construtor), [Options do decorador](#options-do-decorador). |
| `SeeMode` | `"active" \| "removed" \| "all"` — controla a visibilidade de registros com soft-delete. | [Soft-delete](#soft-delete). |
| `DeepPartial<T>` | Torna todas as propriedades de `T` opcionais recursivamente, incluindo objetos aninhados e elementos de array. | `save`, `saveList`, `patch`, `merge`, e todo método de escrita do `VSRepoAdapter`. |
| `CountResult` | `{ count: number }` — o formato retornado por operações em lote. | `removeList`, `softRemoveList`, `restoreList`, `createManyIgnoreConflicts`. |
| `QueryMethodArg<T>` | `{ args?: T, db? }` — parâmetros posicionais do SQL (`$1`, `$2`, ...) e cliente de transação para o `@QueryMethod`. | [Query methods (SQL raw)](#query-methods-sql-raw). |
| `KeysOfType<T, K>` | Extrai as chaves de `T` cujo tipo de valor é atribuível a `K`. | Restringe `pkName`, em [Options do construtor](#options-do-construtor), aos campos da entidade compatíveis com o tipo de chave primária configurado. |
| `Primitive` | União de tipos escalares (`string \| number \| boolean \| bigint \| symbol \| undefined \| null \| Date`) tratados como valores-folha — e não relações — ao percorrer o formato de uma entidade. | Usado por `Ordering<T>` para distinguir campos escalares de campos de relação. |

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

O `VSRepository` nunca fala diretamente com o ORM — ele só chama esses métodos com um `VSRepoWhere<T>` e um `AdapterMethodOptions<T>` já resolvidos. Uma vez que um adapter implemente esse contrato, todo método base, método dinâmico e query method passa a funcionar com ele automaticamente. Veja `src/adapters/prisma7/prisma7.adapter.ts` para uma implementação parcial de referência, e `src/adapters/typeorm.adapter.ts` para um parser de referência da cláusula `where`.

---

## Tratamento de erros

A v2 simplifica a hierarquia de erros da v1: em vez de várias subclasses, existe uma única classe `VSRepoError` carregando um campo `type: VSRepoErrorType`.

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

| `VSRepoErrorType` | Quando é lançado |
| --- | --- |
| `DECORATOR` | Argumentos inválidos foram passados para `@DynamicMethod` ou `@QueryMethod`. |
| `RESOLVER` | A biblioteca falhou ao resolver a configuração de um método dinâmico/de query em um método chamável (ex.: um nome de método desconhecido). |
| `DYNAMIC` | Um método dinâmico já resolvido falhou em tempo de execução (ex.: argumentos faltando). |
| `VALIDATOR` | Options ou argumentos de método inválidos foram detectados durante a validação. |
| `BASE` | Uso inválido de um método base (`get`, `save`, `remove`, etc). |

Erros lançados pelo próprio ORM por trás do adapter **não** são encapsulados em `VSRepoError` — eles se propagam como estão.

---

## Logging

Todo repository tem um logger interno, configurado via `logLevel` e `logSlowThresholdMs` nas options do construtor:

```typescript
import { VSLogLevel } from "vsrepo/internal/enums/vs-log-level.enum";

super({
    pkName: "id",
    adapter,
    logLevel: VSLogLevel.DEBUG,
    logSlowThresholdMs: 200,
});
```

| Nível | Significado |
| --- | --- |
| `DEBUG` | Detalhes internos verbosos, incluindo toda query resolvida — muito útil para debugar métodos dinâmicos. |
| `INFO` | Eventos de alto nível do ciclo de vida, como a inicialização do repository. |
| `WARN` (padrão) | Problemas recuperáveis e operações lentas (veja `logSlowThresholdMs`, padrão de 300ms). |
| `ERROR` | Falhas lançadas durante a execução de uma operação. |

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
- O pacote publicado contém **apenas** a pasta `dist/` além dos READMEs e da `LICENSE` (veja `files` no `package.json`). Fontes, testes, a pasta `v1/`, `generated/` e os protótipos `src/adapters/**` **não** são enviados — os adapters viverão em seus próprios pacotes `@vsrepo/*-adapter`.
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
- Pelo menos um `VSRepoAdapter` funcional para o seu banco — nenhum pacote `@vsrepo/*-adapter` foi publicado ainda, então por enquanto isso significa escrever o seu próprio ou adaptar um dos protótipos de referência em `src/adapters/` (veja [Status dos adapters](#status-dos-adapters))

---

## Contribuindo

Contribuições são bem-vindas, especialmente para finalizar os adapters do Prisma e do TypeORM! (**[Repositório do GitHub](https://github.com/jaobrabo123/VSRepository)**):

1. Faça um **Fork** do projeto.
2. Crie uma branch a partir de `v2` para sua alteração: `git checkout -b v2-minha-alteracao`.
3. Faça o push da sua branch: `git push origin v2-minha-alteracao`.
4. Abra um **Pull Request** contra a `v2`.

Para reportar problemas ou sugerir funcionalidades, abra uma **Issue**.
