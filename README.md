# VSRepo

Biblioteca de repository para projetos que usam Prisma.  
O VSRepository permite criar repositories tipados com métodos base (`get`, `save` e `remove`) e métodos dinâmicos inferidos pelo nome, como:

- `findByEmail`
- `findManyPaginated`
- `updateById`
- `deleteManyByIdIn`

Tudo com inferência automática baseada no Prisma Client do próprio projeto.

---

# Instalação

Instale o VSRepository e o Prisma Client:

```bash
npm i vsrepo @prisma/client
```

Gere o Prisma Client:

```bash
npx prisma generate
```

---

# Gerando os tipos do VSRepository

O VSRepository precisa conhecer o caminho real do seu Prisma Client para gerar as tipagens corretamente.

## Comando padrão

```bash
npx vsrepo generate
```

Equivale a:

```bash
npx vsrepo generate \
  --output src/generated/vsrepo \
  --prisma src/generated/prisma
```

---

# Flags disponíveis

| Flag         | Alias | Default                   |
| ------------- | ----- | ------------------------- |
| `--output`    | `-o`  | `src/generated/vsrepo`    |
| `--prisma`    | `-p`  | `src/generated/prisma`    |

---

# O que esse comando faz

O script:

1. Lê os arquivos de tipagem internos do VSRepository
2. Substitui automaticamente o import do Prisma
3. Gera uma façade tipada dentro da pasta definida em `--output`

Arquivos gerados:

```txt
src/generated/vsrepo/
├── VSRepoError.ts
├── VSRepoError.types.d.ts
├── VSRepository.ts
├── VSRepository.types.d.ts
└── index.ts
```

---

# Como importar depois

Após gerar os arquivos:

```ts
import { setupVSRepo } from "../generated/vsrepo";
```

ou:

```ts
import {
  setupVSRepo,
  type SelectModels,
  type WhereModel,
} from "../generated/vsrepo";
```

Você NÃO deve mais importar diretamente de `vsrepo`.

---

# Uso básico

## Criando o Prisma Client

```ts
// src/configs/db.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default prisma;
```

---

# Criando um repository

```ts
// src/repositories/usuarioRepository.ts

import prisma from "../configs/db";

import {
  setupVSRepo,
  type SelectModels,
  type WhereModel,
} from "../generated/vsrepo";

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
    findByEmail: {
      map: true,
      fbMode: "one",
    },

    findManyPaginated: {
      map: true,
    },

    updateById: {
      map: true,
    },

    deleteManyByIdIn: {
      map: true,
      whereType: "overwrite",
    },

    count: {
      map: true,
    },
  },
});

const usuarioRepository = usuarioVSRepo.build(prisma);

export default usuarioRepository;
```

---

# Usando o repository

```ts
import usuarioRepository from "./repositories/usuarioRepository";

const usuario = await usuarioRepository.save({
  nome: "Joao",
  email: "joao@email.com",
  senha: "password",
});

const usuarioEncontrado = await usuarioRepository.get(usuario.id);

const porEmail = await usuarioRepository.findByEmail(
  "joao@email.com",
);

await usuarioRepository.updateById(usuario.id, {
  nome: "Joao Pedro",
});

await usuarioRepository.remove(usuario.id);
```

---

# Métodos base

Ao executar:

```ts
.build(prisma)
```

o VSRepository cria automaticamente:

| Método       | Descrição               |
| ------------ | ----------------------- |
| `get(pk)`    | Busca pela primary key  |
| `save(obj)`  | Cria ou atualiza        |
| `remove(pk)` | Remove pela primary key |

---

# Configurando métodos base

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

---

# Select models

`selectModels` cria selects reutilizáveis.

```ts
const usuario = await usuarioRepository.get(id, {
  selectModel: "minimal",
});
```

Para retornar o payload padrão do Prisma:

```ts
const usuarioCompleto = await usuarioRepository.get(id, {
  selectModel: false,
});
```

