# DynamicRepository (Abordagem baseada em classes)

🇧🇷 Você está lendo a versão em português. [🇺🇸 Read in English](./README-DynamicRepo.md)

O VSRepository oferece duas formas de criar repositórios: a abordagem funcional `setupVSRepo` e a abordagem OOP baseada em classes `DynamicRepository`. Este documento cobre a abordagem baseada em classes usando `DynamicRepository` e o decorator `@DynamicMethod`.

> Para a abordagem funcional, veja o [README.pt-BR.md](./README.pt-BR.md) principal.

## Sumário

- [Quando usar o DynamicRepository](#quando-usar-o-dynamicrepository)
- [Requisitos](#requisitos)
- [Criando uma classe](#criando-uma-classe)
- [O decorator @DynamicMethod](#o-decorator-dynamicmethod)
- [Opções de configuração do decorator](#opções-de-configuração-do-decorator)
- [Métodos base](#métodos-base)
- [Trabalhando com relações](#trabalhando-com-relações)
- [Transações](#transações)
- [Trabalhando com includes](#trabalhando-com-includes)
- [DynamicMethodOptions](#dynamicmethodoptions)
- [Integração com NestJS](#integração-com-nestjs)
- [Referência da API](#referência-da-api)
- [Diferenças em relação ao setupVSRepo](#diferenças-em-relação-ao-setupvsrepo)

---

## Quando usar o DynamicRepository

Use `DynamicRepository` quando preferir um **estilo OOP com decorators** em vez da abordagem funcional `setupVSRepo`. Características principais:

- Métodos são definidos como campos `declare` com decorators `@DynamicMethod()`
- O repositório é uma classe que você pode estender e injetar via injeção de dependência
- `selectModels` e `includeModels` **não são suportados** (use `include` bruto via `DynamicMethodOptions`)
- Os métodos base estão sempre ativos (sem toggle `active` por método)
- O repositório é construído automaticamente no construtor (sem chamada explícita a `.build()`)

---

## Requisitos

`DynamicRepository` depende dos decorators legados do TypeScript, então o `tsconfig.json` do seu projeto precisa ter:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true
  }
}
```

`reflect-metadata` já é uma dependência do `vsrepo` e é importado internamente — você não precisa importá-lo manualmente.

Sem `experimentalDecorators: true`, o `@DynamicMethod()` não vai compilar (ou vai falhar silenciosamente ao registrar o método em tempo de execução, dependendo da sua ferramenta de build).

---

## Criando uma classe

Estenda `DynamicRepository` com quatro parâmetros genéricos:

```typescript
import {
    DynamicRepository,
    DynamicMethod,
    DynamicMethodOptions,
    PaginationModel,
} from "../../generated/vsrepo";
import type { Prisma } from "../../generated/prisma/client";
import { PrismaClient } from "../../generated/prisma/client";

type User = Prisma.UserGetPayload<{
    include: { address: true; posts: true };
}>;

class UserRepository extends DynamicRepository<
    User,        // Tipo da entidade (com relações incluídas)
    "User",      // Nome do modelo no Prisma
    string,      // Tipo da chave primária
    { address: true; posts: true }  // Quais campos são relações (flags)
> {
    constructor(prisma: PrismaClient) {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            relations: {
                address: { mode: "oto", pk: "id", restriction: "set" },
                posts: { mode: "otm", pk: "id", restriction: "add" },
            },
            requiredWhere: { active: true },
            build: {
                showWorking: false,
                baseMethods: {
                    save: { ignoreRequiredWhere: true },
                },
            },
        });
    }
}
```

**Parâmetros genéricos:**

| Parâmetro | Descrição |
|-----------|-------------|
| `TEntity` | O tipo completo da entidade, incluindo as relações que você quer disponíveis |
| `UName` | O nome do modelo no Prisma como string literal (capitalizado, ex.: `"User"`) |
| `VPKType` | O tipo da chave primária (`string`, `number`, etc.) |
| `WRelations` | Um objeto de flags indicando quais campos são relações (ex.: `{ address: true }`) |

---

## O decorator @DynamicMethod

Declare métodos dinâmicos como campos de classe usando `declare` e decore-os com `@DynamicMethod()`:

```typescript
class UserRepository extends DynamicRepository<User, "User", string> {
    // Método dinâmico simples - o nome determina o comportamento
    @DynamicMethod()
    declare findByEmail: (email: string) => Promise<User | null>;

    // Com configuração do decorator
    @DynamicMethod<"User">({ proxyTo: "findMany", pushWhere: { active: false } })
    declare findDisabled: () => Promise<User[]>;

    // Proxy para outro método
    @DynamicMethod<"User">({ proxyTo: "findOneByEmail", whereType: "overwrite" })
    declare findInternalByEmail: (email: string) => Promise<User | null>;
}
```

O **nome** do método determina o comportamento (mesmas regras da abordagem funcional). O objeto de configuração do decorator ajusta esse comportamento.

> **Importante:** Sempre use `declare` (não uma propriedade comum) para campos decorados. O decorator fornece metadados em tempo de execução; a palavra-chave `declare` informa ao TypeScript que a propriedade existe sem emitir código de inicialização.

---

## Opções de configuração do decorator

O decorator `@DynamicMethod<M>()` aceita um objeto de configuração opcional:

```typescript
@DynamicMethod<"User">({
    proxyTo: "findByEmail",           // Delega para outro padrão de método
    whereType: "overwrite",           // "extending" (padrão) ou "overwrite"
    pushWhere: { active: false },      // Cláusula where extra
    injectOrdenation: [{ name: "asc" }],  // Ordenação fixa
    injectPagination: { skip: 0, take: 10 },  // Paginação fixa
})
```

| Opção | Tipo | Descrição |
|--------|------|-------------|
| `proxyTo` | `string` | Delega para outro padrão de método válido (ex.: `"findOneByEmail"`) |
| `whereType` | `"extending" \| "overwrite"` | `extending` combina com `requiredWhere`; `overwrite` o ignora |
| `pushWhere` | `WhereModel<M>` | Cláusula `where` extra adicionada além do `requiredWhere` |
| `injectOrdenation` | `OrdenationModel<M>` | Ordenação fixa injetada na query |
| `injectPagination` | `PaginationModel<M>` | Paginação fixa injetada na query |
| `fbMode` | `"one" \| "list"` | **Deprecated.** Relevante apenas para métodos com prefixo `findBy`. Use `findOneBy` em vez disso se quiser um resultado único. |

---

## Métodos base

Todas as instâncias de `DynamicRepository` incluem automaticamente estes métodos:

| Método | Descrição |
|--------|-------------|
| `get(pk)` | Busca um registro pela chave primária |
| `getOrThrow(pk)` | Busca pela PK, lança erro se não encontrado |
| `getList(pks)` | Busca múltiplos registros pelas PKs |
| `save(obj)` | Cria ou faz upsert de um registro |
| `saveList(objs)` | Salva em lote em uma transação automática |
| `patch(pk, obj)` | Atualização parcial pela PK |
| `patchList(tuples)` | Atualização parcial em lote via tuplas `[pk, obj]` |
| `merge(pk, obj)` | Busca e faz deep-merge em memória (não persiste) |
| `remove(pk)` | Apaga um registro pela PK |
| `removeList(pks)` | Apaga em lote pelas PKs |
| `getAll()` | Busca todos os registros (respeita `requiredWhere`). Aceita `pagination` e `order` em `options` — veja abaixo |
| `total()` | Conta todos os registros |
| `has(pk)` | Verifica se um registro existe |
| `softRemove(pk)` | Soft-delete (requer configuração de `softRemovekName`) |
| `softRemoveList(pks)` | Soft-delete em lote |
| `restore(pk)` | Restaura registro com soft-delete |
| `restoreList(pks)` | Restauração em lote |

Todos os métodos aceitam um argumento opcional `options` baseado em `DynamicMethodOptions` (`db`, `see`, `include`), mas alguns métodos restringem esse tipo:

- **`getAll`** aceita adicionalmente `pagination?: PaginationOptions` e `order?: OrdenationModel<UName>` (usa `defaultOrdenation` quando omitido).
- **`saveList` / `patchList`** omitem `include`, e `db` só aceita uma `DbTransaction` (o retorno de `prisma.$transaction`) — não o client Prisma comum.
- **`removeList`, `total`, `has`** omitem `include`.
- **`softRemove`, `restore`** omitem `see` (a visibilidade de soft-delete não se aplica ao registro sendo alterado).
- **`softRemoveList`, `restoreList`** omitem tanto `see` quanto `include`.

```typescript
// getAll com paginação e ordenação
const page = await userRepository.getAll({
    pagination: { skip: 0, take: 20 },
    order: { createdAt: "desc" },
});
```

---

## Trabalhando com relações

Configure as relações no construtor para que `save` e `patch` as gerenciem automaticamente:

```typescript
class UserRepository extends DynamicRepository<
    User, "User", string,
    { address: true; posts: true }
> {
    constructor(prisma: PrismaClient) {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            relations: {
                address: { mode: "oto", pk: "id", restriction: "set" },
                posts: { mode: "otm", pk: "id", restriction: "add" },
            },
        });
    }
}
```

O quarto parâmetro genérico (`WRelations`) deve sinalizar quais campos são relações. Isso garante que `DynamicSaveInput` e `DynamicPatchInput` resolvam esses campos para o formato de payload aninhado de create/update do Prisma.

**Modos de relação:** `oto` (um-para-um), `otm` (um-para-muitos), `mto` (muitos-para-um), `mtm` (muitos-para-muitos).

**Restrições:** `set` (substitui tudo) ou `add` (adiciona/atualiza sem remover).

Veja o [README.pt-BR.md](./README.pt-BR.md#relações-no-save) principal para todos os detalhes sobre o comportamento das relações.

---

## Transações

Todos os métodos aceitam `{ db: tx }` para participar de uma transação:

```typescript
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.save(
        { name: "Mary", email: "mary@email.com", password: "password" },
        { db: tx }
    );

    await postRepository.save(
        { title: "First Post", authorId: user.id },
        { db: tx }
    );
});
```

Acesse o client do Prisma via `repository.prisma`.

---

## Trabalhando com includes

`DynamicRepository` não suporta `includeModels` (presets nomeados), mas você pode usar um `include` bruto do Prisma via `DynamicMethodOptions`:

```typescript
// Incluir apenas address
const user = await userRepository.get(id, {
    include: { address: true },
});

// Include aninhado
const userFull = await userRepository.get(id, {
    include: {
        address: true,
        posts: { include: { tags: true } },
    },
});

// Funciona em qualquer método que aceite options
const all = await userRepository.getAll({
    include: { posts: true },
});
```

---

## DynamicMethodOptions

Todo método base e todo método dinâmico decorado aceita um segundo argumento opcional do tipo `DynamicMethodOptions`. Esse objeto tem três campos opcionais:

```typescript
type DynamicMethodOptions<TName extends PrismaModelName> = {
    db?: ClientOrTransaction;          // Client ou transação do Prisma
    see?: "active" | "removed" | "all"; // Visibilidade do soft-delete
    include?: IncludeModel<TName>;      // Include bruto do Prisma
};
```

### `db` — Usando uma transação

Passe `{ db: tx }` para direcionar uma única chamada de método para dentro de uma transação existente:

```typescript
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.save(
        { name: "Mary", email: "mary@email.com", password: "password" },
        { db: tx },
    );

    await postRepository.save(
        { title: "First Post", authorId: user.id },
        { db: tx },
    );
});
```

Você também pode usar a transação para leituras:

```typescript
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.get(id, { db: tx });
    const total = await userRepository.total({ db: tx });
});
```

### `see` — Visibilidade do soft-delete

Se `softRemovekName` estiver configurado, o campo `see` controla quais registros ficam visíveis:

| Valor | Comportamento |
|-------|----------|
| `"active"` (padrão) | Apenas registros não removidos |
| `"removed"` | Apenas registros com soft-delete |
| `"all"` | Registros ativos e removidos |

```typescript
// Busca apenas usuários com soft-delete
const deleted = await userRepository.getAll({ see: "removed" });

// Busca todos os usuários, incluindo os com soft-delete
const all = await userRepository.getAll({ see: "all" });

// Restaura um usuário com soft-delete buscando-o primeiro
const [removed] = await userRepository.getAll({ see: "removed", include: { address: true } });
```

### `include` — Include bruto do Prisma

Use `include` para carregar relações de forma antecipada (eager loading) em qualquer chamada de método. É o equivalente ao `includeModels` da abordagem funcional, mas com a sintaxe bruta de include do Prisma:

```typescript
// Include simples
const user = await userRepository.get(id, {
    include: { address: true },
});

// Include aninhado
const userFull = await userRepository.get(id, {
    include: {
        address: true,
        posts: { include: { author: true } },
    },
});

// Também funciona em métodos dinâmicos
const admin = await userRepository.findAdminByEmail(email, {
    include: { address: true, posts: true },
});
```

### Combinando opções

Os três campos podem ser usados juntos:

```typescript
// Dentro de uma transação, busca um usuário com relações, incluindo os com soft-delete
await userRepository.prisma.$transaction(async (tx) => {
    const user = await userRepository.get(id, {
        db: tx,
        see: "all",
        include: { address: true, posts: true },
    });
});
```

---

## Integração com NestJS

`DynamicRepository` funciona naturalmente com a injeção de dependência do NestJS.

### Provider do repositório

```typescript
// src/modules/user/user.repository.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { DynamicRepository, DynamicMethod, DynamicMethodOptions } from "../../../generated/vsrepo";

type User = /* Prisma UserGetPayload com relações */;

@Injectable()
class UserRepository extends DynamicRepository<User, "User", string, { profile: true }> {
    constructor(prisma: PrismaService) {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            relations: {
                profile: { mode: "oto", pk: "id", restriction: "add" },
            },
            build: {
                baseMethods: {
                    save: { ignoreRequiredWhere: true },
                },
            },
        });
    }

    @DynamicMethod()
    declare findByEmail: (email: string, options?: DynamicMethodOptions<"User">) => Promise<User | null>;
}

