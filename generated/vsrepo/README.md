# VSRepository

![npm](https://img.shields.io/npm/v/vsrepo?style=flat-square)
![NPM License](https://img.shields.io/npm/l/vsrepo)
![NPM Downloads](https://img.shields.io/npm/dt/vsrepo?style=flat-square)

Biblioteca de repository pattern para projetos que usam **Prisma**, com suporte completo a **TypeScript** e **type inference** automático.

O VSRepository permite criar repositories fortemente tipados com:

- **Métodos base** automáticos: `get`, `getOrThrow`, `getList`, `save`, `saveList`, `remove`, `removeList`, `patch`, `patchList`, `merge`, `getAll`, `total`, `has`
- **Soft-delete nativo**: `softRemove`, `softRemoveList`, `restore`, `restoreList`
- **Métodos dinâmicos** inferidos pelo nome: `findByEmail`, `findManyPaginated`, `updateById`, `deleteManyByIdIn`
- **Select models** reutilizáveis para diferentes projeções de dados
- **Type safety** em 100% das operações
- **Transações** nativas do Prisma (automáticas em `saveList` e `patchList`)
- **Extensibilidade** com métodos personalizados

---

## Sumário

- [Instalação](#instalação)
- [Gerando os tipos](#gerando-os-tipos)
- [Uso básico](#uso-básico)
- [Integração com NestJS](#integração-com-nestjs)
- [Métodos base](#métodos-base)
  - [Soft-delete](#soft-delete)
  - [Operações em lote](#operações-em-lote)
  - [Merge](#merge)
  - [Configurando os métodos base](#configurando-os-métodos-base)
- [Select Models](#select-models)
- [Required Where](#requiredwhere)
- [Default Ordenation](#default-ordenation)
- [Opção `see`](#opção-see)
- [Métodos dinâmicos](#métodos-dinâmicos)
  - [Prefixos disponíveis](#prefixos-disponíveis)
  - [Filtros de campo](#filtros-de-campo)
  - [Operadores lógicos](#operadores-lógicos)
  - [Filtros de relação](#filtros-de-relação)
  - [Sufixos de paginação e ordenação](#sufixos-de-paginação-e-ordenação)
  - [Configuração de métodos](#configuração-de-métodos)
  - [Aggregate e GroupBy](#aggregate-e-groupby)
- [Relações no save](#relações-no-save)
- [Transações](#transações)
- [Estendendo um repository](#estendendo-um-repository)
- [Tratamento de erros](#tratamento-de-erros)
- [Tipos utilitários](#tipos-utilitários)
- [API Reference](#api-reference)
- [Contribuindo](#contribuindo)
- [Requisitos](#requisitos)
- [Troubleshooting](#troubleshooting)

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

O VSRepository precisa conhecer o caminho real do seu Prisma Client para gerar as tipagens corretamente.

```bash
npx vsrepo generate
```

Equivale a:

```bash
npx vsrepo generate \
  --output generated/vsrepo \
  --prisma generated/prisma
```

**Flags disponíveis:**

| Flag       | Alias | Padrão                 |
| ---------- | ----- | ---------------------- |
| `--output` | `-o`  | `generated/vsrepo` |
| `--prisma` | `-p`  | `generated/prisma` |

**Arquivos gerados:**

```
generated/vsrepo/
├── VSRepoError.ts
├── VSRepoError.types.d.ts
├── VSRepository.ts
├── VSRepository.types.d.ts
└── index.ts
```

Após gerar, importe sempre a partir da pasta gerada:

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

### Criando um repository

```ts
// src/repositories/usuarioRepository.ts
import prisma from "../configs/db";
import { setupVSRepo } from "../../generated/vsrepo";
import type { Usuario } from "../../generated/prisma/client";

const usuarioRepository = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",
  selectModels: {
    public: { id: true, nome: true, email: true },
  },
  defaultSelectModel: "public",
  requiredWhere: { ativo: true },
}).build(prisma);

export default usuarioRepository;
```

> `selectModels` e `requiredWhere` podem ser declarados fora do `setupVSRepo` se você precisar exportá-los para uso em outros arquivos.

### Usando o repository

```ts
import usuarioRepository from "./repositories/usuarioRepository";

const usuario = await usuarioRepository.save({
  nome: "Joao",
  email: "joao@email.com",
  senha: "password",
});

const encontrado = await usuarioRepository.get(usuario.id);
const todos = await usuarioRepository.getAll();

usuario.nome = "Joao Pedro";

await usuarioRepository.save(usuario);
await usuarioRepository.remove(usuario.id);
```

---

## Integração com NestJS

O VSRepository pode ser facilmente integrado em projetos NestJS através de providers. Abaixo está um exemplo completo usando o padrão de injeção de dependência do NestJS.

### Configurando o repository como provider

```ts
// src/resources/user/user.repository.ts
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
    return userVSRepo.build(prisma).extend((repo) => ({
        buscarPorDominio: async (dominio: string) => {
            return repo.findByEmailEndsWith(`@${dominio}`);
        },
    }));
};

export type UserRepository = ReturnType<typeof setupUserRepository>;

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

export const UserRepositoryProvider: Provider = {
    provide: USER_REPOSITORY,
    inject: [PrismaService],
    useFactory: setupUserRepository,
};
```

### Registrando o provider no módulo

```ts
// src/resources/user/user.module.ts
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

### Utilizando o repository em um serviço

```ts
// src/resources/user/user.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { USER_REPOSITORY, UserRepository } from "./user.repository";

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

**Benefícios desta abordagem:**

- ✅ Type-safe repositories com injeção de dependência
- ✅ Fácil de testar (mock do `USER_REPOSITORY`)
- ✅ Isolamento da lógica de persistência
- ✅ Reutilização do repository em múltiplos serviços
- ✅ Suporte a transações via `PrismaService`

---

## Métodos base

Ao chamar `.build(prisma)` os métodos base abaixo são automaticamente disponibilizados:

| Método                   | Descrição                                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `get(pk)`                | Busca um registro pela primary key                                                                          |
| `getOrThrow(pk)`         | Busca um registro pela primary key; lança `VSRepoRuntimeError` (code `"20727"`) se não encontrado          |
| `getList(pks)`           | Busca múltiplos registros por uma lista de primary keys                                                     |
| `save(obj)`              | Cria ou atualiza — se o objeto tiver a `pk` faz `upsert`, caso contrário faz `create`                      |
| `saveList(objs)`         | Salva um array de objetos em uma única transação automática                                                 |
| `patch(pk, obj)`         | Atualiza parcialmente um registro pela primary key                                                          |
| `patchList(tuples)`      | Atualiza parcialmente múltiplos registros via array de tuplas `[pk, obj]` em transação automática          |
| `merge(pk, obj)`         | Busca um registro e faz um deep merge em memória — **não persiste**, retorna o objeto mesclado             |
| `remove(pk)`             | Remove um registro pela primary key                                                                         |
| `removeList(pks)`        | Remove vários registros pela lista de primary keys — retorna `{ count }`                                   |
| `getAll()`               | Retorna todos os registros (aceita `pagination` e `order` no `options`)                                     |
| `total()`                | Retorna o total de registros                                                                                |
| `has(pk)`                | Verifica existência de um registro pela primary key — retorna `boolean`                                    |

Todos aceitam `options` como último argumento.

### Soft-delete

Quando `softRemovekName` está configurado no repository, os seguintes métodos adicionais ficam disponíveis:

| Método                     | Descrição                                                                         |
| -------------------------- | --------------------------------------------------------------------------------- |
| `softRemove(pk)`           | Marca um registro como removido preenchendo `softRemovekName` com a data atual    |
| `softRemoveList(pks)`      | Marca múltiplos registros como removidos em lote — retorna `{ count }`            |
| `restore(pk)`              | Restaura um registro soft-deletado, limpando o campo `softRemovekName`            |
| `restoreList(pks)`         | Restaura múltiplos registros soft-deletados em lote — retorna `{ count }`         |

```ts
const usuarioRepository = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",
  softRemovekName: "deletedAt", // deve ser um campo DateTime no schema do Prisma
}).build(prisma);

await usuarioRepository.softRemove(1);
await usuarioRepository.restore(1);
```

> O campo informado em `softRemovekName` **deve** ser do tipo `DateTime` no schema do Prisma. O VSRepository valida isso no momento do `build` e lança `VSRepoBuildError` se o tipo for incorreto.

### Operações em lote

`saveList` e `patchList` executam todas as operações automaticamente dentro de uma única transação do Prisma. Se alguma falhar, todas as anteriores são revertidas.

```ts
// saveList — cria ou atualiza múltiplos objetos em transação automática
const usuarios = await usuarioRepository.saveList([
  { nome: "Maria", email: "maria@email.com" },
  { id: 2, nome: "João Atualizado" },
]);

// patchList — atualiza parcialmente múltiplos registros via tuplas [pk, obj]
const atualizados = await usuarioRepository.patchList([
  [1, { ativo: false }],
  [2, { nome: "Novo Nome" }],
]);
```

Quando você já está dentro de uma transação existente, passe-a em `options.db`. Nesse caso, o `db` deve ser um `DbTransaction` (não o cliente principal), pois o método não cria uma transação própria:

```ts
await prisma.$transaction(async (tx) => {
  await usuarioRepository.saveList([{ nome: "Maria" }], { db: tx });
  await usuarioRepository.patchList([[1, { ativo: false }]], { db: tx });
});
```

### Merge

O método `merge` busca um registro pela PK e mescla profundamente (`deepmerge`) o objeto fornecido com os dados existentes **em memória**. Ele **não persiste** as alterações — retorna o resultado mesclado para que você decida o que fazer com ele.

```ts
const existente = await usuarioRepository.get(1);
// existente: { id: 1, nome: "Maria", perfil: { bio: "Olá", idade: 25 } }

const mesclado = await usuarioRepository.merge(1, {
  perfil: { bio: "Bio atualizada" },
});
// mesclado: { id: 1, nome: "Maria", perfil: { bio: "Bio atualizada", idade: 25 } }

// Para persistir, passe para save ou patch:
await usuarioRepository.save(mesclado);
```

Retorna `null` se o registro não for encontrado.

### Configurando os métodos base

```ts
usuarioVSRepo.build(prisma, {
  showWorking: true,  // Exibe logs do VSRepository no console, ótimo para debugar

  baseMethods: {
    get: {
      active: true,
      defaultSelect: "public",
    },
    remove: {
      active: true,
      defaultSelect: "minimal",
      ignoreRequiredWhere: false,
    },
    save: {
      ignoreRequiredWhere: true,
    },
    patch: {
      defaultSelect: "minimal",
    },
    has: {
      active: false, // Desativa o 'has' (padrão = true)
    },
    softRemove: {
      active: true,
      defaultSelect: "minimal",
    },
  },
});
```

---

## Select Models

`selectModels` define projeções de dados nomeadas e reutilizáveis.

```ts
selectModels: {
  public:   { id: true, nome: true, email: true },
  internal: { id: true, nome: true, email: true, senha: true },
  minimal:  { id: true },
},
defaultSelectModel: "public",
```

`defaultSelectModel` define qual select é usado automaticamente quando nenhum é especificado na chamada. É recomendado sempre definí-lo junto com `selectModels`.

**Usando um select específico na chamada:**

```ts
const usuario = await usuarioRepository.get(id, { selectModel: "minimal" });
```

**Retornando o payload padrão do Prisma (sem select):**

```ts
const usuarioCompleto = await usuarioRepository.get(id, { selectModel: false });
```

---

## Required Where

`requiredWhere` define filtros aplicados automaticamente em todas as queries do repository.

```ts
requiredWhere: { ativo: true },
```

Agora toda query incluirá `ativo: true` automaticamente:

```ts
// Internamente: WHERE ativo = true
const usuarios = await usuarioRepository.findMany();

// Internamente: WHERE email = 'joao@email.com' AND ativo = true
const usuario = await usuarioRepository.findByEmail("joao@email.com");
```

Útil para soft-deletes manuais, multi-tenancy e filtros globais de qualquer natureza.

---

## Default Ordenation

`defaultOrdenation` define uma ordenação padrão aplicada automaticamente em todas as queries que aceitam `orderBy`, sem precisar repetir o argumento `order` em cada chamada.

```ts
const usuarioRepository = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",
  defaultOrdenation: { criadoEm: "desc" },
}).build(prisma);
```

Com isso, toda query de listagem já virá ordenada por `criadoEm` decrescente:

```ts
// Internamente: ORDER BY criadoEm DESC
const usuarios = await usuarioRepository.getAll();

// Também aplica ao getAll com pagination
const paginados = await usuarioRepository.getAll({ pagination: { take: 10 } });
```

**A `defaultOrdenation` é ignorada quando:**

- O método usa o sufixo `Ordered`, `OrderedAndPaginated` ou `PaginatedAndOrdered` — nesses casos o argumento `order` passado na chamada tem prioridade.
- O método dinâmico tem `injectOrdenation` configurado — a ordenação fixa do método prevalece.

```ts
methods: {
  findManyPaginatedAndOrdered: { map: true },         // ordem vem do argumento → defaultOrdenation ignorada
  findManyByAtivo:             { map: true },         // sem Ordered → defaultOrdenation aplicada
  findManyByStatus: {
    map: true,
    injectOrdenation: { nome: "asc" },                // injectOrdenation → defaultOrdenation ignorada
  },
}
```

> `defaultOrdenation` aceita o mesmo tipo que o `orderBy` nativo do Prisma para o modelo — incluindo arrays de ordenações encadeadas.

---

Quando `softRemovekName` está configurado, todos os métodos base aceitam a opção `see` para controlar a visibilidade de registros soft-deletados:

| Valor       | Comportamento                                                 |
| ----------- | ------------------------------------------------------------- |
| `"active"`  | Retorna apenas registros **não** removidos (padrão)           |
| `"removed"` | Retorna apenas registros removidos                            |
| `"all"`     | Retorna todos os registros, independentemente do status       |

```ts
// Retorna apenas usuários ativos (padrão)
const ativos = await usuarioRepository.getAll();

// Retorna apenas usuários removidos
const removidos = await usuarioRepository.getAll({ see: "removed" });

// Retorna todos
const todos = await usuarioRepository.getAll({ see: "all" });

// Funciona em qualquer método base
const usuario = await usuarioRepository.get(id, { see: "all" });
const existe = await usuarioRepository.has(id, { see: "removed" });
```

> A opção `see` funciona independentemente do `requiredWhere` — ela é aplicada em cima do filtro de soft-delete, não o substitui.

---

## Métodos dinâmicos

Métodos dinâmicos são definidos na propriedade `methods` e têm seus comportamentos inferidos a partir do nome.

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

O prefixo do nome do método determina qual operação Prisma será chamada e quais argumentos serão esperados.

| Prefixo                    | Operação Prisma           | Retorno                | Observações                                                              |
| -------------------------- | ------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| `findOneBy`                | `findFirst`               | `T \| null`            | Retorno único.                                                           |
| `findBy`                   | `findMany` / `findFirst`  | `T[]` ou `T \| null`   | Padrão é lista; use `fbMode: "one"` para retorno único (**obsoleto**, use `findOneBy`)      |
| `findUniqueBy`             | `findUnique`              | `T \| null`            |                                                                          |
| `findUniqueOrThrowBy`      | `findUniqueOrThrow`       | `T`                    | Lança erro se não encontrar                                              |
| `findFirstBy`              | `findFirst`               | `T \| null`            | Aceita campos como filtro                                                |
| `findFirstOrThrowBy`       | `findFirstOrThrow`        | `T`                    | Aceita campos como filtro; lança erro se não encontrar                   |
| `findFirst`                | `findFirst`               | `T \| null`            | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`            |
| `findFirstOrThrow`         | `findFirstOrThrow`        | `T`                    | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`; lança erro se não encontrar |
| `findManyBy`               | `findMany`                | `T[]`                  | Aceita campos como filtro                                                |
| `findMany`                 | `findMany`                | `T[]`                  | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`            |
| `findOneWhere`             | `findFirst`               | `T \| null`            | Recebe um objeto `where` explícito como argumento                        |
| `findWhere`                | `findFirst`               | `T \| null`            | (**Obsoleto, use `findOneWhere`**) Recebe um objeto `where` explícito    |
| `findListWhere`            | `findMany`                | `T[]`                  | Recebe um objeto `where` explícito como argumento                        |
| `existsBy`                 | `findFirst`               | `boolean`              | Retorna `true` se encontrar, `false` caso contrário                      |
| `existsWhere`              | `findFirst`               | `boolean`              | Recebe um objeto `where` explícito e retorna se existe                   |
| `countBy`                  | `count`                   | `number`               | Aceita campos como filtro                                                |
| `countWhere`               | `count`                   | `number`               | Recebe um objeto `where` explícito como argumento                        |
| `count`                    | `count`                   | `number`               | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`            |
| `create`                   | `create`                  | `T`                    | Recebe `data` como argumento                                             |
| `createMany`               | `createMany`              | `{ count: number }`    | Recebe `data` como argumento; suporta `SkipDuplicates`                   |
| `createManyAndReturn`      | `createManyAndReturn`     | `T[]`                  | Recebe `data` como argumento; suporta `SkipDuplicates`                   |
| `updateBy`                 | `update`                  | `T`                    | Recebe `data` como argumento                                             |
| `updateManyBy`             | `updateMany`              | `{ count: number }`    | Recebe `data` como argumento                                             |
| `updateManyWhere`          | `updateMany`              | `{ count: number }`    | Recebe um objeto `where` e um objeto `data` como argumentos              |
| `updateManyAndReturnBy`    | `updateManyAndReturn`     | `T[]`                  | Recebe `data` como argumento                                             |
| `updateManyAndReturnWhere` | `updateManyAndReturn`     | `T[]`                  | Recebe um objeto `where` e um objeto `data` como argumentos              |
| `upsertBy`                 | `upsert`                  | `T`                    | Recebe `update` e `create` como argumentos                               |
| `deleteBy`                 | `delete`                  | `T`                    |                                                                          |
| `deleteManyBy`             | `deleteMany`              | `{ count: number }`    |                                                                          |
| `deleteManyWhere`          | `deleteMany`              | `{ count: number }`    | Recebe um objeto `where` explícito como argumento                        |
| `aggregate`                | `aggregate`               | `Dinâmico`             | Nome deve ser exato; recebe args nativos do Prisma; ignora `selectModels`, `pushWhere` e `requiredWhere` |
| `groupBy`                  | `groupBy`                 | `Dinâmico[]`           | Nome deve ser exato; recebe args nativos do Prisma; ignora `selectModels`, `pushWhere` e `requiredWhere` |

---

### Filtros de campo

Os filtros são sufixos aplicados ao nome do campo dentro do método. O campo em si vem capitalizado logo após o prefixo (ou após `By`).

| Sufixo             | Operador Prisma       | Argumento necessário      |
| ------------------ | --------------------- | ------------------------- |
| *(sem sufixo)*     | igualdade (`=`)       | sim                       |
| `Not`              | `not`                 | sim                       |
| `In`               | `in`                  | sim (array)               |
| `NotIn`            | `notIn`               | sim (array)               |
| `Contains`         | `contains`            | sim                       |
| `NotContains`      | `not.contains`        | sim                       |
| `StartsWith`       | `startsWith`          | sim                       |
| `NotStartsWith`    | `not.startsWith`      | sim                       |
| `EndsWith`         | `endsWith`            | sim                       |
| `NotEndsWith`      | `not.endsWith`        | sim                       |
| `GreaterThan`      | `gt`                  | sim                       |
| `GreaterThanEqual` | `gte`                 | sim                       |
| `LessThan`         | `lt`                  | sim                       |
| `LessThanEqual`    | `lte`                 | sim                       |
| `Between`          | `gte` + `lte`         | sim (tupla `[min, max]`)  |
| `NotBetween`       | `not.gte` + `not.lte` | sim (tupla `[min, max]`)  |
| `IsNull`           | `null`                | não                       |
| `IsNotNull`        | `not: null`           | não                       |
| `IsTrue`           | `true`                | não                       |
| `IsFalse`          | `false`               | não                       |
| `Insensitive`      | `mode: 'insensitive'` | combinador                |

`Insensitive` é um combinador e pode ser usado junto com outro filtro de texto:

```ts
findByNomeContainsInsensitive    // { nome: { contains: valor, mode: 'insensitive' } }
findByEmailStartsWithInsensitive // { email: { startsWith: valor, mode: 'insensitive' } }
findByNomeInsensitive            // { nome: { equals: valor, mode: 'insensitive' } }
```

`Between` e `NotBetween` recebem uma **tupla `[minValue, maxValue]`**:

```ts
methods: {
  findManyByIdadeBetween:      { map: true },
  findManyBySalarioNotBetween: { map: true },
  findManyByCriadoEmBetween:   { map: true },
}

await usuarioRepository.findManyByIdadeBetween([18, 65]);
await usuarioRepository.findManyBySalarioNotBetween([1000, 5000]);
await usuarioRepository.findManyByCriadoEmBetween([new Date("2024-01-01"), new Date("2024-12-31")]);
```

O sufixo `Optional` pode ser adicionado a qualquer campo para tornar o argumento opcional:

```ts
findByNomeOptionalAndEmail // nome é opcional, email é obrigatório
```

---

### Operadores lógicos

| Operador  | Uso no nome                  | Exemplo                          |
| --------- | ---------------------------- | -------------------------------- |
| `And`     | entre dois campos            | `findOneByIdAndEmail`            |
| `Or`      | entre dois campos            | `findByNomeOrEmail`              |
| `AND`     | separa bloco final em `AND`  | `findByEmailOrNameANDActiveStatus` |

`AND` (em capslock) tem uma regra específica:

- Só pode existir **um** `AND` por método.
- Todos os campos depois de `AND` são injetados dentro de `AND: []`.
- Depois de um `AND` não pode ter `Or`.

Exemplo:

```ts
methods: {
  findOneByIdAndEmail:   { map: true },
  findByNomeOrEmail:  { map: true },
  findUniqueByIdOrEmailAndNome: { map: true },
  findByEmailOrNameANDActiveStatusAndIdadeGreaterThan: { map: true }
}

await usuarioRepository.findOneByIdAndEmail(1, "joao@email.com");
await usuarioRepository.findByNomeOrEmail("Joao", "joao@email.com");
await usuarioRepository.findUniqueByIdOrEmailAndNome(1, "joao@email.com", "Joao");
await usuarioRepository.findByEmailOrNameANDActiveStatusAndIdadeGreaterThan("joao@email.com", "Joao", true, 17)
```

Gera (`findByEmailOrNameANDActiveStatusAndIdadeGreaterThan`):

```ts
{
  OR: [
    { email: "joao@email.com" },
    { name: "Joao" }
  ],
  AND: [
    { activeStatus: true },
    { idade: { gt: 17 } }
  ]
}
```

---

### Filtros de relação

Permitem filtrar por campos de modelos relacionados.

> [!IMPORTANT]
> - **Tipagem de relação**: Para que o TypeScript reconheça os tipos dos campos de relação nos métodos dinâmicos, o tipo genérico da entidade passado no `setupVSRepo` deve incluir as relações estruturadas (ex: usando `UsuarioGetPayload<{ include: { perfil: true, postagens: true } }>` do Prisma).
> - **Compatibilidade de sufixos**:
>   - Os sufixos `Some`, `Every` e `None` só funcionam para relações **to-many** (`many-to-many` e `one-to-many`).
>   - Os sufixos `With` e `Without` só funcionam para relações **to-one** (`one-to-one` e `many-to-one`).

| Sufixo de relação      | Operador Prisma | Observação                                         |
| ---------------------- | --------------- | -------------------------------------------------- |
| `Some`                 | `some: {}`      | Relação tem *algum* registro                       |
| `SomeField`            | `some.field`    | Filtra dentro dos registros da relação             |
| `EveryField`           | `every.field`   | Filtra dentro dos registros da relação             |
| `None`                 | `none: {}`      | Relação não tem *nenhum* registro                  |
| `NoneField`            | `none.field`    | Filtra dentro dos registros da relação             |
| `With`                 | `is: {}`        | Relação existe (não é null)                        |
| `WithField`            | `is.field`      | Filtra campo dentro da relação                     |
| `Without`              | `isNot: {}`     | Relação não existe (é null)                        |
| `WithoutField`         | `isNot.field`   | Filtra campo dentro da relação com negação         |

---

### Sufixos de paginação e ordenação

Aplicados ao **final** do nome do método, eles injetam automaticamente os argumentos de paginação e ordenação.

| Sufixo                | Argumentos adicionais         |
| --------------------- | ----------------------------- |
| `Paginated`           | `(pagination)`                |
| `Ordered`             | `(order)`                     |
| `OrderedAndPaginated` | `(order, pagination)`         |
| `PaginatedAndOrdered` | `(pagination, order)`         |

Para `createMany` e `createManyAndReturn`, o sufixo `SkipDuplicates` está disponível:

| Sufixo            | Efeito                                   |
| ----------------- | ---------------------------------------- |
| `SkipDuplicates`  | Ignora registros duplicados na inserção  |

---

### Configuração de métodos

Cada entrada em `methods` aceita as seguintes opções:

| Opção               | Tipo                            | Padrão       | Descrição                                                                                                    |
| ------------------- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `map`               | `boolean`                       | —            | **Obrigatório.** Define se o método será exposto no repository.                                             |
| `whereType`         | `'extending'` \| `'overwrite'`  | `extending`  | `extending` combina com `requiredWhere`. `overwrite` ignora o `requiredWhere`.                               |
| `selectModel`       | `keyof SelectModels \| false`   | —            | Sobrescreve o `defaultSelectModel` para este método.                                                        |
| `fbMode`            | `'one'` \| `'list'`             | `'list'`     | (**Obsoleto. Use `findOneBy`**) Somente para `findBy`. `'one'` retorna `T \| null`; `'list'` retorna `T[]`. |
| `proxyTo`           | `Padrão de método válido`       | —            | Delega a lógica para outro padrão de método válido.                                                         |
| `pushWhere`         | `WhereModel<M>`                 | —            | Where extra adicionado à query além do `requiredWhere`.                                                     |
| `injectOrdenation`  | `OrdenationModel<M>`            | —            | Ordenação fixa injetada automaticamente na query.                                                           |
| `injectPagination`  | `PaginationModel<M>`            | —            | Paginação fixa injetada automaticamente na query.                                                           |

---

### Aggregate e GroupBy

```ts
const usuarioRepository = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",
  methods: {
    aggregate: { map: true },
    groupBy: { map: true },
  },
}).build(prisma);
```

> [!NOTE]
> Estes métodos devem ter exatamente esses nomes (`aggregate` e `groupBy`).
> Ao contrário dos outros métodos dinâmicos, eles recebem argumentos nativos do Prisma e **ignoram** as configurações de `selectModels`, `pushWhere` e `requiredWhere`.

---

## Relações no save

Configure relações para que o `save` e o `patch` as gerenciem automaticamente (`saveList` e `pacthList` também gerenciam as relations automaticamente).

```ts
import type { Prisma } from "../../generated/prisma/client";

type Usuario = Prisma.usuarioGetPayload<{
  include: { perfil: true; postagens: true };
}>;

const usuarioRepository = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",

  relations: {
    perfil: {
      pk: "id",
      mode: "oto",
      restriction: "set",
    },
    postagens: {
      pk: "id",
      mode: "otm",
      restriction: "add",
    },
  },
}).build(prisma);
```

**Modos de relação:**

| Modo  | Relação      |
| ----- | ------------ |
| `oto` | one-to-one   |
| `otm` | one-to-many  |
| `mto` | many-to-one  |
| `mtm` | many-to-many |

**Restrições:**

| Restrição | Comportamento no update                                     |
| --------- | ----------------------------------------------------------- |
| `set`     | Substitui completamente (remove os que não foram enviados)  |
| `add`     | Adiciona/atualiza sem remover os existentes                 |

**Relação `mto` com nullable:**

Use `nullable` (letra minúscula) para permitir a desvinculação de uma relação many-to-one:

```ts
relations: {
  categoria: {
    pk: "id",
    mode: "mto",
    restriction: "set",
    nullable: true, // permite passar null para desvincular
  },
}
```

> **Nota:** `nullAble` (com A maiúsculo) ainda é aceito por compatibilidade, mas está **obsoleto**. Prefira `nullable`.

---

## Transações

Todos os métodos aceitam `options.db` para participar de uma transação:

```ts
await usuarioRepository.prisma.$transaction(async (tx) => {
  const usuario = await usuarioRepository.save(
    { nome: "Maria", email: "maria@email.com", senha: "password" },
    { db: tx }
  );

  await usuarioLogsRepository.save(
    { acao: "Cadastro de usuário", data: { usuarioCadastrado: usuario.id } },
    { db: tx }
  );
});
```

Para `saveList` e `patchList`, o campo `db` deve ser um `DbTransaction` (não o cliente principal):

```ts
await prisma.$transaction(async (tx) => {
  // CORRETO: tx é uma DbTransaction
  await usuarioRepository.saveList([{ nome: "Maria" }], { db: tx });

  // ERRADO: não passe o prisma diretamente
  // await usuarioRepository.saveList([{ nome: "Maria" }], { db: prisma });
});
```

---

## Estendendo um repository

```ts
const usuarioRepository = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",
  methods: {
    findOneByEmailEndsWith: { map: true },
  },
})
  .build(prisma)
  .extend((repo) => ({
    buscarAtivosPorDominio: async (dominio: string) => {
      return repo.findOneByEmailEndsWith(`@${dominio}`);
    },

    ativarMultiplos: async (ids: string[]) => {
      return repo.patchList(ids.map(id => [id, { ativo: true }]));
    },
  }));
```

---

## Tratamento de erros

O VSRepository lança `VSRepoError` e suas subclasses em situações específicas (erros do Prisma não são sobrescritos):

```ts
import { VSRepoError, VSRepoRuntimeError } from "../../generated/vsrepo";

try {
  const usuario = await usuarioRepository.getOrThrow(id);
} catch (error) {
  if (error instanceof VSRepoRuntimeError && error.code === "20727") {
    // Registro não encontrado pelo getOrThrow
  } else if (error instanceof VSRepoError) {
    console.error("Erro no repository:", error.message);
  }
}
```

**Subclasses disponíveis:**

| Classe               | Quando é lançada                                                  |
| -------------------- | ----------------------------------------------------------------- |
| `VSRepoConfigError`  | Configuração inválida em `setupVSRepo`                            |
| `VSRepoBuildError`   | Nome de método, tipo de campo ou configuração inválida no `build` |
| `VSRepoExtendError`  | Argumento inválido em `extend`                                    |
| `VSRepoRuntimeError` | Erro em tempo de execução durante uma operação                    |

`VSRepoRuntimeError` possui a propriedade `code` para identificação programática. O código `"20727"` é lançado pelo `getOrThrow` quando o registro não é encontrado.

---

## Tipos utilitários

### Tipos de cliente

```ts
import type { DbClient, DbTransaction, ClientOrTransaction } from "../../generated/vsrepo";

type DbClient            = PrismaClient;
type DbTransaction       = Prisma.TransactionClient;
type ClientOrTransaction = DbClient | DbTransaction;
```

### Tipo de visibilidade soft-delete

```ts
import type { SeeMode } from "../../generated/vsrepo";

type SeeMode = "active" | "removed" | "all";
```

### Tipos derivados do modelo Prisma

```ts
import type {
  SelectModel,
  SelectModels,
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

// MethodOptions<S> — opções passadas nos métodos do repository
type Opts = MethodOptions<"public" | "minimal">;

// MethodOptionsModel<TRepo> — derivado de uma instância VSRepository configurada
const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()(config);
type OptsModel = MethodOptionsModel<typeof usuarioVSRepo>;
```

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

### Tipo do repository construído

```ts
import type { RepositoryOf } from "../../generated/vsrepo";

const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()({ ... });
type UsuarioRepository = RepositoryOf<typeof usuarioVSRepo>;
```

`RepositoryOf` aceita três parâmetros:

```ts
type RepositoryOf<TRepo, C extends BuildConfig | undefined = undefined, E = unknown>
```

### Tipos do payload de `save` e `patch`

```ts
import type { SaveObject, PatchObject } from "../../generated/vsrepo";

const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()(({
  tableName: "usuario",
  pkName: "id",
  relations: {
    perfil: { pk: "id", mode: "oto", restriction: "set" },
  },
});

type UsuarioSavePayload  = SaveObject<Prisma.UsuarioCreateInput, typeof usuarioVSRepo>;
type UsuarioPatchPayload = PatchObject<Prisma.UsuarioUpdateInput, typeof usuarioVSRepo>;
```

---

## API Reference

### `setupVSRepo<T, M>()(config)`

```ts
setupVSRepo<TPayload, TTableName>()({
  tableName: Uncapitalize<M>;                     // Nome da tabela no Prisma
  pkName: keyof T;                                // Nome da primary key
  softRemovekName?: keyof T & string;             // Campo DateTime para soft-delete (opcional)
  selectModels?: SelectModels<M>;                 // Projeções de dados nomeadas
  defaultSelectModel?: keyof SM;                  // Select aplicado por padrão
  requiredWhere?: WhereModel<M>;                  // Filtros sempre aplicados
  defaultOrdenation?: OrdenationModel<M>;         // Ordenação padrão para queries sem Ordered/injectOrdenation
  relations?: RepositoryRelations<T>;             // Configuração de relações
  methods?: Record<string, MethodConfig<M, SM>>;  // Métodos dinâmicos
});
```

### `.build(prisma, config?)`

```ts
vsRepo.build(prisma, {
  showWorking?: boolean;   // Exibe logs internos no console (default = false)

  baseMethods?: {
    // Métodos que podem utilizar um defaultSelect
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
  meuMetodo: () => { ... }
}));
```

---

## Contribuindo

Contribuições são bem-vindas! Se você encontrou um bug, tem uma ideia de melhoria ou quer ajudar com a documentação, sinta-se à vontade para participar (**[Repositório do GitHub](https://github.com/jaobrabo123/VSRepository)**):

1. Faça um **Fork** do projeto.
2. Crie uma nova branch com a sua alteração: `git checkout -b corrigindo-bug`.
3. Faça o push para a sua branch: `git push origin corrigindo-bug`.
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

## Troubleshooting

**Tipos genéricos não inferidos** — Verifique se `strict: true` e `moduleResolution: "bundler"` ou `"nodenext"` estão no `tsconfig.json`.

**Método dinâmico não existe em runtime** — O campo referenciado no nome do método deve existir no modelo Prisma. Ex.: `findByEmail` exige que o modelo tenha um campo `email`.

**`proxyTo` obrigatório** — Nomes fora dos moldes (ex.: `buscarPorEmail`) não são parseados diretamente. Use `proxyTo: "findByEmail"` nesses casos.

**Select model retorna campos inesperados** — Verifique se o select model define exatamente os campos que o seu tipo TypeScript espera. Campos com `false` não serão retornados pelo Prisma.

**`softRemovekName` lança erro no build** — O campo informado deve ser do tipo `DateTime` no schema do Prisma. Tipos como `Boolean` ou `String` não são aceitos.

**`defaultOrdenation` não está sendo aplicada** — Verifique se o método não usa o sufixo `Ordered`, `OrderedAndPaginated` ou `PaginatedAndOrdered`, e se não possui `injectOrdenation` configurado. Ambos têm prioridade sobre a ordenação padrão.

**`saveList`/`patchList` com `db` inválido** — O campo `db` nestes métodos aceita apenas `DbTransaction` (retorno de `prisma.$transaction`), não o cliente principal. Passar o `PrismaClient` diretamente causará comportamento inesperado.