---

# Métodos dinâmicos

Métodos dinâmicos são definidos em:

```ts
methods: {}
```

Exemplo:

```ts
methods: {
  findUniqueByIdAndEmail: {
    map: true,
  },

  findByNomeContainsInsensitive: {
    map: true,
  },

  findManyPaginated: {
    map: true,
  },

  findListWhereOrderedAndPaginated: {
    map: true,
    whereType: "overwrite",
  },

  createManyAndReturn: {
    map: true,
  },

  updateById: {
    map: true,
  },

  deleteManyByIdIn: {
    map: true,
    whereType: "overwrite",
  },

  existsByEmail: {
    map: true,
  },

  countByPerfil: {
    map: true,
  },
}
```

---

# Exemplos de uso

```ts
const usuario = await usuarioRepository.findUniqueByIdAndEmail(
  id,
  email,
);

const usuarios =
  await usuarioRepository.findByNomeContainsInsensitive(
    "joao",
  );

const pagina = await usuarioRepository.findManyPaginated({
  take: 10,
  skip: 0,
});

const ordenado =
  await usuarioRepository.findListWhereOrderedAndPaginated(
    {
      nome: {
        startsWith: "A",
      },
    },

    {
      dataCriacao: "desc",
    },

    {
      take: 10,
    },
  );
```

---

# Filtros suportados

| Padrão             | Exemplo                             |
| ------------------ | ----------------------------------- |
| `And` / `Or`       | `findByIdAndEmail`                  |
| `In` / `NotIn`     | `deleteManyByIdIn`                  |
| `Contains`         | `findByNomeContains`                |
| `StartsWith`       | `findByNomeStartsWith`              |
| `EndsWith`         | `findByEmailEndsWith`               |
| `Insensitive`      | `findByNomeContainsInsensitive`     |
| `GreaterThan`      | `findByIdadeGreaterThan`            |
| `LessThanEqual`    | `findByIdadeLessThanEqual`          |
| `IsNull`           | `findByPerfilIsNull`                |
| `IsTrue`           | `findByAtivoIsTrue`                 |
| `Some`             | `findByPostagensSomeTituloContains` |
| `With` / `Without` | `findByPerfilWith`                  |

---

# Relações no save

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

## Modos disponíveis

| Modo  | Relação      |
| ----- | ------------ |
| `oto` | one-to-one   |
| `otm` | one-to-many  |
| `mto` | many-to-one  |
| `mtm` | many-to-many |

---

# Transações

Todos os métodos aceitam:

```ts
options.db;
```

Exemplo:

```ts
await prisma.$transaction(async (tx) => {
  const usuario = await usuarioRepository.save(
    {
      nome: "Maria",
      email: "maria@email.com",
      senha: "password",
    },

    {
      db: tx,
    },
  );

  await usuarioRepository.updateById(
    usuario.id,

    {
      ativo: true,
    },

    {
      db: tx,
    },
  );
});
```

---

# Extendendo um repository

```ts
const repository = usuarioVSRepo
  .build(prisma)

  .extend((repo) => ({
    async buscarAtivosPorDominio(dominio: string) {
      return repo.findByEmailEndsWith(`@${dominio}`);
    },
  }));
```

---

# Estrutura recomendada

```txt
src/
├── configs/
│   └── db.ts
├── generated/
│   ├── prisma/
│   └── vsrepo/
├── repositories/
└── services/
```

---

# Scripts úteis

```bash
npx prisma generate

npx vsrepo generate
```

ou:

```bash
npx vsrepo generate \
  --output src/generated/vsrepo \
  --prisma src/generated/prisma
```

---

# Requisitos

- TypeScript (Pode ser usado com JavaScript, mas perde a segurança da tipagem)
- Prisma
- Node.js ESM
- `"moduleResolution": "bundler"` ou `"nodenext"`

Exemplo:

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```