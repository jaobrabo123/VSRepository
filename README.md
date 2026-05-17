# VSRepo

Biblioteca de repository para projetos que usam Prisma. Ela permite criar repositories tipados com métodos base (`get`, `save` e `remove`) e métodos dinâmicos mapeados pelo nome, como `findByEmail`, `findManyPaginated`, `updateById` e `deleteManyByIdIn`.

## Instalação

```bash
pnpm add vsrepo @prisma/client
```

O Prisma Client deve estar configurado no projeto:

```bash
pnpm prisma generate
```

## Uso básico

Crie uma instância do Prisma Client:

```ts
// src/db.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

Depois crie o repository do modelo:

```ts
// src/repositories/usuarioRepository.ts
import prisma from "../db";
import { setupVSRepo, type SelectModels, type WhereModel } from "vsrepo";
import type { Prisma } from "@prisma/client";

type Usuario = Prisma.usuarioGetPayload<{
  include: {
    perfil: true;
    postagens: true;
  };
}>;

const usuarioSelectModels = {
  public: {
    id: true,
    nome: true,
    email: true,
  },
  minimal: {
    id: true,
  },
} satisfies SelectModels<"usuario">;

const usuarioRequiredWhere = {
  ativo: true,
} satisfies WhereModel<"usuario">;

const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()({
  tableName: "usuario",
  pkName: "id",
  selectModels: usuarioSelectModels,
  defaultSelectModel: "public",
  requiredWhere: usuarioRequiredWhere,
  methods: {
    findByEmail: { map: true, fbMode: "one" },
    findManyPaginated: { map: true },
    updateById: { map: true },
    deleteManyByIdIn: { map: true, whereType: "overwrite" },
    count: { map: true },
  },
});

const usuarioRepository = usuarioVSRepo.build(prisma);

export default usuarioRepository;
```

Use o repository na aplicação:

```ts
import usuarioRepository from "./repositories/usuarioRepository";

const usuario = await usuarioRepository.save({
  nome: "Joao",
  email: "joao@email.com",
  senha: "password",
});

const usuarioEncontrado = await usuarioRepository.get(usuario.id);

const porEmail = await usuarioRepository.findByEmail("joao@email.com");

await usuarioRepository.updateById(usuario.id, {
  nome: "Joao Pedro",
});

await usuarioRepository.remove(usuario.id);
```

## Métodos base

Ao chamar `build(prisma)`, o VSRepo cria três métodos por padrão:

| Método | Descrição |
| --- | --- |
| `get(pk, options?)` | Busca um registro pela primary key definida em `pkName`. |
| `save(obj, options?)` | Cria ou atualiza um registro. Se `obj` tiver a primary key, usa `upsert`; se não tiver, usa `create`. |
| `remove(pk, options?)` | Remove um registro pela primary key. |

Você pode configurar esses métodos no `build`:

```ts
const usuarioRepository = usuarioVSRepo.build(prisma, {
  freeze: true,
  showWorking: false,
  baseMethods: {
    get: {
      active: true,
      defaultSelect: "public",
    },
    remove: {
      defaultSelect: "minimal",
    },
    save: {
      active: true,
    },
  },
});
```

## Select models

`selectModels` define selects reutilizáveis do Prisma. O `defaultSelectModel` é aplicado quando o método não recebe outro select.

```ts
const usuario = await usuarioRepository.get(id, {
  selectModel: "minimal",
});

const usuarioCompleto = await usuarioRepository.get(id, {
  selectModel: false,
});
```

Use `selectModel: false` para não aplicar nenhum select model e deixar o Prisma retornar o payload padrão.

## Métodos dinâmicos

Métodos dinâmicos são declarados em `methods` com `map: true`. O nome do método informa qual operação do Prisma será usada e quais campos entram no `where`.

Exemplos:

```ts
methods: {
  findUniqueByIdAndEmail: { map: true },
  findByNomeContainsInsensitive: { map: true },
  findManyPaginated: { map: true },
  findListWhereOrderedAndPaginated: { map: true, whereType: "overwrite" },
  createManyAndReturn: { map: true },
  updateById: { map: true },
  deleteManyByIdIn: { map: true, whereType: "overwrite" },
  existsByEmail: { map: true },
  countByPerfil: { map: true },
}
```

Uso:

```ts
const usuario = await usuarioRepository.findUniqueByIdAndEmail(id, email);

const usuarios = await usuarioRepository.findByNomeContainsInsensitive("joao");

const pagina = await usuarioRepository.findManyPaginated({
  take: 10,
  skip: 0,
});

const ordenado = await usuarioRepository.findListWhereOrderedAndPaginated(
  { nome: { startsWith: "A" } },
  { dataCriacao: "desc" },
  { take: 10 }
);
```

## Filtros pelo nome do método

O VSRepo interpreta sufixos no nome dos métodos para montar o `where`:

| Padrão | Exemplo |
| --- | --- |
| `And` / `Or` | `findByIdAndEmail`, `findByNomeOrEmail` |
| `In` / `NotIn` | `deleteManyByIdIn` |
| `Contains` / `StartsWith` / `EndsWith` | `findByNomeContains` |
| `Insensitive` | `findByNomeContainsInsensitive` |
| `GreaterThan` / `GreaterThanEqual` | `findByIdadeGreaterThan` |
| `LessThan` / `LessThanEqual` | `findByIdadeLessThanEqual` |
| `IsNull` / `IsNotNull` | `findByPerfilIsNotNull` |
| `IsTrue` / `IsFalse` | `findByAtivoIsTrue` |
| `Some` / `Every` / `None` | `findByPostagensSomeTituloContains` |
| `With` / `Without` | `findByPerfilWith`, `findByPerfilWithout` |

## Relações no `save`

Configure `relations` para que `save` consiga criar, conectar, atualizar ou remover relações junto com o registro principal.

```ts
const usuarioVSRepo = setupVSRepo<Usuario, "usuario">()({
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
      restriction: "set",
    },
  },
});
```

Modos disponíveis:

| Modo | Relação |
| --- | --- |
| `oto` | one-to-one |
| `otm` | one-to-many |
| `mto` | many-to-one |
| `mtm` | many-to-many |

`restriction: "set"` substitui o conjunto atual quando aplicável. `restriction: "add"` adiciona/conecta sem limpar os registros já relacionados.

## Transações

Todos os métodos aceitam `options.db`. Use isso para executar operações dentro de uma transação do Prisma:

```ts
await prisma.$transaction(async (tx) => {
  const usuario = await usuarioRepository.save(
    {
      nome: "Maria",
      email: "maria@email.com",
      senha: "password",
    },
    { db: tx }
  );

  await usuarioRepository.updateById(
    usuario.id,
    { ativo: true },
    { db: tx }
  );
});
```

## Estendendo um repository

Use `extend` para adicionar métodos manuais mantendo os métodos gerados:

```ts
const repository = usuarioVSRepo
  .build(prisma)
  .extend((repo) => ({
    async buscarAtivosPorDominio(dominio: string) {
      return repo.findByEmailEndsWith(`@${dominio}`);
    },
  }));
```

## Scripts do projeto

```bash
pnpm test:usuario
pnpm test:base-methods:user
```