```

### Registrando o módulo

```typescript
// src/modules/user/user.module.ts
import { Module } from "@nestjs/common";
import { UserRepository } from "./user.repository";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";

@Module({
    providers: [UserRepository, UserService],
    controllers: [UserController],
    exports: [UserService],
})
export class UserModule {}
```

### Usando em um service

```typescript
// src/modules/user/user.service.ts
import { Injectable, Inject } from "@nestjs/common";
import { UserRepository } from "./user.repository";

@Injectable()
export class UserService {
    constructor(
        private readonly userRepository: UserRepository,
    ) {}

    async getUserById(id: string) {
        return this.userRepository.get(id);
    }

    async getUserAuthByEmailWithProfile(email: string) {
        return this.userRepository.findByEmail(email, { include: { profile: true } });
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

---

## Referência da API

### `DynamicRepository<TEntity, UName, VPKType, WRelations>`

```typescript
abstract class DynamicRepository<
    TEntity extends object,
    UName extends PrismaModelName,
    VPKType,
    WRelations extends Partial<Record<keyof TEntity, true>> | undefined = undefined,
>
```

**Construtor:**

```typescript
constructor(prisma: DbClient, config: DynamicRepositoryConstructorConfig<TEntity, UName>)
```

### DynamicRepositoryConstructorConfig

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `tableName` | `Uncapitalize<UName>` | Nome da tabela no Prisma |
| `pkName` | `keyof TEntity` | Campo da chave primária |
| `softRemovekName?` | `keyof TEntity` | Campo DateTime para soft-delete |
| `requiredWhere?` | `WhereModel<UName>` | Filtros globais |
| `defaultOrdenation?` | `OrdenationModel<UName>` | Ordenação padrão |
| `relations?` | `RepositoryRelations<TEntity>` | Configuração de relações |
| `build?` | `DynamicRepositoryBuildConfig` | Opções de build |

### DynamicRepositoryBuildConfig

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `showWorking?` | `boolean` | Exibe logs internos (padrão: `false`) |
| `baseMethods?` | `Record<string, { ignoreRequiredWhere?: boolean }>` | Configuração por método |

### @DynamicMethod<M>(config?)

```typescript
function DynamicMethod<M extends PrismaModelName>(
    config?: DynamicMethodConfig<M>,
): PropertyDecorator;
```

### DynamicMethodOptions<TName>

| Propriedade | Tipo | Descrição |
|----------|------|-------------|
| `db?` | `ClientOrTransaction` | Client ou transação do banco de dados |
| `see?` | `"active" \| "removed" \| "all"` | Visibilidade do soft-delete |
| `include?` | `IncludeModel<TName>` | Include bruto do Prisma |

---

## Diferenças em relação ao setupVSRepo

| Aspecto | `setupVSRepo` | `DynamicRepository` |
|--------|---------------|---------------------|
| **Estilo** | Funcional / curried | OOP / baseado em classes |
| **Métodos definidos via** | Objeto de configuração `methods` | Decorators `@DynamicMethod()` |
| **selectModels** | Suportado | Não suportado |
| **includeModels** | Suportado | Não suportado |
| **Select padrão** | Configuração `defaultSelectModel` | Não disponível |
| **Etapa de build** | `.build(prisma)` explícito | Automático no construtor |
| **Toggles de método base** | `active`, `defaultSelect` por método | Sempre ativo, sem defaultSelect |
| **Instância do Prisma** | Passada no `.build()` | Passada para `super()` no construtor |
| **Extensibilidade** | Método `.extend()` | Herança de classe |
| **Includes brutos** | Via `options.include` | Via `DynamicMethodOptions.include` |
