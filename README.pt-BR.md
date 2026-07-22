# VSRepository

![npm](https://img.shields.io/npm/v/vsrepo?style=flat-square)
![NPM License](https://img.shields.io/npm/l/vsrepo?style=flat-square)
![NPM Downloads](https://img.shields.io/npm/dt/vsrepo?style=flat-square)

🇧🇷 Você está lendo a versão em português. [🇺🇸 Read in English](./README.md)

Biblioteca de repository pattern para projetos que usam **Prisma**, com suporte completo a **TypeScript** e **inferência de tipos** automática.

O VSRepository permite criar repositórios fortemente tipados com:

- **Métodos base** automáticos: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `patchList`, `merge`, `getAll`, `total`, `has`
- **Soft-delete nativo**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Métodos dinâmicos** inferidos pelo nome: `findOneByEmail`, `findManyPaginated`, `updateById`, `deleteManyByNameStartsWith`
- **Select models** reutilizáveis para diferentes projeções de dados
- **Type safety** em 100% das operações
- **Transações** nativas do Prisma (automáticas em `saveList` e `patchList`)
- **Extensibilidade** com métodos customizados

> 💡 Quer ver tudo isso na prática? A pasta [`examples/`](https://github.com/jaobrabo123/VSRepository/tree/main/examples) do repositório tem exemplos comentados e executáveis para cada funcionalidade — veja a seção [Exemplos práticos](#exemplos-práticos) mais abaixo.

---

## Sumário

- [Instalação](#instalação)
- [Gerando os tipos](#gerando-os-tipos)
- [Uso básico](#uso-básico)
- [Abordagem baseada em classes (DynamicRepository)](#abordagem-baseada-em-classes-dynamicrepository)
- [Integração com NestJS](#integração-com-nestjs)
- [Métodos base](#métodos-base)
  - [Soft-delete](#soft-delete)
  - [Operações em lote](#operações-em-lote)
  - [Merge](#merge)
  - [Configurando os métodos base](#configurando-os-métodos-base)
- [Select Models](#select-models)
- [Include Models](#include-models)
  - [Include bruto (options.include)](#include-bruto-optionsinclude)
- [Required Where](#required-where)
- [Ordenação padrão (Default Ordenation)](#ordenação-padrão-default-ordenation)
- [Opção `see`](#opção-see)
- [Métodos dinâmicos](#métodos-dinâmicos)
  - [Prefixos disponíveis](#prefixos-disponíveis)
  - [Filtros de campo](#filtros-de-campo)
  - [Operadores lógicos](#operadores-lógicos)
  - [Filtros de relação](#filtros-de-relação)
  - [Sufixos de paginação e ordenação](#sufixos-de-paginação-e-ordenação)
  - [Distinct](#distinct)
  - [Configuração de método](#configuração-de-método)
  - [Aggregate e GroupBy](#aggregate-e-groupby)
- [Relações no save](#relações-no-save)
- [Transações](#transações)
- [Estendendo um repositório](#estendendo-um-repositório)
- [Tratamento de erros](#tratamento-de-erros)
- [Tipos utilitários](#tipos-utilitários)
- [Referência da API](#referência-da-api)
- [Exemplos práticos](#exemplos-práticos)
- [Contribuindo](#contribuindo)
- [Requisitos](#requisitos)
- [Solução de problemas](#solução-de-problemas)

---

## Instalação

```bash
npm i vsrepo @prisma/client
```

Gere o Prisma Client:

```bash
npx prisma generate
```

---

## Gerando os tipos

O VSRepository precisa saber o caminho real do seu Prisma Client para gerar as tipagens corretamente.

```bash
npx vsrepo generate
```

Equivalente a:

```bash
npx vsrepo generate \
  --output generated/vsrepo \
  --prisma generated/prisma
```

**Flags disponíveis:**

| Flag       | Atalho | Padrão              |
| ---------- | ------ | -------------------- |
| `--output` | `-o`   | `generated/vsrepo`   |
| `--prisma` | `-p`   | `generated/prisma`   |

**Arquivos gerados:**

```
generated/vsrepo/
├── VSRepoError.ts
├── VSRepoError.types.d.ts
├── VSRepository.ts
├── VSRepository.types.d.ts
└── index.ts
```

Depois de gerar, sempre importe a partir da pasta gerada:

```ts
// CORRETO ✅
import { setupVSRepo } from "../../generated/vsrepo";

// ERRADO ❌
import { setupVSRepo } from "vsrepo";
```

---

## Uso básico

### Configurando o Prisma Client

```ts
// src/configs/db.ts
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export default prisma;
```

### Criando um repositório

```ts
// src/repositories/userRepository.ts
import prisma from "../configs/db";
import { setupVSRepo } from "../../generated/vsrepo";
import type { User } from "../../generated/prisma/client";

const userRepository = setupVSRepo<User, "User">()(({
  tableName: "user",
  pkName: "id",
  selectModels: {
    public: { id: true, name: true, email: true },
  },
  defaultSelectModel: "public",
}).build(prisma);

export default userRepository;
```

### Usando o repositório

```ts
import userRepository from "./repositories/userRepository";

const user = await userRepository.save({
  name: "John",
  email: "john@email.com",
  password: "password",
});

const found = await userRepository.get(user.id);
const all = await userRepository.getAll();

user.name = "John Smith";

await userRepository.save(user);
await userRepository.remove(user.id);
```

---

## Abordagem baseada em classes (DynamicRepository)

Se você prefere um estilo OOP com decorators em vez da abordagem funcional `setupVSRepo`, o VSRepository também oferece `DynamicRepository` — uma classe que você pode estender com decorators `@DynamicMethod()` para definir seus métodos dinâmicos.

Veja **[README-DynamicRepo.pt-BR.md](./README-DynamicRepo.pt-BR.md)** para a documentação completa da abordagem baseada em classes, incluindo exemplos de integração com NestJS, configuração de decorators e uma comparação com o `setupVSRepo`.

---

## Integração com NestJS

O VSRepository pode ser facilmente integrado a projetos NestJS através de providers. Abaixo está um exemplo completo usando o padrão de injeção de dependência do NestJS.

### Configurando o repositório como provider

```ts
// src/modules/user/user.repository.ts
import { Provider } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { UserGetPayload } from "../../../generated/prisma/models";
import { setupVSRepo } from "../../../generated/vsrepo";

const userVSRepo = setupVSRepo<
    UserGetPayload<{ include: { profile: true } }>,
    "User"
>()(({
    tableName: "user",
    pkName: "id",
    selectModels: {
        public: {
            id: true,
            email: true,
            createdAt: true,
            updatedAt: true,
        },
        auth: {
            id: true,
            email: true,
            password: true,
        },
    },
    defaultSelectModel: "public",
    requiredWhere: {
        deletedAt: null,
    },
    relations: {
        profile: {
            mode: "oto",
            pk: "id",
            restriction: "add",
        },
    },
    methods: {
        findAuthByEmail: {
            map: true,
            proxyTo: "findUniqueByEmail",
            selectModel: "auth",
        },
        findByEmailEndsWith: {
            map: true,
        }
    },
});

const setupUserRepository = (prisma: PrismaService) => {
    return userVSRepo.build(prisma);
};

export type UserRepository = ReturnType<typeof setupUserRepository>;
/* 
O tipo também pode ser inferido usando o `RepositoryOf` do VSRepository, passando o tipo de `userVSRepo`:

export type UserRepository = RepositoryOf<typeof userVSRepo>;

OBS: Se você usar `.extend` para estender o repositório ou configurar os métodos base,
usar `ReturnType` é recomendado por ser mais simples de inferir o tipo
*/

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export const UserRepositoryProvider: Provider = {
    provide: USER_REPOSITORY,
    inject: [PrismaService],
    useFactory: setupUserRepository,
};
```

### Registrando o provider no módulo

```ts
// src/modules/user/user.module.ts
import { Module } from "@nestjs/common";
import { UserRepositoryProvider } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
    imports: [DatabaseModule],
    providers: [UserRepositoryProvider, UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
```

### Usando o repositório em um service

```ts
// src/modules/user/user.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "./user.repository";

@Injectable()
export class UserService {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: UserRepository,
    ) {}

    async getUserById(id: string) {
        return this.userRepository.get(id);
    }

    async getUserAuthByEmail(email: string) {
        return this.userRepository.findAuthByEmail(email);
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

**Benefícios dessa abordagem:**

- ✅ Repositórios type-safe com injeção de dependência
- ✅ Fácil de testar (mock do `USER_REPOSITORY`)
- ✅ Isolamento da lógica de persistência
- ✅ Reuso do repositório em múltiplos services
- ✅ Suporte a transações via `PrismaService`

---

## Métodos base

Ao chamar `.build(prisma)`, os métodos base abaixo ficam automaticamente disponíveis:

| Método                    | Descrição                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------|
| `get(pk)`                 | Busca um registro pela sua chave primária                                                                     |
| `getOrThrow(pk)`          | Busca um registro pela sua chave primária; lança `VSRepoRuntimeError` (código `"20727"`) se não for encontrado |
| `getList(pks)`            | Busca múltiplos registros a partir de uma lista de chaves primárias                                            |
| `save(obj)`               | Cria ou atualiza — se o objeto tiver uma `pk`, realiza um `upsert`; caso contrário, um `create`                |
| `saveList(objs)`          | Salva um array de objetos em uma única transação automática                                                    |
| `patch(pk, obj)`          | Atualiza parcialmente um registro pela sua chave primária                                                      |
| `patchList(tuples)`       | Atualiza parcialmente múltiplos registros via um array de tuplas `[pk, obj]` em uma transação automática        |
| `merge(pk, obj)`          | Busca um registro e faz um deep merge em memória — **não persiste**, retorna o objeto mesclado                 |
| `remove(pk)`              | Remove um registro pela sua chave primária                                                                     |
| `removeList(pks)`         | Remove vários registros a partir de uma lista de chaves primárias — retorna `{ count }`                         |
| `getAll()`                | Retorna todos os registros (aceita `pagination` e `order` em `options`)                                        |
| `total()`                 | Retorna o número total de registros                                                                            |
| `has(pk)`                 | Verifica se um registro existe pela sua chave primária — retorna `boolean`                                     |

Todos eles aceitam `options` como último argumento.

### Soft-delete

Quando `softRemovekName` está configurado no repositório, os métodos adicionais abaixo ficam disponíveis:

| Método                      | Descrição                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------|
| `softRemove(pk)`            | Marca um registro como removido, preenchendo `softRemovekName` com a data atual        |
| `softRemoveList(pks)`       | Marca múltiplos registros como removidos em lote — retorna `{ count }`                  |
| `restore(pk)`               | Restaura um registro com soft-delete, limpando o campo `softRemovekName`                |
| `restoreList(pks)`          | Restaura múltiplos registros com soft-delete em lote — retorna `{ count }`              |

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  softRemovekName: "deletedAt", // deve ser um campo DateTime no schema do Prisma
}).build(prisma);

await userRepository.softRemove(1);
await userRepository.restore(1);
```

> O campo informado em `softRemovekName` **deve** ser do tipo `DateTime` no schema do Prisma. O VSRepository valida isso no momento do `build` e lança `VSRepoBuildError` se o tipo estiver incorreto.

### Operações em lote

`saveList` e `patchList` executam automaticamente todas as operações dentro de uma única transação do Prisma. Se alguma operação falhar, todas as anteriores são desfeitas (rollback).

```ts
// saveList — cria ou atualiza múltiplos objetos em uma transação automática
const users = await userRepository.saveList([
  { name: "Mary", email: "mary@email.com" },
  { id: 2, name: "John Updated", email: "john@email.com" },
]);

// patchList — atualiza parcialmente múltiplos registros via tuplas [pk, obj]
const updated = await userRepository.patchList([
  [1, { active: false }],
  [2, { name: "New Name" }],
]);
```

Quando você já está dentro de uma transação existente, passe-a em `options.db`. Nesse caso, `db` deve ser um `DbTransaction` (não o client principal):

```ts
await prisma.$transaction(async (tx) => {
  await userRepository.saveList([{ name: "Mary" }, { name: "Gus" }], { db: tx });
  await userRepository.patchList([[1, { active: false }], [2, { active: true }]], { db: tx });
});
```

### Merge

O método `merge` busca um registro pela PK e faz um deep merge (`deepmerge`) do objeto informado com os dados existentes **em memória**. Ele **não persiste** as alterações — retorna o resultado mesclado para que você decida o que fazer com ele.

```ts
const existing = await userRepository.get(1);
// existing: { id: 1, name: "Mary", profile: { bio: "Hi", age: 25 } }

const merged = await userRepository.merge(1, {
  profile: { bio: "Updated bio" },
});
// merged: { id: 1, name: "Mary", profile: { bio: "Updated bio", age: 25 } }

// Para persistir, passe para save ou patch:
await userRepository.save(merged);
```

Retorna `null` se o registro não for encontrado.

**O merge de relações to-many (`otm`/`mtm`) é feito por PK, não por simples concatenação.** Para relações to-one (`oto`/`mto`), o `merge` faz um deep merge comum do objeto. Para relações to-many, cada item do array enviado é comparado com o item existente que tem a mesma PK (definida em `relations[key].pk`): se a PK bater, os dois objetos são mesclados; se não bater (um item novo, sem correspondente), ele é simplesmente adicionado à lista. Itens existentes que não aparecem no array enviado são mantidos.

```ts
const existing = await userRepository.get(1);
// existing: {
//   id: 1,
//   posts: [
//     { id: 10, title: "Post A", published: false },
//     { id: 11, title: "Post B", published: true },
//   ],
// }

const merged = await userRepository.merge(1, {
  posts: [
    { id: 10, published: true },  // mesma PK (id: 10) → mescla com o item existente
    { title: "Post C" },          // sem PK → adicionado como novo item
  ],
});
// merged: {
//   id: 1,
//   posts: [
//     { id: 10, title: "Post A", published: true },  // mesclado
//     { id: 11, title: "Post B", published: true },  // mantido, não estava no array enviado
//     { title: "Post C" },                            // adicionado
//   ],
// }
```

> Observe que o `merge` nunca remove itens de uma relação to-many — ele apenas mescla os que batem por PK e adiciona os que não batem. Para remover itens de uma relação, use `save`/`patch` com `restriction: "set"` na configuração da relação.

### Configurando os métodos base

O segundo argumento de `.build(prisma, config)` permite ajustar o comportamento global do repositório e customizar cada método base individualmente através de `baseMethods`.

```ts
userVSRepo.build(prisma, {
  // Exibe os logs internos do VSRepository no console (queries montadas, prefixo
  // detectado, filtros aplicados, etc). Ótimo para debugar métodos dinâmicos. Padrão = false.
  showWorking: true,

  baseMethods: {
    get: {
      // Habilita/desabilita o método no repositório final. Se `false`, o método
      // nem aparece no tipo do repositório (não é apenas um erro em runtime). Padrão = true.
      active: true,

      // Select model aplicado por padrão quando o método é chamado sem `options.selectModel`.
      // Sobrescreve o `defaultSelectModel` de setupVSRepo apenas para este método.
      defaultSelect: "public",
    },
    remove: {
      active: true,
      defaultSelect: "minimal",

      // Quando `true`, ignora o `requiredWhere` configurado em setupVSRepo para
      // este método específico — útil quando um método precisa "furar" um
      // filtro global (ex: multi-tenancy) em um caso específico. Padrão = false.
      ignoreRequiredWhere: false,
    },
    save: {
      // Aqui apenas `ignoreRequiredWhere` é definido — `active` e `defaultSelect`
      // mantêm seus padrões (true e o `defaultSelectModel` global).
      ignoreRequiredWhere: true,
    },
    patch: {
      // Apenas o select é sobrescrito; o método continua ativo normalmente.
      defaultSelect: "minimal",
    },
    has: {
      active: false, // Desabilita 'has' (padrão = true) — o método desaparece do repositório
    },
    softRemove: {
      // Métodos de soft-delete seguem as mesmas opções (`active`, `defaultSelect`,
      // `ignoreRequiredWhere`). Só estão disponíveis se `softRemovekName` estiver configurado.
      active: true,
      defaultSelect: "minimal",
    },
  },
});
```

> Métodos de lote/agregação como `removeList`, `softRemoveList`, `restoreList`, `total` e `has` **não** aceitam `defaultSelect` (eles não retornam um registro selecionável — retornam `{ count }` ou `boolean`). Nesses casos, `BaseMethodConfig` fica restrito a `active` e `ignoreRequiredWhere`.

---

## Select Models

`selectModels` define projeções de dados nomeadas e reutilizáveis.

```ts
selectModels: {
  public:   { id: true, name: true, email: true },
  internal: { id: true, name: true, email: true, password: true },
  minimal:  { id: true },
},
defaultSelectModel: "public",
```

`defaultSelectModel` define qual select é usado automaticamente quando nenhum é especificado na chamada. É recomendado sempre defini-lo junto com `selectModels`.

**Usando um select específico na chamada:**

```ts
const user = await userRepository.get(id, { selectModel: "minimal" });
```

**Retornando o payload padrão do Prisma (sem select):**

```ts
const fullUser = await userRepository.get(id, { selectModel: false });
```

---

## Include Models

`includeModels` funciona de forma parecida com `selectModels`, mas em vez de receber um `select`, recebe um `include` válido do Prisma.

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  selectModels: {
    public: { id: true, name: true, email: true },
  },
  defaultSelectModel: "public",
  includeModels: {
    withPosts: { posts: true },
    withPostsAndProfile: { posts: true, profile: true },
  },
}).build(prisma);
```

**Usando um `includeModel` na chamada:**

```ts
const user = await userRepository.get(id, { includeModel: "withPosts" });
```

Nesse caso, o `select` padrão (`selectModels`/`defaultSelectModel`) é ignorado e apenas o `include` é enviado ao Prisma.

### Diferenças em relação a `selectModels`

- **Só pode ser passado na chamada do método**, via `options.includeModel`. Não existe `defaultIncludeModel` ou `defaultInclude` — não há como configurar um `includeModel` padrão no repositório, ao contrário do que acontece com `defaultSelectModel`.
- **`includeModel` e `selectModel` não podem ser passados juntos** na mesma chamada. Se um `includeModel` for informado, qualquer `selectModel` (incluindo o padrão) é ignorado.

```ts
// CORRETO ✅ — apenas includeModel
await userRepository.get(id, { includeModel: "withPosts" });

// CORRETO ✅ — apenas selectModel
await userRepository.get(id, { selectModel: "public" });

// ERRADO ❌ — combinar os dois não é permitido
await userRepository.get(id, { selectModel: "public", includeModel: "withPosts" });
```

### Include bruto (`options.include`)

Além do `includeModel` (nomeado, pré-configurado em `includeModels`), você pode passar um `include` bruto do Prisma diretamente na chamada, sem precisar registrá-lo antes no repositório.

```ts
const user = await userRepository.get(id, {
  include: { posts: true, profile: true },
});
```

`options.include` aceita qualquer `include` válido para o modelo Prisma do repositório — é totalmente tipado e oferece o mesmo autocomplete/validação de chamar `prisma.user.findMany({ include: ... })` diretamente.

**Regras e comportamento:**

- **Mutuamente exclusivo com `selectModel` e `includeModel`.** Apenas um dos três pode ser informado por chamada; os tipos garantem isso — passar mais de um é um erro em tempo de compilação.
- **Ad hoc, não reutilizável.** Diferente do `includeModel`, não precisa ser declarado em `includeModels`. Use para includes pontuais que não justificam um model nomeado.
- **Nenhum `selectModel` padrão é aplicado.** Assim como com `includeModel`, quando `include` é informado, o select (incluindo `defaultSelectModel`) é ignorado e apenas o `include` é enviado ao Prisma.

```ts
// CORRETO ✅ — apenas include bruto
await userRepository.get(id, { include: { posts: true } });

// ERRADO ❌ — combinar include com selectModel/includeModel não é permitido
await userRepository.get(id, { selectModel: "public", include: { posts: true } });
await userRepository.get(id, { includeModel: "withPosts", include: { posts: true } });
```

> **Quando usar `includeModel` vs. `include`:** prefira `includeModel` para includes reutilizados em várias chamadas (definidos uma vez em `includeModels`); use `include` para includes específicos e pontuais que não precisam de um nome.

---

## Required Where

`requiredWhere` define filtros que são aplicados automaticamente em toda query do repositório.

```ts
requiredWhere: { active: true },
```

Agora toda query vai incluir automaticamente `active: true`:

```ts
// Internamente: WHERE active = true
const users = await userRepository.findMany();

// Internamente: WHERE email = 'john@email.com' AND active = true
const user = await userRepository.findByEmail("john@email.com");
```

Útil para soft-deletes manuais, multi-tenancy e filtros globais de qualquer tipo.

---

## Ordenação padrão (Default Ordenation)

`defaultOrdenation` define uma ordenação padrão que é aplicada automaticamente em toda query que aceita `orderBy`, sem precisar repetir o argumento `order` em cada chamada.

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  defaultOrdenation: { createdAt: "desc" },
}).build(prisma);
```

Com isso, toda query de listagem já virá ordenada por `createdAt` decrescente:

```ts
// Internamente: ORDER BY createdAt DESC
const users = await userRepository.getAll();

// Também se aplica ao getAll com paginação
const paginated = await userRepository.getAll({ pagination: { take: 10 } });
```

**`defaultOrdenation` é ignorado quando:**

- O método usa o sufixo `Ordered`, `OrderedAndPaginated` ou `PaginatedAndOrdered` — nesses casos, o argumento `order` passado na chamada tem prioridade.
- O método dinâmico tem `injectOrdenation` configurado — a ordenação fixa do método tem precedência.

```ts
methods: {
  findManyPaginatedAndOrdered: { map: true },         // order vem do argumento → defaultOrdenation ignorado
  findManyByActive:            { map: true },         // sem Ordered → defaultOrdenation aplicado
  findManyByStatus: {
    map: true,
    injectOrdenation: { name: "asc" },                // injectOrdenation → defaultOrdenation ignorado
  },
}
```

> `defaultOrdenation` aceita o mesmo tipo do `orderBy` nativo do Prisma para o modelo — incluindo arrays de ordenações encadeadas.

---

## Opção `see`

Quando `softRemovekName` está configurado, todo método aceita a opção `see` para controlar a visibilidade de registros com soft-delete:

| Valor       | Comportamento                                                  |
| ----------- | -----------------------------------------------------------------|
| `"active"`  | Retorna apenas registros que **não** foram removidos (padrão)   |
| `"removed"` | Retorna apenas registros removidos                               |
| `"all"`     | Retorna todos os registros, independente do status               |

```ts
// Retorna apenas usuários ativos (padrão)
const active = await userRepository.getAll();

// Retorna apenas usuários removidos
const removed = await userRepository.getAll({ see: "removed" });

// Retorna todos
const all = await userRepository.getAll({ see: "all" });
```

> A opção `see` funciona independentemente do `requiredWhere` — ela é aplicada em cima do filtro de soft-delete, não como substituta dele.

---

## Métodos dinâmicos

Métodos dinâmicos são definidos na propriedade `methods` e têm seu comportamento inferido pelo nome.

```ts
methods: {
  findOneByEmail:     { map: true },
  findManyPaginated:  { map: true },
  updateById:         { map: true },
  deleteManyByIdIn:   { map: true },
}
```

---

### Prefixos disponíveis

O prefixo do nome do método determina qual operação do Prisma será chamada e quais argumentos são esperados.

| Prefixo                      | Operação do Prisma          | Retorno                  | Observações                                                                |
| ---------------------------- | ---------------------------- | ------------------------ | -----------------------------------------------------------------------------|
| `findOneBy`                  | `findFirst`                  | `T \| null`               | Retorno único.                                                               |
| `findBy`                     | `findMany` / `findFirst`     | `T[]` ou `T \| null`      | Padrão é lista; use `fbMode: "one"` para retorno único (**deprecated**, use `findOneBy`) |
| `findUniqueBy`                | `findUnique`                  | `T \| null`               |                                                                               |
| `findUniqueOrThrowBy`         | `findUniqueOrThrow`           | `T`                        | Lança um erro se não encontrado                                              |
| `findFirstBy`                 | `findFirst`                   | `T \| null`               | Aceita campos como filtro                                                    |
| `findFirstOrThrowBy`          | `findFirstOrThrow`            | `T`                        | Aceita campos como filtro; lança um erro se não encontrado                    |
| `findFirst`                   | `findFirst`                   | `T \| null`               | Sem filtros de campo; aplica apenas `requiredWhere` e `pushWhere`             |
| `findFirstOrThrow`            | `findFirstOrThrow`            | `T`                        | Sem filtros de campo; aplica apenas `requiredWhere` e `pushWhere`; lança um erro se não encontrado |
| `findManyBy`                  | `findMany`                    | `T[]`                      | Aceita campos como filtro                                                    |
| `findMany`                    | `findMany`                    | `T[]`                      | Sem filtros de campo; aplica apenas `requiredWhere` e `pushWhere`             |
| `findOneWhere`                 | `findFirst`                   | `T \| null`               | Recebe um objeto `where` explícito como argumento                            |
| `findListWhere`                | `findMany`                    | `T[]`                      | Recebe um objeto `where` explícito como argumento                            |
| `existsBy`                     | `findFirst`                   | `boolean`                  | Retorna `true` se encontrado, `false` caso contrário                         |
| `existsWhere`                  | `findFirst`                   | `boolean`                  | Recebe um objeto `where` explícito e retorna se existe                       |
| `countBy`                      | `count`                        | `number`                   | Aceita campos como filtro                                                    |
| `countWhere`                   | `count`                        | `number`                   | Recebe um objeto `where` explícito como argumento                            |
| `count`                        | `count`                        | `number`                   | Sem filtros de campo; aplica apenas `requiredWhere` e `pushWhere`             |
| `create`                       | `create`                        | `T`                         | Recebe `data` como argumento                                                 |
| `createMany`                   | `createMany`                    | `{ count: number }`        | Recebe `data` como argumento; suporta `SkipDuplicates`                       |
| `createManyAndReturn`          | `createManyAndReturn`           | `T[]`                       | Recebe `data` como argumento; suporta `SkipDuplicates`                       |
| `updateBy`                     | `update`                         | `T`                         | Recebe `data` como argumento                                                 |
| `updateManyBy`                 | `updateMany`                     | `{ count: number }`        | Recebe `data` como argumento                                                 |
| `updateManyWhere`              | `updateMany`                     | `{ count: number }`        | Recebe um objeto `where` e um objeto `data` como argumentos                  |
| `updateManyAndReturnBy`        | `updateManyAndReturn`            | `T[]`                       | Recebe `data` como argumento                                                 |
| `updateManyAndReturnWhere`     | `updateManyAndReturn`            | `T[]`                       | Recebe um objeto `where` e um objeto `data` como argumentos                  |
| `upsertBy`                     | `upsert`                          | `T`                         | Recebe `update` e `create` como argumentos                                   |
| `deleteBy`                     | `delete`                          | `T`                         |                                                                                |
| `deleteManyBy`                 | `deleteMany`                      | `{ count: number }`        |                                                                                |
| `deleteManyWhere`              | `deleteMany`                      | `{ count: number }`        | Recebe um objeto `where` explícito como argumento                            |
| `aggregate`                    | `aggregate`                        | `Dynamic`                   | O nome deve ser exato; recebe argumentos nativos do Prisma; ignora `selectModels`, `pushWhere` e `requiredWhere` |
| `groupBy`                      | `groupBy`                          | `Dynamic[]`                 | O nome deve ser exato; recebe argumentos nativos do Prisma; ignora `selectModels`, `pushWhere` e `requiredWhere` |

---

### Filtros de campo

Filtros são sufixos aplicados ao nome do campo dentro do método. O próprio campo vem capitalizado logo após o prefixo (ou após `By`).

| Sufixo                | Operador Prisma        | Argumento obrigatório       |
| ---------------------- | ----------------------- | -----------------------------|
| *(sem sufixo)*         | igualdade (`=`)          | sim                          |
| `Not`                  | `not`                     | sim                          |
| `In`                   | `in`                      | sim (array)                  |
| `NotIn`                | `notIn`                   | sim (array)                  |
| `Contains`             | `contains`                | sim                          |
| `NotContains`          | `not.contains`            | sim                          |
| `StartsWith`           | `startsWith`              | sim                          |
| `NotStartsWith`        | `not.startsWith`          | sim                          |
| `EndsWith`             | `endsWith`                | sim                          |
| `NotEndsWith`          | `not.endsWith`            | sim                          |
| `GreaterThan`          | `gt`                       | sim                          |
| `GreaterThanEqual`     | `gte`                      | sim                          |
| `LessThan`             | `lt`                       | sim                          |
| `LessThanEqual`        | `lte`                      | sim                          |
| `Between`              | `gte` + `lte`              | sim (tupla `[min, max]`)      |
| `NotBetween`           | `not.gte` + `not.lte`      | sim (tupla `[min, max]`)      |
| `IsNull`               | `null`                     | não                          |
| `IsNotNull`            | `not: null`                | não                          |
| `IsTrue`               | `true`                     | não                          |
| `IsFalse`              | `false`                    | não                          |
| `Insensitive`          | `mode: 'insensitive'`      | combinador                   |

`Insensitive` é um combinador e pode ser usado junto com outro filtro de texto:

```ts
findByNameContainsInsensitive    // { name: { contains: value, mode: 'insensitive' } }
findByEmailStartsWithInsensitive // { email: { startsWith: value, mode: 'insensitive' } }
findByNameInsensitive            // { name: { equals: value, mode: 'insensitive' } }
```

`Between` e `NotBetween` recebem uma **tupla `[valorMinimo, valorMaximo]`**:

```ts
methods: {
  findManyByAgeBetween:      { map: true },
  findManyBySalaryNotBetween: { map: true },
  findManyByCreatedAtBetween: { map: true },
}

await userRepository.findManyByAgeBetween([18, 65]);
await userRepository.findManyBySalaryNotBetween([1000, 5000]);
await userRepository.findManyByCreatedAtBetween([new Date("2024-01-01"), new Date("2024-12-31")]);
```

O sufixo `Optional` pode ser adicionado a qualquer campo para tornar o argumento opcional:

```ts
findByNameOptionalAndEmail // name é opcional, email é obrigatório
```

---

### Operadores lógicos

| Operador  | Uso no nome                      | Exemplo                            |
| --------- | ---------------------------------- | -------------------------------------|
| `And`     | entre dois campos                   | `findOneByIdAndEmail`                |
| `Or`      | entre dois campos                   | `findByNameOrEmail`                  |
| `AND`     | separa um bloco final de `AND`      | `findByEmailOrNameANDActiveStatus`   |

`AND` (em maiúsculas) tem uma regra específica:

- Só pode existir **um** `AND` por método.
- Todos os campos depois do `AND` são injetados dentro de `AND: []`.
- Depois de um `AND`, não pode haver um `Or`.

Exemplo:

```ts
methods: {
  findOneByIdAndEmail:   { map: true },
  findByNameOrEmail:  { map: true },
  findFirstByIdOrEmailAndName: { map: true },
  findByEmailOrNameANDActiveStatusAndAgeGreaterThan: { map: true }
}

await userRepository.findOneByIdAndEmail(1, "john@email.com");
await userRepository.findByNameOrEmail("John", "john@email.com");
await userRepository.findFirstByIdOrEmailAndName(1, "john@email.com", "John");
await userRepository.findByEmailOrNameANDActiveStatusAndAgeGreaterThan("john@email.com", "John", true, 17)
```

Gera (`findOneByIdAndEmail`):

```ts
{
  id: 1,
  email: "john@email.com"
}
```

Gera (`findByNameOrEmail`):

```ts
{
  OR: [
    { name: "John" },
    { email: "john@email.com" }
  ]
}
```

Gera (`findFirstByIdOrEmailAndName`):

```ts
{
  OR: [
    { id: 1 },
    {
      email: "john@email.com",
      name: "John"
    }
  ]
}
```

Gera (`findByEmailOrNameANDActiveStatusAndAgeGreaterThan`):

```ts
{
  OR: [
    { email: "john@email.com" },
    { name: "John" }
  ],
  AND: [
    { activeStatus: true },
    { age: { gt: 17 } }
  ]
}
```

---

### Filtros de relação

Permitem filtrar por campos de modelos relacionados.

> [!IMPORTANT]
> - **Tipagem de relação**: Para que o TypeScript reconheça os tipos dos campos de relação nos métodos dinâmicos, o tipo genérico da entidade passado para `setupVSRepo` deve incluir as relações estruturadas (ex.: usando o `UserGetPayload<{ include: { profile: true, posts: true } }>` do Prisma).
> - **Compatibilidade de sufixos**:
>   - Os sufixos `Some`, `Every` e `None` só funcionam em relações **to-many** (`many-to-many` e `one-to-many`).
>   - Os sufixos `With` e `Without` só funcionam em relações **to-one** (`one-to-one` e `many-to-one`).

| Sufixo de relação        | Operador Prisma  | Observação                                              |
| -------------------------- | ----------------- | ---------------------------------------------------------|
| `Some`                     | `some: {}`          | A relação tem *algum* registro                            |
| `SomeField`                | `some.field`        | Filtra dentro dos registros da relação                    |
| `EveryField`               | `every.field`       | Filtra dentro dos registros da relação                    |
| `None`                     | `none: {}`          | A relação não tem *nenhum* registro                        |
| `NoneField`                | `none.field`        | Filtra dentro dos registros da relação                    |
| `With`                     | `is: {}`            | A relação existe (não é nula)                              |
| `WithField`                | `is.field`          | Filtra um campo dentro da relação                          |
| `Without`                  | `isNot: {}`         | A relação não existe (é nula)                              |
| `WithoutField`             | `isNot.field`       | Filtra um campo dentro da relação com negação              |

Considerando `user` com uma relação to-one `profile` e uma relação to-many `posts`:

```ts
methods: {
  // to-many (posts)
  findByPostsSome:                { map: true }, // tem pelo menos um post
  findByPostsSomeTitle:           { map: true }, // tem pelo menos um post com aquele título
  findByPostsEveryPublishedIsTrue:{ map: true }, // todos os posts estão publicados
  findByPostsNone:                { map: true }, // não tem nenhum post
  findByPostsNoneTitle:           { map: true }, // nenhum post tem aquele título

  // to-one (profile)
  findByProfileWith:             { map: true }, // tem um profile (não é nulo)
  findByProfileWithBio:          { map: true }, // tem um profile com aquela bio
  findByProfileWithout:          { map: true }, // não tem profile (é nulo)
  findByProfileWithoutBio:       { map: true }, // tem um profile, mas com uma bio diferente da informada
}

await userRepository.findByPostsSome();
await userRepository.findByPostsSomeTitle("My first post");
await userRepository.findByPostsEveryPublishedIsTrue();
await userRepository.findByPostsNone();
await userRepository.findByPostsNoneTitle("Draft");

await userRepository.findByProfileWith();
await userRepository.findByProfileWithBio("Hello, world!");
await userRepository.findByProfileWithout();
await userRepository.findByProfileWithoutBio("Old bio");
```

Gera (`findByPostsSomeTitle`):

```ts
{
  posts: {
    some: { title: "My first post" }
  }
}
```

Gera (`findByPostsEveryPublishedIsTrue`):

```ts
{
  posts: {
    every: { published: true }
  }
}
```

Gera (`findByProfileWithBio`):

```ts
{
  profile: {
    is: { bio: "Hello, world!" }
  }
}
```

Gera (`findByProfileWithout`):

```ts
{
  profile: {
    isNot: {}
  }
}
```

> `Some`, `None`, `With` e `Without` (sem campo) não recebem argumento — toda a relação é testada quanto à existência de registros (`some`/`none`) ou quanto a ser `null`/não `null` (`is`/`isNot`). As variantes `SomeField`, `EveryField`, `NoneField`, `WithField` e `WithoutField` recebem como argumento o valor do campo filtrado.

---

### Sufixos de paginação e ordenação

Aplicados no **final** do nome do método, injetam automaticamente os argumentos de paginação e ordenação.

| Sufixo                   | Argumentos adicionais            |
| -------------------------- | ----------------------------------|
| `Paginated`                 | `(pagination)`                     |
| `Ordered`                   | `(order)`                          |
| `OrderedAndPaginated`       | `(order, pagination)`              |
| `PaginatedAndOrdered`       | `(pagination, order)`              |

Para `createMany` e `createManyAndReturn`, o sufixo `SkipDuplicates` está disponível:

| Sufixo               | Efeito                                       |
| --------------------- | -----------------------------------------------|
| `SkipDuplicates`       | Ignora registros duplicados durante a inserção  |

---

### Distinct

O sufixo `Distinct` permite obter apenas registros únicos com base em um ou mais campos, equivalente à opção `distinct` do Prisma.

Para usá-lo, coloque `Distinct` no nome do método (depois dos filtros de campo, se houver), seguido dos campos desejados separados por `And`. A primeira letra de cada campo deve ser maiúscula, assim como nos filtros de campo comuns.

```ts
methods: {
    // Retorna usuários únicos combinando "age" e "role" (sem filtro de campo)
    findManyDistinctAgeAndRole: { map: true },

    // Distinct combinado com o sufixo Paginated
    findManyDistinctNamePaginated: { map: true },

    // Distinct combinado com um filtro de campo (name) — filtra por name e depois aplica distinct em role
    findManyByNameDistinctRole: { map: true },
},
```

```ts
// Sem argumentos: os campos distinct já estão fixados no nome do método
await userRepository.findManyDistinctAgeAndRole();

// O argumento de paginação continua funcionando normalmente
await userRepository.findManyDistinctNamePaginated({ take: 10, skip: 0 });

// O filtro do campo "name" continua sendo passado normalmente como argumento
await userRepository.findManyByNameDistinctRole("John");
```

> Os campos especificados depois de `Distinct` são resolvidos a partir do nome do método em tempo de build — eles **não** se tornam argumentos em tempo de execução, diferente dos filtros de campo comuns.

`Distinct` está disponível nos prefixos que leem múltiplos ou um único registro: `findMany`, `findManyBy`, `findFirst`, `findFirstBy`, `findFirstOrThrow`, `findFirstOrThrowBy`, `findBy`, `findOneBy`, `findWhere`, `findOneWhere`, `findListWhere`, `existsBy` e `existsWhere`.

---

### Configuração de método

Cada entrada em `methods` aceita as seguintes opções:

| Opção                 | Tipo                              | Padrão         | Descrição                                                                                                        |
| ---------------------- | ----------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------|
| `map`                   | `boolean`                            | —                | **Obrigatório.** Define se o método será exposto no repositório.                                                    |
| `whereType`             | `'extending'` \| `'overwrite'`       | `extending`      | `extending` combina com `requiredWhere`. `overwrite` ignora `requiredWhere`.                                        |
| `selectModel`           | `keyof SelectModels \| false`        | —                | Sobrescreve o `defaultSelectModel` para este método.                                                                 |
| `fbMode`                | `'one'` \| `'list'`                  | `'list'`         | (**Deprecated. Use `findOneBy`**) Apenas para `findBy`. `'one'` retorna `T \| null`; `'list'` retorna `T[]`.        |
| `proxyTo`               | `Padrão de método válido`            | —                | Delega a lógica para outro padrão de método válido.                                                                  |
| `pushWhere`             | `WhereModel<M>`                      | —                | `where` extra adicionado à query além do `requiredWhere`.                                                            |
| `injectOrdenation`      | `OrdenationModel<M>`                 | —                | Ordenação fixa injetada automaticamente na query.                                                                    |
| `injectPagination`      | `PaginationModel<M>`                 | —                | Paginação fixa injetada automaticamente na query.                                                                    |

---

### Aggregate e GroupBy

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  methods: {
    aggregate: { map: true },
    groupBy: { map: true },
  },
}).build(prisma);
```

> [!NOTE]
> Esses métodos devem ter exatamente esses nomes (`aggregate` e `groupBy`).
> Diferente dos demais métodos dinâmicos, eles recebem argumentos nativos do Prisma e **ignoram** as configurações `selectModels`, `pushWhere` e `requiredWhere`.

---

## Relações no save

Configure as relações para que `save` e `patch` as gerenciem automaticamente (`saveList` e `patchList` também gerenciam relações automaticamente).

```ts
import type { Prisma } from "../../generated/prisma/client";

type User = Prisma.userGetPayload<{
  include: { profile: true; posts: true };
}>;

const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",

  relations: {
    profile: {
      pk: "id",
      mode: "oto",
      restriction: "set",
    },
    posts: {
      pk: "id",
      mode: "otm",
      restriction: "add",
    },
  },
}).build(prisma);
```

**Modos de relação:**

| Modo  | Relação          |
| ----- | ------------------ |
| `oto` | um-para-um          |
| `otm` | um-para-muitos      |
| `mto` | muitos-para-um      |
| `mtm` | muitos-para-muitos  |

**Restrições:**

| Restrição   | Comportamento na atualização                                    |
| ------------ | -------------------------------------------------------------------|
| `set`         | Substitui totalmente (remove os que não foram enviados)            |
| `add`         | Adiciona/atualiza sem remover os existentes                         |

> [!WARNING]
> **`set` significa coisas diferentes dependendo do `mode` da relação — e isso pode causar perda de dados se você não tomar cuidado.**
>
> Em relações onde o registro relacionado **pertence** ao registro pai (`oto` e `otm`), "remover os que não foram enviados" significa **apagar o registro do banco de dados** (`delete`/`deleteMany`). Em relações onde o registro relacionado é **independente** (`mto` e `mtm`), "remover" significa apenas **desvincular** (`disconnect`/`set: []`) — o registro relacionado continua existindo no banco, apenas deixa de apontar para o pai (ou de estar na tabela de junção).
>
> | Modo  | `restriction: "set"` quando um item é omitido | O item continua existindo no banco de dados? |
> | ----- | ------------------------------------------------ | -----------------------------------------------------|
> | `oto` | Passar `null` no campo → **apaga** o registro relacionado (`delete: true`) | Não |
> | `otm` | Itens fora da lista enviada → **apagados** (`deleteMany` com `notIn`)      | Não |
> | `mto` | Passar `null` no campo (com `nullable: true`) → **desvincula** (`disconnect: true`) | Sim |
> | `mtm` | Itens fora da lista enviada → **desvinculados** da tabela de junção (`set: []`) | Sim |
>
> Exemplo prático: se `posts` for `otm` com `restriction: "set"`, um `save`/`patch` que envia o usuário com apenas 2 dos 5 posts existentes vai **apagar os outros 3 posts do banco de dados**, não apenas desvinculá-los do usuário. Se o comportamento esperado for apenas desvincular sem apagar, use `restriction: "add"` (que nunca remove nada) e trate a remoção manualmente.

**Relação `mto` com nullable:**

Use `nullable` (minúsculo) para permitir desvincular uma relação many-to-one:

```ts
relations: {
  category: {
    pk: "id",
    mode: "mto",
    restriction: "set",
    nullable: true, // permite passar null para desvincular
  },
}
```

---

## Transações

Todos os métodos aceitam `options.db` para participar de uma transação:

```ts
await userRepository.prisma.$transaction(async (tx) => {
  const user = await userRepository.save(
    { name: "Mary", email: "mary@email.com", password: "password" },
    { db: tx }
  );

  await userLogsRepository.save(
    { action: "User registration", data: { registeredUser: user.id } },
    { db: tx }
  );
});
```

Para `saveList` e `patchList`, o campo `db` deve ser um `DbTransaction`:

```ts
await prisma.$transaction(async (tx) => {
  // CORRETO: tx é um DbTransaction
  const registeredUsers = await userRepository.saveList([{ name: "Mary" }, { name: "Lucas" }], { db: tx });

  await userLogsRepository.save(
    { action: "User registration", data: { registeredUsers: registeredUsers.map(u => u.id) } },
    { db: tx }
  );
});
```

---

## Estendendo um repositório

```ts
const userRepository = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  methods: {
    findOneByEmailEndsWith: { map: true },
  },
})
  .build(prisma)
  .extend((repo) => ({
    findActiveByDomain: async (domain: string) => {
      return repo.findOneByEmailEndsWith(`@${domain}`);
    },

    activateMultiple: async (ids: string[]) => {
      return repo.patchList(ids.map(id => [id, { active: true }]));
    },
  }));
```

---

## Tratamento de erros

O VSRepository lança `VSRepoError` e suas subclasses em situações específicas (erros do Prisma não são sobrescritos):

```ts
import { VSRepoError, VSRepoRuntimeError } from "../../generated/vsrepo";

try {
  const user = await userRepository.getOrThrow("id-that-does-not-exist");
} catch (error) {
  if (error instanceof VSRepoRuntimeError && error.code === "20727") {
    console.error("Record not found");
  } else if (error instanceof VSRepoError) {
    console.error("Repository error:", error.message);
  } else {
    console.error("Error:", error.message)
  }
}
```

**Subclasses disponíveis:**

| Classe                  | Quando é lançada                                                       |
| ------------------------ | ---------------------------------------------------------------------------|
| `VSRepoConfigError`       | Configuração inválida em `setupVSRepo`                                     |
| `VSRepoBuildError`        | Nome de método, tipo de campo ou configuração inválida em `build`          |
| `VSRepoExtendError`       | Argumento inválido em `extend`                                             |
| `VSRepoRuntimeError`      | Erro em tempo de execução durante uma operação                             |

`VSRepoRuntimeError` tem uma propriedade `code` para identificação programática. O código `"20727"`, por exemplo, é lançado por `getOrThrow` quando o registro não é encontrado.

---

## Tipos utilitários

### Tipos de client

```ts
import type { DbClient, DbTransaction, ClientOrTransaction } from "../../generated/vsrepo";

type DbClient            = PrismaClient;
type DbTransaction       = Prisma.TransactionClient;
type ClientOrTransaction = DbClient | DbTransaction;
```

### Tipo de visibilidade do soft-delete

```ts
import type { SeeMode } from "../../generated/vsrepo";

type SeeMode = "active" | "removed" | "all";
```

### Tipos derivados do modelo Prisma

```ts
import type {
  SelectModel,
  SelectModels,
  IncludeModel,
  IncludeModels,
  WhereModel,
  OrdenationModel,
  PaginationModel,
  ModelUpsertInput,
  PrismaModelInputs,
} from "../../generated/vsrepo";
```

### Tipos de opções de método

```ts
import type { MethodOptions, MethodOptionsModel } from "../../generated/vsrepo";

// MethodOptions<S, IM> — opções passadas para os métodos do repositório
type Opts = MethodOptions<"public" | "minimal", "withPosts">;

// MethodOptionsModel<TRepo> — derivado de uma instância configurada do VSRepository
const userVSRepo = setupVSRepo<User, "user">()(config);
type OptsModel = MethodOptionsModel<typeof userVSRepo>;
```

> O segundo parâmetro de `MethodOptions` (`IM`) representa as chaves válidas de `includeModels`. Quando informado, `selectModel` e `includeModel` se tornam mutuamente exclusivos no tipo — não é possível passar os dois na mesma chamada.

### Tipos de configuração

```ts
import type {
  MethodConfig,
  RepoConfig,
  BuildConfig,
  RepositoryRelations,
  ExtractRelationConfig,
} from "../../generated/vsrepo";
```

### Tipo do repositório construído

```ts
import type { RepositoryOf } from "../../generated/vsrepo";

const userVSRepo = setupVSRepo<User, "user">()({ ... });
type UserRepository = RepositoryOf<typeof userVSRepo>;
```

`RepositoryOf` aceita três parâmetros:

```ts
type RepositoryOf<TRepo, C extends BuildConfig | undefined = undefined, E = unknown>
```

### Tipos de payload para `save` e `patch`

```ts
import type { SaveObject, PatchObject } from "../../generated/vsrepo";

const userVSRepo = setupVSRepo<User, "user">()(({
  tableName: "user",
  pkName: "id",
  relations: {
    profile: { pk: "id", mode: "oto", restriction: "set" },
  },
});

type UserSavePayload  = SaveObject<Prisma.UserCreateInput, typeof userVSRepo>;
type UserPatchPayload = PatchObject<Prisma.UserUpdateInput, typeof userVSRepo>;
```

---

## Referência da API

### `setupVSRepo<T, M>()(config)`

```ts
setupVSRepo<TPayload, TTableName>()({
  tableName: Uncapitalize<M>;                     // Nome da tabela no Prisma
  pkName: keyof T;                                // Nome da chave primária
  softRemovekName?: keyof T & string;             // Campo DateTime para soft-delete
  selectModels?: SelectModels<M>;                 // Projeções de dados nomeadas (select)
  defaultSelectModel?: keyof SM;                  // Select aplicado por padrão
  includeModels?: IncludeModels<M>;               // Projeções de dados nomeadas (include) — sem padrão, apenas na chamada
  requiredWhere?: WhereModel<M>;                  // Filtros sempre aplicados
  defaultOrdenation?: OrdenationModel<M>;         // Ordenação padrão para queries sem Ordered/injectOrdenation
  relations?: RepositoryRelations<T>;             // Configuração de relações
  methods?: Record<string, MethodConfig<M, SM>>;  // Métodos dinâmicos
});
```

### `.build(prisma, config?)`

```ts
vsRepo.build(prisma, {
  showWorking?: boolean;   // Exibe os logs internos no console (padrão = false)

  baseMethods?: {
    // Métodos que podem usar um defaultSelect
    get?:             { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getOrThrow?:      { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getList?:         { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    remove?:          { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    save?:            { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    saveList?:        { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    patch?:           { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    patchList?:       { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    merge?:           { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getAll?:          { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    softRemove?:      { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    restore?:         { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };

    // Métodos que NÃO aceitam defaultSelect
    removeList?:      { active?: boolean; ignoreRequiredWhere?: boolean };
    softRemoveList?:  { active?: boolean; ignoreRequiredWhere?: boolean };
    restoreList?:     { active?: boolean; ignoreRequiredWhere?: boolean };
    total?:           { active?: boolean; ignoreRequiredWhere?: boolean };
    has?:             { active?: boolean; ignoreRequiredWhere?: boolean };
  };
});
```

### `.extend(fn)`

```ts
repo.extend((repo) => ({
  myMethod: () => { ... }
}));
```

---

## Exemplos práticos

Além deste README, o repositório tem uma pasta **[`examples/`](https://github.com/jaobrabo123/VSRepository/tree/main/examples)** com exemplos práticos, comentados e prontos para executar — é o melhor lugar para ver o VSRepository sendo usado em cenários reais.

```
examples/
├── prisma.ts             # Instância do PrismaClient usada pelos exemplos
├── repositories.ts       # Configuração dos repositórios (User, Address, Product) com setupVSRepo
└── tests/
    ├── base-methods.test.ts       # Métodos base: get, save, patch, remove, getAll, total, has...
    ├── relations.test.ts          # Como configurar e usar relações em save/patch e em filtros
    ├── required-where.test.ts     # Como requiredWhere é aplicado automaticamente às queries
    ├── dynamic-methods.test.ts    # Prefixos, filtros de campo, operadores lógicos e paginação/ordenação
    ├── transactions.test.ts       # Transações com options.db e acesso à instância via repository.prisma
    ├── soft-delete.test.ts        # Soft-delete: softRemove, softRemoveList, restore, restoreList e SeeMode
    └── batch-methods.test.ts      # Operações em lote: getList, saveList, patchList e merge
```

Cada arquivo em `tests/` é um script independente e executável (via `tsx`) que demonstra um conjunto específico de funcionalidades, com `console.log` em cada etapa para você acompanhar o resultado no terminal. A própria pasta tem um [README](https://github.com/jaobrabo123/VSRepository/blob/main/examples/README.md) explicando a ordem de leitura sugerida, como configurar o ambiente e como rodar os testes.

---

## Contribuindo

Contribuições são bem-vindas! Se você encontrou um bug, tem uma ideia de melhoria ou quer ajudar com a documentação, sinta-se à vontade para participar (**[Repositório no GitHub](https://github.com/jaobrabo123/VSRepository)**):

1. Faça um **fork** do projeto.
2. Crie uma nova branch com sua alteração: `git checkout -b fixing-bug`.
3. Envie para sua branch: `git push origin fixing-bug`.
4. Abra um **Pull Request**.

Para reportar problemas ou sugerir novas funcionalidades, abra uma **Issue**.

---

## Requisitos

- Node.js 18+ (ESM)
- Prisma
- TypeScript (opcional, mas fortemente recomendado)
- `"moduleResolution": "bundler"` ou `"nodenext"` no tsconfig

`tsconfig.json` recomendado:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "skipLibCheck": true,
    "lib": ["ES2020"]
  }
}
```

---

## Solução de problemas

**Tipos genéricos não são inferidos** — Verifique se `strict: true` e `moduleResolution: "bundler"` ou `"nodenext"` estão configurados no `tsconfig.json`.

**Método dinâmico não existe em tempo de execução** — O campo referenciado no nome do método deve existir no modelo do Prisma. Ex.: `findByEmail` requer que o modelo tenha um campo `email`.

**`proxyTo` obrigatório** — Nomes fora dos padrões conhecidos (ex.: `searchByEmail`) não são interpretados diretamente. Use `proxyTo: "findByEmail"` nesses casos.

**Select model retorna campos inesperados** — Verifique se o select model define exatamente os campos que o seu tipo TypeScript espera.

**`selectModel`, `includeModel` e `include` juntos na mesma chamada** — Não é permitido. Apenas um dos três pode ser informado por chamada: se `includeModel` ou `include` for informado, o `select` (incluindo `defaultSelectModel`) é ignorado e apenas o `include` é enviado ao Prisma.

**`includeModel` não aparece como opção padrão do repositório** — Isso é esperado. Diferente do `defaultSelectModel`, não existe `defaultIncludeModel`/`defaultInclude`. Um `includeModel` só pode ser definido na chamada do método, via `options.includeModel`. Um include bruto e ad hoc pode ser definido via `options.include`, sem precisar ser registrado em `includeModels`.

**`softRemovekName` lança um erro no build** — O campo informado deve ser do tipo `DateTime` no schema do Prisma. Tipos como `Boolean` ou `String` não são aceitos.

**`defaultOrdenation` não está sendo aplicado** — Verifique se o método usa o sufixo `Ordered`, `OrderedAndPaginated` ou `PaginatedAndOrdered`, e se tem `injectOrdenation` configurado. Ambos têm prioridade sobre a ordenação padrão.

**Sufixo `Distinct` não é reconhecido** — `Distinct` só é resolvido em prefixos de leitura (`findMany`, `findFirst`, `findBy`, `existsBy`, etc). Em métodos como `count`, `createMany`, `updateMany` ou `deleteMany` o sufixo é ignorado.

**`saveList`/`patchList` com `db` inválido** — O campo `db` nesses métodos só aceita uma `DbTransaction` (o retorno de `prisma.$transaction`), não o client principal. Passar o `PrismaClient` diretamente causará comportamento inesperado.
