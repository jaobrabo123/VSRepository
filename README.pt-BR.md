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

🇧🇷 Você está lendo a versão em português. [🇺🇸 Read in English](./README.md)

Biblioteca de repository pattern **agnóstica de ORM**, com suporte completo a **TypeScript** e **type inference** automático. O núcleo delega toda operação a um **adapter** plugável, permitindo que a mesma API de repository funcione com Prisma, Drizzle ou qualquer outro ORM/banco que implemente o contrato de adapter. Vindo da [v1](https://github.com/jaobrabo123/VSRepository/tree/v1)? Veja [Migrando da v1](./docs/migrating-from-v1.pt-BR.md).

O VSRepository permite criar repositories fortemente tipados com:

- **Métodos base** automáticos: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `merge`, `getAll`, `total`, `has`
- **Soft-delete nativo**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Métodos dinâmicos** inferidos a partir do nome de um campo `declare` via o decorador `@DynamicMethod`: `findOneByEmail`, `findByStatusPaginated`, `updateById`
- **Métodos de query SQL raw** através do decorador `@QueryMethod`, ignorando totalmente o engine de parsing por nome
- **`select`/`relations`** ad-hoc em cada chamada — sem mais projeções nomeadas pré-declaradas
- **Type safety** em 100% das operações
- **Transações** nativas do ORM, compartilhadas entre repositories
- Um **núcleo agnóstico de ORM** — a mesma classe de repository funciona com qualquer implementação de `VSRepoAdapter`

---

## Documentação

As seções abaixo (status dos adapters, instalação, uso básico) são o essencial para começar. Tudo sobre uma funcionalidade específica — com mais detalhe e mais exemplos — vive em um guia próprio dentro de [`docs/`](./docs/README.pt-BR.md), cada um disponível em português e em [English](./docs/README.md):

| Guia | Cobre |
| --- | --- |
| [Métodos base, configuração & soft-delete](./docs/base-methods.pt-BR.md) | Options do construtor, os 12 métodos CRUD automáticos, soft-delete nativo, e os 8 métodos atômicos/de agregação (`increment`, `sum`, ...). |
| [`select` e `relations`](./docs/select-and-relations.pt-BR.md) | Seleção de campos e carregamento de relações ad-hoc em qualquer chamada, e o `InferMethodReturn` para estreitar o tipo de retorno de acordo. |
| [Métodos dinâmicos](./docs/dynamic-methods.pt-BR.md) | Métodos no estilo `findByEmail`, resolvidos a partir de um nome de método `declare`d: prefixos, filtros de campo, operadores lógicos, filtros de relação, ordenação/paginação/distinct. |
| [Query methods (SQL raw)](./docs/query-methods.pt-BR.md) | Métodos de SQL raw via `@QueryMethod`, ignorando totalmente o parser de nomes dos métodos dinâmicos. |
| [Query builder](./docs/query-builder.pt-BR.md) | A API fluente `createQueryBuilder()` para queries montadas em tempo de execução, incluindo paginação, visibilidade de soft-delete e transações. |
| [Transações](./docs/transactions.pt-BR.md) | Rodando vários repositories na mesma transação nativa do ORM. |
| [Tipos utilitários](./docs/utility-types.pt-BR.md) | Os tipos utilitários exportados (`InferMethodType`, `InferMethodReturn`, `KeysOfType`, ...) e onde cada um é usado. |
| [Escrevendo seu próprio adapter](./docs/writing-an-adapter.pt-BR.md) | Como implementar o `VSRepoAdapter` para um novo ORM ou banco, método a método. |
| [Tratamento de erros](./docs/error-handling.pt-BR.md) | `VSRepoError`, `VSRepoErrorType`, e `VSRepoAdapterError`/`AdapterErrorCode`. |
| [Logging](./docs/logging.pt-BR.md) | `logLevel`, `logSlowThresholdMs`, e o formato de log usado pelo repository e pelo query builder. |
| [Migrando da v1](./docs/migrating-from-v1.pt-BR.md) | Tudo o que mudou entre a v1 e a v2 — API, config, sufixos renomeados, funcionalidades removidas — em uma única referência para migrar repositories existentes. |

---

## Status dos adapters

O VSRepository é **agnóstico de ORM por design**. O pacote core (`vsrepo`) traz apenas a classe de repository, os decoradores, o engine de parsing de nomes, o tratamento de erros e o logging — ele **não** inclui um adapter de produção. O suporte de fato a cada ORM/banco deve viver em **pacotes separados, versionados de forma independente**, um por ORM (e, quando fizer sentido, um por versão principal do ORM), por exemplo:

- `@vsrepo/prisma7-adapter`
- `@vsrepo/prisma8-adapter`
- `@vsrepo/typeorm-adapter`
- `@vsrepo/drizzle-adapter`

O adapter do Prisma 7 já foi publicado no npm como `@vsrepo/prisma7-adapter`. O adapter do Drizzle está disponível em versão **alpha** — instale com `npm i @vsrepo/drizzle-adapter@alpha`. Os adapters para outros ORMs estão **planejados**, mas ainda não foram publicados. Até que exista um pacote `@vsrepo/*-adapter` oficial para o seu ORM, você pode escrever o seu próprio para o seu projeto e, se quiser, publicá-lo e abrir um PR para ajudar a fazer o ecossistema crescer — contribuições nesse sentido são muito bem-vindas.

| Adapter                               | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma 7 (`@vsrepo/prisma7-adapter`)  | 🟢 **Lançado** — publicado no npm, implementa o contrato de `VSRepoAdapter` (CRUD, relations, transactions, `merge`, logging, etc.) com testes; veja o [`VSRepoPrisma7Adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) para o código-fonte e docs. |
| Drizzle (`@vsrepo/drizzle-adapter`)   | 🔵 **Alpha** — uma versão inicial já está disponível no npm; instale com `npm i @vsrepo/drizzle-adapter@alpha`. A API ainda pode mudar antes do release estável. Veja o repositório do [`DrizzleAdapter`](https://github.com/jaobrabo123/VSRepoDrizzleAdapter) para o estado atual e limitações conhecidas, e sinta-se à vontade para contribuir.                                                                                                                                                                                                                                                                                                                                                       |
| Outros ORMs (Prisma 8, TypeORM, etc.) | 🟡 **Planejados, ainda não publicados.** Nenhum pacote oficial existe ainda — por enquanto, escreva o seu próprio adapter (veja [Escrevendo seu próprio adapter](./docs/writing-an-adapter.pt-BR.md#escrevendo-seu-próprio-adapter)) e considere publicá-lo/contribuir de volta com o projeto.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Adapters customizados                 | 🟢 Totalmente suportados hoje — implemente você mesmo a classe abstrata [`VSRepoAdapter`](./docs/writing-an-adapter.pt-BR.md#escrevendo-seu-próprio-adapter) para qualquer ORM/banco que precisar, no seu próprio projeto ou pacote.                                                                                                                                                                                                                                                                                                                                                                                                                                           |

Resumindo: a classe de repository, os decoradores `@DynamicMethod`/`@QueryMethod`, o engine de parsing de nomes, o tratamento de erros e o logging já funcionam de ponta a ponta, e o suporte ao Prisma 7 é um adapter lançado e publicado. O adapter do Drizzle está disponível em alpha. Adapters oficiais para os demais ORMs estão no roadmap e serão distribuídos como pacotes `@vsrepo/*-adapter` separados, e não como parte do pacote core `vsrepo` — mas você não precisa esperar por isso: escrever (e opcionalmente publicar) o seu próprio adapter enquanto isso é uma forma totalmente suportada de usar o VSRepository hoje e de contribuir de volta com o projeto.

---

## Instalação

O VSRepository é instalado como o pacote core mais um pacote de adapter para o seu ORM, por exemplo:

```bash
npm i vsrepo @vsrepo/prisma7-adapter
```

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

> A API do core (`VSRepository`, `VSRepoAdapter`, `DynamicMethod`, `QueryMethod`, `VSRepoError`, enums e tipos) é importada do entry point único `vsrepo`. O adapter concreto vem de um pacote **separado** (`@vsrepo/*-adapter`). No Prisma 7, instale o [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter).

> **O terceiro generic (`OrmTypes`):** `VSRepository<Entity, PKType, OrmTypes>` aceita um terceiro type parameter opcional descrevendo os tipos de client/transaction do seu ORM, via `VSRepoOrmTypes` (`{ dbClient; dbTransaction }`). Ao fornecê-lo, `getDbClient()`, o callback de `transaction()` e a option `db` de todo método passam a ser tipados corretamente, em vez de `any`:
>
> ```typescript
> import { Prisma7OrmTypes } from "@vsrepo/prisma7-adapter";
> 
> type MyOrmTypes = Prisma7OrmTypes<PrismaClient>;
>
> class UserRepository extends VSRepository<User, string, MyOrmTypes> {
>     // getDbClient() agora retorna PrismaClient, e transaction(fn) tipa `tx` como Prisma.TransactionClient
> }
> ```
>
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

## Desenvolvimento

```bash
# 1. Instalar as dependências
bun install

# 2. Compilar os fontes TypeScript em dist/ (remove um dist/ anterior primeiro)
bun run build

# 3. (Opcional) Inspecionar o que seria publicado sem gerar um tarball
npm pack --dry-run

# 4. Gerar o tarball instalável (roda `prepack` -> `bun run build` automaticamente)
npm pack

# 5. Consumir localmente em outro projeto
npm install ../caminho/vsrepo-*.tgz
```

Observações:

- `bun run build` executa `tsc -p tsconfig.build.json`, que gera o JS compilado e as declarações de tipo em `dist/` com `rootDir: src`.
- O pacote publicado contém **apenas** a pasta `dist/`, os READMEs, o `CHANGELOG.md` e a `LICENSE` (veja `files` no `package.json`). Os adapters viverão em seus próprios pacotes `@vsrepo/*-adapter`.

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
- Pelo menos um `VSRepoAdapter` funcional para o seu banco — no Prisma 7, instale o [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) já publicado (veja [Status dos adapters](#status-dos-adapters)); adapters oficiais para outros ORMs estão planejados, mas ainda não publicados, então por enquanto isso significa escrever o seu próprio (veja [Escrevendo seu próprio adapter](./docs/writing-an-adapter.pt-BR.md#escrevendo-seu-próprio-adapter)) — e, se publicá-lo, contribuir de volta com o projeto é bem-vindo

---

## Contribuindo

Contribuições são bem-vindas, especialmente para melhorar o adapter do Prisma e finalizar o do Drizzle! (**[Repositório do GitHub](https://github.com/jaobrabo123/VSRepository)**):

1. Faça um **Fork** do projeto.
2. Crie uma branch para sua alteração: `git checkout -b minha-alteracao`.
3. Faça o push da sua branch: `git push origin minha-alteracao`.
4. Abra um **Pull Request**.

Para reportar problemas ou sugerir funcionalidades, abra uma **Issue**.
