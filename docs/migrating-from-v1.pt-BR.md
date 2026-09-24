<a id="top"></a>

🇧🇷 Português | [🇺🇸 English](./migrating-from-v1.md)

[← Voltar para o índice da documentação](./README.pt-BR.md)

# Migrando da v1

A v1 foi o release original do VSRepository, **apenas para Prisma**. A v2 — a versão atual — é uma reescrita que tornou o núcleo **agnóstico de ORM**: em vez de falar diretamente com o Prisma, toda operação é delegada a um `VSRepoAdapter` plugável, permitindo que a mesma API de repository funcione com Prisma, Drizzle ou qualquer outro ORM/banco que implemente o contrato de adapter.

O código-fonte e a documentação da v1 vivem na branch dedicada [`v1`](https://github.com/jaobrabo123/VSRepository/tree/v1), para quem ainda precisar do release anterior baseado apenas em Prisma.

Esta página é a referência única do que mudou entre a v1 e a v2. Se você está migrando um repository existente da v1, o [passo a passo resumido](#migrando-um-repository-da-v1-para-a-v2) abaixo resume o caminho; a [tabela de comparação completa](#comparação-v1-vs-v2) cobre cada área em detalhe.

## Comparação v1 vs v2

| Área | v1 | v2 |
| --- | --- | --- |
| Acesso ao banco | Fala diretamente com o **Prisma**, embutido no pacote core | Fala com um **`VSRepoAdapter`**; o suporte a cada ORM é distribuído em pacotes separados (`@vsrepo/prisma7-adapter`, `@vsrepo/drizzle-adapter`, ...) em vez de vir embutido no pacote core `vsrepo` |
| Definindo um repository | `setupVSRepo<T, M>()({...}).build(prisma)` funcional, **ou** uma classe `DynamicRepository` | Uma única API **baseada em classes**: `extends VSRepository<Entity, PKType, OrmTypes>` |
| Métodos dinâmicos | Objeto de config `methods: { findByEmail: { map: true } }` | Decorator `@DynamicMethod()` em um campo `declare` |
| Projeções de dados | `selectModels` + `defaultSelectModel` nomeados e reutilizáveis | `select`/`relations` ad-hoc passados em cada chamada (sem modelos nomeados) |
| Eager loading | `include`/`includeModels` (específico do Prisma) | Option `relations` agnóstica de ORM |
| Filtros globais | `requiredWhere` e `pushWhere` | **Removidos**; restam apenas `softRemoveKey` + `see: "active" \| "removed" \| "all"` |
| Sufixo de filtro case-insensitive | `Insensitive` | `IgnoreCase` |
| Ordenação inline no nome do método | Não suportado (`order` tinha que ser passado como argumento via `Ordered`) | Cadeias `OrderBy<Campo>Asc`/`OrderBy<Campo>Desc` embutidas diretamente no nome do método |
| Tratamento de duplicatas no `createMany` | Sufixo `SkipDuplicates` | Sufixo `IgnoreConflicts` |
| `aggregate` / `groupBy` | Suportado (passthrough nativo do Prisma) | `groupBy` **não está planejado** para a v2. Um prefixo `aggregate` separado também dificilmente será implementado: as operações mais comuns já são cobertas por métodos base dedicados (`sum`, `average`, `min`, `max`, `increment`, `decrement`, `multiply`, `divide`) — veja [Métodos atômicos e de agregação](./base-methods.pt-BR.md#métodos-atômicos-e-de-agregação). Para qualquer coisa mais complexa, use `@QueryMethod`. |
| Tipos de erro | `VSRepoError` + subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`, `VSRepoRuntimeError`) | Uma classe base `VSRepoError` com um campo `type: VSRepoErrorType` (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`, `ADAPTER`, `QUERY_BUILDER`), além de uma subclasse `VSRepoAdapterError` que carrega um `AdapterErrorCode` e o erro original do ORM |
| Log de debug | Boolean `showWorking: true` | `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) + `logSlowThresholdMs` para avisos de queries lentas |
| CLI `vsrepo generate` (etapa de geração de tipos) | Obrigatória antes de usar | Não faz parte do núcleo da v2 — os tipos vêm diretamente das suas entidades/tipos do ORM |
| Extras de CRUD | `patchList`, `options.select`/`options.include` raw | `select`/`relations` já são o padrão (sempre "raw"); `patch`/`merge` mantêm a mesma semântica. **`patchList` foi removido** — para uma atualização parcial em lote, use um dynamic method `updateManyBy`/`updateManyReturningBy` |

## Sufixos renomeados

Dois sufixos mudaram de nome entre a v1 e a v2 — a funcionalidade é idêntica, apenas o nome difere:

| v1 | v2 | Onde é usado |
| --- | --- | --- |
| `Insensitive` | `IgnoreCase` | Combinador case-insensitive para filtros de texto em [métodos dinâmicos](./dynamic-methods.pt-BR.md#filtros-de-campo) |
| `SkipDuplicates` | `IgnoreConflicts` | Tratamento de duplicatas no `createMany`/`createManyReturning` em [métodos dinâmicos](./dynamic-methods.pt-BR.md#ordenação-paginação-e-distinct) |

## Funcionalidades removidas

- **`patchList`** — removido. Para uma atualização parcial em lote, use um dynamic method `updateManyBy`/`updateManyReturningBy`.
- **`requiredWhere` / `pushWhere`** — removidos. Restam apenas `softRemoveKey` + `see`.
- **`selectModels` / `defaultSelectModel` (projeções nomeadas)** — removidos. Passe `select`/`relations` em cada chamada (veja [`select` e `relations`](./select-and-relations.pt-BR.md#select-e-relations)).
- **CLI `vsrepo generate`** — não faz mais parte do núcleo; os tipos vêm das suas entidades/tipos do ORM diretamente.

## Para onde cada conceito foi

| Conceito da v1 | Substituição na v2 | Guia atual |
| --- | --- | --- |
| `setupVSRepo` / `DynamicRepository` | `extends VSRepository<Entity, PKType, OrmTypes>` | [Métodos base, configuração & soft-delete](./base-methods.pt-BR.md) |
| Config `methods: {...}` | Decorator `@DynamicMethod()` | [Métodos dinâmicos](./dynamic-methods.pt-BR.md) |
| `options.select` / `options.include` raw | `select` / `relations` em cada chamada | [`select` e `relations`](./select-and-relations.pt-BR.md) |
| `showWorking: true` | `logLevel` + `logSlowThresholdMs` | [Logging](./logging.pt-BR.md) |
| `VSRepoConfigError` + subclasses | `VSRepoError` + campo `type`, `VSRepoAdapterError` | [Tratamento de erros](./error-handling.pt-BR.md) |
| Passthrough de `aggregate`/`groupBy` do Prisma | Métodos base (`sum`, `average`, `min`, `max`, ...) ou `@QueryMethod` | [Métodos base](./base-methods.pt-BR.md#métodos-atômicos-e-de-agregação), [Query methods](./query-methods.pt-BR.md) |

## Migrando um repository da v1 para a v2

1. **Instale** o pacote core mais um adapter para o seu ORM — ex.: `npm i vsrepo @vsrepo/prisma7-adapter`.
2. **Substitua** `setupVSRepo<T, M>()({...}).build(prisma)` (ou uma classe `DynamicRepository`) por uma classe que estende `VSRepository<Entity, PKType, OrmTypes>`.
3. **Mova** a config `methods: {...}` para decorators `@DynamicMethod()` em campos `declare`d.
4. **Substitua** `selectModels`/`defaultSelectModel` (e os `options.select`/`options.include` raw) por `select`/`relations` em cada chamada.
5. **Renomeie** os sufixos: `Insensitive` → `IgnoreCase`, `SkipDuplicates` → `IgnoreConflicts`.
6. **Troque** `showWorking: true` por `logLevel` (e `logSlowThresholdMs` para avisos de queries lentas).
7. **Atualize** o tratamento de erros para o novo campo `type` do `VSRepoError` e o `VSRepoAdapterError` (veja [Tratamento de erros](./error-handling.pt-BR.md)).
8. **Remova** a etapa `vsrepo generate` — os tipos vêm diretamente das suas entidades/tipos do ORM.
9. **Migre** chamadas de `patchList` para dynamic methods `updateManyBy`/`updateManyReturningBy`.

> Veja o [README principal](../README.pt-BR.md) para instalação, status dos adapters e uso básico.