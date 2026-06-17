# VSRepository

![npm](https://img.shields.io/npm/v/vsrepo?style=flat-square)
![NPM License](https://img.shields.io/npm/l/vsrepo)
![NPM Downloads](https://img.shields.io/npm/d18m/vsrepo.svg)

Biblioteca de repository pattern para projetos que usam **Prisma**, com suporte completo a **TypeScript** e **type inference** automático.

O VSRepository permite criar repositories fortemente tipados com:

- **Métodos base** automáticos: `get`, `getOrThrow`, `save`, `remove`, `removeList`, `getAll`, `total`, `has`
- **Métodos dinâmicos** inferidos pelo nome: `findByEmail`, `findManyPaginated`, `updateById`, `deleteManyByIdIn`
- **Select models** reutilizáveis para diferentes projeções de dados
- **Type safety** em 100% das operações
- **Transações** nativas do Prisma
- **Extensibilidade** com métodos personalizados

---

## Sumário

- [Instalação](#instalação)
- [Gerando os tipos](#gerando-os-tipos)
- [Uso básico](#uso-básico)
- [Integração com NestJS](#integração-com-nestjs)
- [Métodos base](#métodos-base)
- [Select Models](#select-models)
- [Required Where](#requiredwhere)
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

const usuarioRepository = setupVSRepo<Usuario, "usuario">()({
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
>()({
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

### Usando em um controller

```ts
// src/resources/user/user.controller.ts
import { Controller, Get, Post, Body, Param, Patch, Delete } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller("users")
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Get(":id")
    async getUser(@Param("id") id: string) {
        return this.userService.getUserById(id);
    }

    @Post()
    async createUser(
        @Body() data: { email: string; password: string; name: string }
    ) {
        return this.userService.createUser(data);
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

| Método       | Descrição                                  |
| ------------ | ------------------------------------------ |
| `get(pk)`    | Busca um registro pela primary key         |
| `getOrThrow(pk)` | Busca um registro pela primary key e lança erro se não encontrar |
| `save(obj)`  | Cria ou atualiza (se o objeto passado tiver a `pk` faz `upsert`, se não faz `create`) |
| `patch(pk, obj)` | Atualiza parcialmente um registro pela primary key (equivalente ao `update` com payload parcial) |
| `remove(pk)` | Remove um registro pela primary key        |
| `removeList(pks)`  | Remove vários registros pela lista de primary keys — retorna `{ count }`   |
| `getAll()` | Retorna todos os registros (aceita `pagination` e `order` no `options`)  |
| `total()`  | Retorna o total de registros |
| `has(pk)`          | Verifica existência de um registro pela primary key — retorna `boolean`   |

Todos aceitam `options` como último argumento.

### Configurando os métodos base

```ts
usuarioVSRepo.build(prisma, {
  freeze: true,        // Congela o objeto (padrão = true)
  showWorking: true,  // Exibe logs do VSRepository no console, ótimo para debugar as queries criadas e os objetos passados para o prisma

  baseMethods: {
    get: {
      active: true,
      defaultSelect: "public",
    },
    remove: {
      active: true,
      defaultSelect: "minimal",
      ignoreRequiredWhere: false, // Aplica o requiredWhere no remove (padrão = false)
    },
    save: {
      ignoreRequiredWhere: true,  // Não aplica requiredWhere no save
    },
    patch: {
      defaultSelect: "minimal",
    },
    has: {
      active: false, // Desativa o 'has' (padrão = true)
    }
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

Útil para soft-deletes, multi-tenancy e filtros globais de qualquer natureza.

---

## Métodos dinâmicos

Métodos dinâmicos são definidos na propriedade `methods` e têm seus comportamentos inferidos a partir do nome.

```ts
methods: {
  findByEmail:           { map: true, fbMode: "one" },
  findManyPaginated:     { map: true },
  updateById:            { map: true },
  deleteManyByIdIn:      { map: true, whereType: "overwrite" },
}
```

---

### Prefixos disponíveis

O prefixo do nome do método determina qual operação Prisma será chamada e quais argumentos serão esperados.

| Prefixo                   | Operação Prisma          | Retorno                | Observações                                              |
| ------------------------- | ------------------------ | ---------------------- | -------------------------------------------------------- |
| `findBy`                  | `findMany` / `findFirst` | `T[]` ou `T \| null`   | Padrão é lista; use `fbMode: "one"` para retorno único   |
| `findUniqueBy`            | `findUnique`             | `T \| null`            |                                                          |
| `findUniqueOrThrowBy`     | `findUniqueOrThrow`      | `T`                    | Lança erro se não encontrar                                  |
| `findFirstBy`             | `findFirst`              | `T \| null`            | Aceita campos como filtro                                |
| `findFirstOrThrowBy`      | `findFirstOrThrow`       | `T`                    | Aceita campos como filtro; lança erro se não encontrar       |
| `findFirst`               | `findFirst`              | `T \| null`            | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`          |
| `findFirstOrThrow`        | `findFirstOrThrow`       | `T`                    | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`; lança erro se não encontrar |
| `findManyBy`              | `findMany`               | `T[]`                  | Aceita campos como filtro                                |
| `findMany`                | `findMany`               | `T[]`                  | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`           |
| `findWhere`               | `findFirst`              | `T \| null`            | Recebe um objeto `where` explícito como argumento        |
| `findListWhere`           | `findMany`               | `T[]`                  | Recebe um objeto `where` explícito como argumento        |
| `existsBy`                | `findFirst`              | `boolean`              | Retorna `true` se encontrar, `false` caso contrário      |
| `countBy`                 | `count`                  | `number`               | Aceita campos como filtro                                |
| `countWhere`              | `count`                  | `number`               | Recebe um objeto `where` explícito como argumento        |
| `count`                   | `count`                  | `number`               | Sem filtros de campo; aplica só `requiredWhere` e `pushWhere`           |
| `create`                  | `create`                 | `T`                    | Recebe `data` como argumento                             |
| `createMany`              | `createMany`             | `{ count: number }`    | Recebe `data` como argumento; suporta `SkipDuplicates`                            |
| `createManyAndReturn`     | `createManyAndReturn`    | `T[]`                  | Recebe `data` como argumento; suporta `SkipDuplicates`   |
| `updateBy`                | `update`                 | `T`                    | Recebe `data` como argumento                             |
| `updateManyBy`            | `updateMany`             | `{ count: number }`    | Recebe `data` como argumento                             |
| `updateManyAndReturnBy`   | `updateManyAndReturn`    | `T[]`                  | Recebe `data` como argumento                             |
| `upsertBy`                | `upsert`                 | `T`                    | Recebe `update` e `create` como argumentos               |
| `deleteBy`                | `delete`                 | `T`                    |                                                          |
| `deleteManyBy`            | `deleteMany`             | `{ count: number }`    |                                                          |
| `aggregate`               | `aggregate`              | `Dinâmico`               | Nome deve ser exato; recebe args nativos do Prisma; ignora `selectModels`, `pushWhere` e `requiredWhere` |
| `groupBy`               | `groupBy`              | `Dinâmico[]`               | Nome deve ser exato; recebe args nativos do Prisma; ignora `selectModels`, `pushWhere` e `requiredWhere` |

---

### Filtros de campo

Os filtros são sufixos aplicados ao nome do campo dentro do método. O campo em si vem capitalizado logo após o prefixo (ou após `By`).

| Sufixo             | Operador Prisma       | Argumento necessário |
| ------------------ | --------------------- | -------------------- |
| *(sem sufixo)*     | igualdade (`=`)       | sim                  |
| `Not`              | `not`                 | sim                  |
| `In`               | `in`                  | sim (array)          |
| `NotIn`            | `notIn`               | sim (array)          |
| `Contains`         | `contains`            | sim                  |
| `NotContains`      | `not.contains`        | sim                  |
| `StartsWith`       | `startsWith`          | sim                  |
| `NotStartsWith`    | `not.startsWith`      | sim                  |
| `EndsWith`         | `endsWith`            | sim                  |
| `NotEndsWith`      | `not.endsWith`        | sim                  |
| `GreaterThan`      | `gt`                  | sim                  |
| `GreaterThanEqual` | `gte`                 | sim                  |
| `LessThan`         | `lt`                  | sim                  |
| `LessThanEqual`    | `lte`                 | sim                  |
| `Between`          | `gte` + `lte`         | sim (tupla `[min, max]`) |
| `NotBetween`       | `not.gte` + `not.lte` | sim (tupla `[min, max]`) |
| `IsNull`           | `null`                | não                  |
| `IsNotNull`        | `not: null`           | não                  |
| `IsTrue`           | `true`                | não                  |
| `IsFalse`          | `false`               | não                  |
| `Insensitive`      | `mode: 'insensitive'` | combinador           |

`Insensitive` é um combinador e pode ser usado junto com outro filtro de texto:

```ts
findByNomeContainsInsensitive    // { nome: { contains: valor, mode: 'insensitive' } }
findByEmailStartsWithInsensitive // { email: { startsWith: valor, mode: 'insensitive' } }
findByNomeInsensitive            // { nome: { equals: valor, mode: 'insensitive' } }
```

`Between` e `NotBetween` recebem uma **tupla `[minValue, maxValue]`** e são ideais para filtros de intervalo em números, datas ou qualquer campo comparável:

```ts
methods: {
  findManyByIdadeBetween:          { map: true },
  findManyBySalarioNotBetween:     { map: true },
  findManyByCriadoEmBetween:       { map: true },
}

// Uso
await usuarioRepository.findManyByIdadeBetween([18, 65]);
await usuarioRepository.findManyBySalarioNotBetween([1000, 5000]);
await usuarioRepository.findManyByCriadoEmBetween([new Date("2024-01-01"), new Date("2024-12-31")]);
```

Gera (`findManyByIdadeBetween`):

```ts
{
  idade: { gte: 18, lte: 65 }
}
```

Gera (`findManyBySalarioNotBetween`):

```ts
{
  salario: { not: { gte: 1000, lte: 5000 } }
}
```

O sufixo `Optional` pode ser adicionado a qualquer campo para tornar o argumento opcional:

```ts
findByNomeOptionalAndEmail // nome é opcional (pode ser passado como undefined no parâmetro), email é obrigatório
```

---

### Operadores lógicos

| Operador  | Uso no nome                  | Exemplo                          |
| --------- | ---------------------------- | -------------------------------- |
| `And`     | entre dois campos            | `findByIdAndEmail`               |
| `Or`      | entre dois campos            | `findByNomeOrEmail`              |
| `AND`     | separa bloco final em `AND`  | `findByEmailOrNameANDActiveStatus` |

`AND` (em capslock) tem uma regra específica:

- Só pode existir **um** `AND` por método.
- Todos os campos (conectados por `And`) **depois** de `AND` são injetados dentro de `AND: []`.
- Depois de um `AND` não pode ter `Or`.

Exemplo:

```ts
methods: {
  findByIdAndEmail:   { map: true, fbMode: "one" },
  findByNomeOrEmail:  { map: true },
  findUniqueByIdOrEmailAndNome: { map: true },
  findByEmailOrNameANDActiveStatusAndIdadeGreaterThan: { map: true }
}

// Uso
await usuarioRepository.findByIdAndEmail(1, "joao@email.com");
await usuarioRepository.findByNomeOrEmail("Joao", "joao@email.com");
await usuarioRepository.findUniqueByIdOrEmailAndNome(1, "joao@email.com", "Joao");
await usuarioRepository.findByEmailOrNameANDActiveStatusAndIdadeGreaterThan("joao@email.com", "Joao", true, 17)
```

Gera (`findByIdAndEmail`):

```ts
{
  id: 1,
  email: "joao@email.com"
}
```

Gera (`findByNomeOrEmail`):

```ts
{
  OR: [
    { nome: "Joao" },
    { email: "joao@email.com" }
  ]
}
```

Gera (`findUniqueByIdOrEmailAndNome`):

```ts
{
  OR: [
    { id: 1 },
    {
      email: "joao@email.com",
      nome: "Joao"
    }
  ]
}
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

Exemplos:

```ts
methods: {
  findByPostagensSomeTituloContains:  { map: true },   // postagens: { some: { titulo: { contains: valor } } } >> (Busca usuários que o título de alguma postagem contém um valor)
  findByPerfilWithDescricaoIsNotNull: { map: true },   // perfil: { is: { descricao: { not: null } } } >> (Busca usuários em que a descrição do perfil não é nula)
  findByPerfilWithout:                { map: true },   // perfil: { isNot: {} } >> (Busca usuários sem perfil)
  findByPostagensSome:                { map: true },   // postagens: { some: {} } >> (Busca usuários com alguma postagem)
  findByPostagensEveryAtivoIsTrue:    { map: true },   // postagens: { every: { ativo: true } } >> (Busca usuários que todas as postagens estão ativas)
  findByPostagensNone:                { map: true },   // postagens: { none: {} } >> (Busca usuários sem postagens)
}
```

> [!NOTE]
> Teoricamente você pode usar `Every` sem `Field` (ele geraria { every: {} }), porém isso não produz um filtro efetivo. A condição é considerada verdadeira para qualquer relação, inclusive quando não existem registros relacionados, tornando o resultado equivalente a não aplicar filtro algum.

---

### Sufixos de paginação e ordenação

Aplicados ao **final** do nome do método (após os filtros de campo), eles injetam automaticamente os argumentos de paginação e ordenação.

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

Exemplos completos:

```ts
methods: {
  findManyPaginated:                    { map: true },
  findManyByAtivoOrderedAndPaginated:   { map: true },
  findByEmailOrderedAndPaginated:       { map: true },
  createManyAndReturnSkipDuplicates:    { map: true },
}

// Uso
await usuarioRepository.findManyPaginated({ skip: 0, take: 10 });

await usuarioRepository.findManyByAtivoOrderedAndPaginated(
  true,
  { dataCriacao: "desc" },
  { skip: 0, take: 10 }
);
```

`PaginationOptions`:

```ts
type PaginationOptions<TCursor = unknown> = {
  skip?: number;
  take?: number;
  cursor?: TCursor;
};
```

`OrderOptions`:

```ts
type OrderOptions = OrderPattern | OrderPattern[];
// Exemplo: { dataCriacao: "desc" } ou [{ dataCriacao: "desc" }, { nome: "asc" }]
```

---

### Configuração de métodos

Cada entrada em `methods` aceita as seguintes opções:

| Opção               | Tipo                            | Padrão       | Descrição                                                                                                    |
| ------------------- | ------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------ |
| `map`               | `boolean`                       | —            | **Obrigatório.** Define se o método será exposto no repository.                                             |
| `whereType`         | `'extending'` \| `'overwrite'`  | `extending`  | `extending` combina com `requiredWhere`. `overwrite` ignora o `requiredWhere`.                      |
| `selectModel`       | `keyof SelectModels \| false`   | —            | Sobrescreve o `defaultSelectModel` para este método.                                                        |
| `fbMode`            | `'one'` \| `'list'`             | `'list'`     | Somente para `findBy`. `'one'` retorna `T \| null`; `'list'` retorna `T[]`.                                 |
| `proxyTo`           | `Padrão de método válido`           | —            | Delega a lógica para outro padrão de método válido. Útil para methods com nomes personalizados.       |
| `pushWhere`         | `WhereModel<M>`                 | —            | Where extra adicionado à query além do `requiredWhere`.                                                     |
| `injectOrdenation`  | `OrdenationModel<M>`            | —            | Ordenação fixa injetada automaticamente na query.                                                           |
| `injectPagination`  | `PaginationModel<M>`            | —            | Paginação fixa injetada automaticamente na query.                                                           |

Exemplos:

```ts
methods: {
  // Retorna um único resultado em vez de array
  findByEmail: { map: true, fbMode: "one" },

  // Ignora o requiredWhere
  deleteManyByIdIn: { map: true, whereType: "overwrite" },

  // Usa um select model específico neste método
  findManyByAtivo: { map: true, selectModel: "minimal" },

  // Adiciona um where extra além do requiredWhere
  findManyByPerfil: { map: true, pushWhere: { deletedAt: null } },

  // Ordenação fixa sem precisar passar como argumento
  findManyPaginado: { map: true, injectOrdenation: { dataCriacao: "desc" } },

  // Nome personalizado precisa de proxyTo
  buscarPorEmailEPerfil: { map: true, proxyTo: "findByEmailAndPerfil" },
}
```

---

### Aggregate e GroupBy

Para utilizar operações de agrupamento e agregação do Prisma (`aggregate` e `groupBy`), você deve expô-las explicitamente na configuração dos métodos dinâmicos (`methods`):

```ts
const usuarioRepository = setupVSRepo<Usuario, "usuario">()({
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

#### Exemplo de uso do `aggregate`

O método `aggregate` permite calcular valores agregados (como média, soma, mínimo, máximo, contagem) sobre os registros:

```ts
const resultado = await usuarioRepository.aggregate({
  _count: {
    _all: true,
  },
  _avg: {
    idade: true,
  },
  _sum: {
    saldo: true,
  },
  where: {
    ativo: true,
  },
});

console.log(resultado._count._all); // Total de usuários ativos
console.log(resultado._avg.idade);   // Média de idade dos usuários ativos
console.log(resultado._sum.saldo);   // Soma dos saldos dos usuários ativos
```

#### Exemplo de uso do `groupBy`

O método `groupBy` permite agrupar registros por um ou mais campos para realizar operações de agregação em cada grupo:

```ts
const grupos = await usuarioRepository.groupBy({
  by: ["status"],
  _count: {
    status: true,
  },
  _avg: {
    idade: true,
  },
  having: {
    idade: {
      _avg: {
        gt: 18,
      },
    },
  },
});

for (const grupo of grupos) {
  console.log(`Status: ${grupo.status}`);
  console.log(`Quantidade: ${grupo._count.status}`);
  console.log(`Média de Idade: ${grupo._avg.idade}`);
}
```

---

## Relações no save

Configure relações para que o `save` as gerencie automaticamente. Essas mesmas relações também são usadas no `patch`. Para que as relações apareçam no autocomplete, o tipo genérico deve incluir as relações usando `GetPayload`:

```ts
import type { Prisma } from "../../generated/prisma/client";

type Usuario = Prisma.usuarioGetPayload<{
  include: { perfil: true; postagens: true };
}>;

const usuarioRepository = setupVSRepo<Usuario, "usuario">()({
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

Exemplos de uso com relações:

```ts
await usuarioRepository.save({
  nome: "Maria",
  email: "maria@email.com",
  senha: "password",
  perfil: {
    id: 1,
    bio: "Bio da Maria",
  },
  postagens: [
    { titulo: "Primeiro post", conteudo: "Olá!" },
  ],
});

await usuarioRepository.patch(1, {
  perfil: {
    id: 1,
    bio: "Bio atualizada",
  },
  postagens: [
    { id: 10, titulo: "Post revisado", conteudo: "Conteúdo ajustado" },
  ],
});
```

> **Dica:** Se o tipo genérico não incluir `include: { relação: true }`, o VSRepository ainda funcionará, mas o autocomplete não sugerirá as relações no `save`. O tipo recomendado é sempre `GetPayload<{ include: { /* suas relações */ } }>` para melhor experiência de desenvolvimento.

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

Observe que é possível diferentes repositories participarem da mesma transação.

---

## Estendendo um repository

```ts
const usuarioRepository = setupVSRepo<Usuario, "usuario">()({
  tableName: "usuario",
  pkName: "id",
  methods: {
    findByEmailEndsWith: { map: true, fbMode: "one" },
  },
})
  .build(prisma)
  .extend((repo) => ({
    buscarAtivosPorDominio: async (dominio: string) => {
      return repo.findByEmailEndsWith(`@${dominio}`);
    },

    ativarMultiplos: async (ids: string[]) => {
      return repo.updateManyByIdIn(ids, { ativo: true });
    },
  }));
```

---

## Tratamento de erros

O VSRepository lança `VSRepoError` e suas subclasses em situações específicas (OBS: Erros do Prisma não são sobrescritos como `VSRepoError`):

```ts
import { VSRepoError } from "../../generated/vsrepo";

try {
  const usuario = await usuarioRepository.get();
} catch (error) {
  if (error instanceof VSRepoError) {
    console.error("Erro no repository:", error.message);
  }
}
```

**Subclasses disponíveis:**

| Classe               | Quando é lançada                                        |
| -------------------- | ------------------------------------------------------- |
| `VSRepoConfigError`  | Configuração inválida em `setupVSRepo`       |
| `VSRepoBuildError`   | Nome de método inválido ou desconhecido no `build`      |
| `VSRepoExtendError`  | Argumento inválido em `extend`                          |
| `VSRepoRuntimeError` | Erro em tempo de execução durante uma operação          |

---

## Tipos utilitários

O VSRepository exporta os seguintes tipos para uso nas suas aplicações:

### Tipos de cliente

```ts
import type { DbClient, DbTransaction, ClientOrTransaction } from "../../generated/vsrepo";

type DbClient           = PrismaClient;
type DbTransaction      = Prisma.TransactionClient;
type ClientOrTransaction = DbClient | DbTransaction;
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
} from "../../generated/vsrepo";

// Select de um campo específico
type UsuarioSelect = SelectModel<"usuario">;

// Mapa de selects nomeados
type UsuarioSelectModels = SelectModels<"usuario">;

// Where clause do modelo
type UsuarioWhere = WhereModel<"usuario">;

// OrderBy do modelo
type UsuarioOrder = OrdenationModel<"usuario">;

// Opções de paginação com cursor tipado
type UsuarioPagination = PaginationModel<"usuario">;

// Payload de criação do modelo (para upsert)
type UsuarioUpsertInput = ModelUpsertInput<"usuario">;
```

### Todos os inputs do modelo

```ts
import type { PrismaModelInputs } from "../../generated/vsrepo";

type UsuarioInputs = PrismaModelInputs<"usuario">;
// Contém:
//   select, createInput, createManyInput, updateInput, updateManyInput,
//   whereInput, orderByInput, cursorInput, upsertCreateInput, upsertUpdateInput
```

### Tipos de opções de método

```ts
import type { MethodOptions, MethodOptionsModel } from "../../generated/vsrepo";

// MethodOptions<S> — opções passadas nos métodos do repository
// S = chave do select model ou false
type Opts = MethodOptions<"public" | "minimal">;

// MethodOptionsModel<TRepo> — derivado diretamente de uma instância VSRepository configurada
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

// Configuração de um método dinâmico
type MeuMethodConfig = MethodConfig<"usuario", typeof meuSelectModels>;

// Configuração completa do repository
type MeuRepoConfig = RepoConfig<Usuario, "usuario">;

// Configuração do build
type MeuBuildConfig = BuildConfig<"public" | "minimal">;

// Tipo de relações inferidas automaticamente
type UsuarioRelations = RepositoryRelations<Usuario>;

// Configuração de relação inferida a partir de um campo
type PerfilRelationConfig = ExtractRelationConfig<Usuario["perfil"]>;
```

### Tipo do repository construído

```ts
import type { RepositoryOf } from "../../generated/vsrepo";

// Inferência a partir de uma instância VSRepository (útil para injeção de dependência)
const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()({ ... });
type UsuarioRepository = RepositoryOf<typeof usuarioVSRepo>;
```

`RepositoryOf` aceita três parâmetros:

```ts
type RepositoryOf<TRepo, C extends BuildConfig | undefined = undefined, E = unknown>
//                        ^ BuildConfig (opcional)                       ^ tipo do extend (opcional)
```

Exemplo com extend tipado:

```ts
const extension = { buscarPorDominio: (dominio: string) => Promise<Usuario[]> };
type UsuarioRepositoryExtended = RepositoryOf<typeof usuarioVSRepo, undefined, typeof extension>;
```

### Tipos do payload dos métodos `save` e `patch`

Use `SaveObject` e `PatchObject` para extrair o tipo do payload esperado pelos métodos `save` e `patch` diretamente a partir de uma instância `VSRepository` configurada. Esses tipos combinam o input base do Prisma com as relações configuradas no repository.

```ts
import type { SaveObject, PatchObject } from "../../generated/vsrepo";
import type { Prisma } from "../../generated/prisma/client";

const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()({
  tableName: "usuario",
  pkName: "id",
  relations: {
    perfil: { pk: "id", mode: "oto", restriction: "set" },
    postagens: { pk: "id", mode: "otm", restriction: "add" },
  },
});

// Tipo do objeto aceito pelo .save()
type UsuarioSavePayload = SaveObject<Prisma.UsuarioCreateInput, typeof usuarioVSRepo>;

// Tipo do objeto aceito pelo .patch()
type UsuarioPatchPayload = PatchObject<Prisma.UsuarioUpdateInput, typeof usuarioVSRepo>;
```

> Útil para tipar DTOs, funções auxiliares ou serviços que chamam `save`/`patch` e precisam do tipo correto do payload sem referenciar diretamente os tipos internos do Prisma.

---

## API Reference

### `setupVSRepo<T, M>()(config)`

```ts
setupVSRepo<TPayload, TTableName>()({
  tableName: Uncapitalize<M>;         // Nome da tabela no Prisma
  pkName: keyof T;                    // Nome da primary key
  selectModels?: SelectModels<M>;     // Projeções de dados nomeadas
  defaultSelectModel?: keyof SM;      // Select aplicado por padrão
  requiredWhere?: WhereModel<M>;      // Filtros sempre aplicados
  relations?: RepositoryRelations<T>; // Configuração de relações
  methods?: Record<string, MethodConfig<M, SM>>; // Métodos dinâmicos
});
```

### `.build(prisma, config?)`

```ts
vsRepo.build(prisma, {
  freeze?: boolean;        // Congela o objeto (default = true)
  showWorking?: boolean;   // Exibe logs internos no console (default = false)

  // `active` serve para definir se o método vai existir depois do build (default = true)
  // `defaultSelect` serve para definir qual `selectModel` esse método vai usar por default (default = `defaultSelectModel` definido no `setupVSRepo`)
  // `ignoreRequiredWhere` serve para definir se o método vai ignorar o `requiredWhere` definido no `setupVSRepo` (default = false)
  baseMethods?: {
    // Métodos que podem utilizar um `defaultSelect`
    get?:       { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getOrThrow?:{ active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    remove?:    { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    save?:      { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    patch?:     { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };
    getAll?:    { active?: boolean; defaultSelect?: string; ignoreRequiredWhere?: boolean };

    // Métodos que NÃO aceitam `defaultSelect`
    removeList?: { active?: boolean; ignoreRequiredWhere?: boolean };
    total?:      { active?: boolean; ignoreRequiredWhere?: boolean };
    has?:        { active?: boolean; ignoreRequiredWhere?: boolean };
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

- Node.js 16+ (ESM)
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
