# Changelog

All notable changes to this project will be documented in this file.

(Português) Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---
 
## [2.0.0] - 2026-09-01
 
> Major rewrite. If you're upgrading from v1, see the ["What changed from v1"](./README.md#what-changed-from-v1) table in the README for the full breakdown before migrating.
 
### Changed
- **BREAKING:** VSRepository is now **ORM-agnostic** — the core no longer talks to Prisma directly, it delegates every operation to a pluggable `VSRepoAdapter`. ORM support now ships as separate packages (e.g. `@vsrepo/prisma7-adapter`) instead of being bundled in the core `vsrepo` package
- **BREAKING:** Repositories are now defined with a single **class-based** API — `extends VSRepository<Entity, PKType, OrmTypes>` — replacing the v1 functional `setupVSRepo<T, M>()({...}).build(prisma)` and the `DynamicRepository` class
- **BREAKING:** Dynamic methods are now declared only with the `@DynamicMethod()` decorator on a `declare` field, replacing the `methods: { findByEmail: { map: true } }` config object
- **BREAKING:** Data projections are now ad-hoc `select`/`relations` passed per call — named, reusable `selectModels`/`defaultSelectModel` were removed
- **BREAKING:** Eager loading now uses an ORM-agnostic `relations` option instead of the Prisma-specific `include`/`includeModels`
- **BREAKING:** `requiredWhere` was removed; global scoping is now limited to `softRemoveKey` + a `see: "active" | "removed" | "all"` option
- **BREAKING:** The case-insensitive filter suffix was renamed from `Insensitive` to `IgnoreCase`
- **BREAKING:** The `createMany` duplicate-handling suffix was renamed from `SkipDuplicates` to `IgnoreConflicts`
- **BREAKING:** Error types were reworked — `VSRepoError` now carries a `type: VSRepoErrorType` field (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`, `ADAPTER`); the old subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`) were replaced by the new `VSRepoAdapterError`, which carries an `AdapterErrorCode` and the original ORM error
- **BREAKING:** Debug logging changed from a `showWorking: true` boolean to a `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`) option, plus a new `logSlowThresholdMs` for slow-query warnings
- **BREAKING:** The `vsrepo generate` CLI type-generation step is no longer part of the v2 core — types now come directly from your entity/ORM types
- Runtime validation (ordering, pagination, where, adapter config) now uses `valibot` instead of `zod`, for a lighter footprint
- Inline ordering can now be baked directly into a dynamic method name via `OrderBy<Field>Asc`/`OrderBy<Field>Desc` chains
- v1 source and docs moved to a dedicated `v1` branch for anyone who still needs the previous Prisma-only release

### Added
- An ad-hoc `query()` method for raw SQL queries, with transaction support via `db: tx`
- `VSRepoAdapterError` with a dedicated `AdapterErrorCode`, including a new `INVALID_ADAPTER_CONFIG` code, for surfacing adapter-level failures
- `VSLogger` exported for use inside custom adapters
- JSDoc added to every public API surface (everything marked `@publicApi`)
- First official adapter published: [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) (Prisma 7); other ORMs (Prisma 8, TypeORM, Drizzle) are planned but not yet published

### Fixed
- The case-insensitive mode was being injected in the wrong place when combined with relation filters, producing an incorrect `where`
- Corrected the argument-index preview shown when an argument is a `where` object

### Removed
- `patchList` — for a batch partial update, use an `updateManyBy`/`updateManyWhere` dynamic method instead
- `aggregate`/`groupBy` passthrough support — not implemented yet in v2

---
 
## [2.0.0] - 2026-09-01 (Português)
 
> Reescrita major. Se você está migrando da v1, veja a tabela ["O que mudou da v1"](./README.pt-BR.md#o-que-mudou-da-v1) no README para o detalhamento completo antes de migrar.
 
### Alterado
- **BREAKING:** O VSRepository agora é **agnóstico de ORM** — o core não conversa mais diretamente com o Prisma, delegando toda operação a um `VSRepoAdapter` plugável. O suporte a ORMs agora é publicado em pacotes separados (ex.: `@vsrepo/prisma7-adapter`) em vez de vir embutido no pacote core `vsrepo`
- **BREAKING:** Repositories agora são definidos com uma única API **baseada em classes** — `extends VSRepository<Entity, PKType, OrmTypes>` — substituindo o `setupVSRepo<T, M>()({...}).build(prisma)` funcional da v1 e a classe `DynamicRepository`
- **BREAKING:** Métodos dinâmicos agora são declarados somente com o decorator `@DynamicMethod()` em um campo `declare`, substituindo o objeto de config `methods: { findByEmail: { map: true } }`
- **BREAKING:** Projeções de dados agora são `select`/`relations` ad-hoc passados em cada chamada — os `selectModels`/`defaultSelectModel` nomeados e reutilizáveis foram removidos
- **BREAKING:** Eager loading agora usa uma option agnóstica de ORM chamada `relations`, no lugar do `include`/`includeModels` específico do Prisma
- **BREAKING:** O `requiredWhere` foi removido; o escopo global agora se limita a `softRemoveKey` + uma option `see: "active" | "removed" | "all"`
- **BREAKING:** O sufixo de filtro case-insensitive foi renomeado de `Insensitive` para `IgnoreCase`
- **BREAKING:** O sufixo de tratamento de duplicados do `createMany` foi renomeado de `SkipDuplicates` para `IgnoreConflicts`
- **BREAKING:** Os tipos de erro foram reformulados — `VSRepoError` agora carrega um campo `type: VSRepoErrorType` (`DECORATOR`, `RESOLVER`, `DYNAMIC`, `VALIDATOR`, `BASE`, `ADAPTER`); as antigas subclasses (`VSRepoConfigError`, `VSRepoBuildError`, `VSRepoExtendError`) foram substituídas pelo novo `VSRepoAdapterError`, que carrega um `AdapterErrorCode` e o erro original do ORM
- **BREAKING:** O log de debug mudou de um boolean `showWorking: true` para uma option `logLevel: VSLogLevel` (`DEBUG`/`INFO`/`WARN`/`ERROR`), além de um novo `logSlowThresholdMs` para avisos de queries lentas
- **BREAKING:** O passo de geração de tipos via CLI `vsrepo generate` não faz mais parte do core da v2 — os tipos agora vêm diretamente das suas entidades/tipos do ORM
- A validação em tempo de execução (ordering, pagination, where, config do adapter) agora usa `valibot` em vez de `zod`, por ser mais leve
- A ordenação inline agora pode ser embutida diretamente no nome do método dinâmico via cadeias `OrderBy<Campo>Asc`/`OrderBy<Campo>Desc`
- O código-fonte e a documentação da v1 foram movidos para uma branch `v1` dedicada, para quem ainda precisar da release anterior baseada apenas em Prisma

### Adicionado
- Um método `query()` ad-hoc para queries SQL raw, com suporte a transações via `db: tx`
- `VSRepoAdapterError` com um `AdapterErrorCode` dedicado, incluindo um novo código `INVALID_ADAPTER_CONFIG`, para expor falhas em nível de adapter
- `VSLogger` agora é exportado para uso dentro de adapters customizados
- JSDoc adicionado a toda a API pública (tudo marcado com `@publicApi`)
- Primeiro adapter oficial publicado: [`@vsrepo/prisma7-adapter`](https://github.com/jaobrabo123/VSRepoPrisma7Adapter) (Prisma 7); outros ORMs (Prisma 8, TypeORM, Drizzle) estão planejados mas ainda não publicados

### Corrigido
- O modo case-insensitive estava sendo injetado no lugar errado quando combinado com filtros de relação, gerando um `where` incorreto
- Corrigida a preview do índice do argumento exibida quando um argumento é um objeto `where`

### Removido
- `patchList` — para uma atualização parcial em lote, use um método dinâmico `updateManyBy`/`updateManyWhere`
- Suporte de passthrough para `aggregate`/`groupBy` — ainda não implementado na v2

---

## [1.4.2] - 2026-09-02

### Fixed
- `merge` method now strips `undefined` fields from the source object before merging — previously, when merging objects without relations, `undefined` values from the source were carried into the result, which could overwrite existing fields with `undefined`

---

## [1.4.2] - 2026-09-02 (Português)

### Corrigido
- O método `merge` agora remove campos com valor `undefined` do objeto de origem antes de mesclar — antes, ao mesclar objetos sem relations, valores `undefined` do objeto de origem eram propagados para o resultado, o que poderia sobrescrever campos existentes com `undefined`

---

## [1.4.1] - 2026-09-01

### Fixed
- `mode: "insensitive"` was being injected at the wrong level in relation filters — previously, `otherProps` (which includes `mode`) was being assigned to `path[argName]` (the nested relation object) instead of the current filter level, causing the insensitive mode to be placed incorrectly in the generated `where`

---

## [1.4.1] - 2026-09-01 (Português)

### Corrigido
- `mode: "insensive"` estava sendo injetado no nível errado em filtros de relations — antes, `otherProps` (que inclui `mode`) era atribuído a `path[argName]` (o objeto da relation aninhada) em vez do nível atual do filtro, causando colocação incorreta do modo insensitive no `where` gerado

---

## [1.4.0] - 2026-08-11

### Fixed
- Dynamic methods combining multiple filters on the **same relation** no longer lose all but the last filter — previously, filters like `findBy...AndEnderecoWithEstadoAndEnderecoWithCidadeNormalizadaStartsWith...` produced a `where` with only the last relation filter (`estado` was lost), because `resolveSpecificWhere` merged the generated paths with `Object.assign` (shallow merge). It now uses `deepmerge` (deep merge), so relation filters coexist correctly (e.g. `endereco: { is: { estado, cidadeNormalizada } }`)

### Added
- Regression tests (`test/implementation/specific-where.test.ts`) covering multiple filters on the same relation in `resolveSpecificWhere`, including plain fields, relation filters, OR/AND groups, pure `With` combined with `WithField`, and `betweenMode` combined with another operator on the same field

---

## [1.4.0] - 2026-08-11 (Português)

### Corrigido
- Métodos dinâmicos que combinam múltiplos filtros na **mesma relation** não perdem mais todos os filtros exceto o último — antes, filtros como `findBy...AndEnderecoWithEstadoAndEnderecoWithCidadeNormalizadaStartsWith...` geravam um `where` apenas com o último filtro da relation (`estado` era perdido), porque o `resolveSpecificWhere` mesclava os caminhos gerados com `Object.assign` (merge raso). Agora ele usa `deepmerge` (merge profundo), fazendo os filtros de relation coexistirem corretamente (ex.: `endereco: { is: { estado, cidadeNormalizada } }`)

### Adicionado
- Testes de regressão (`test/implementation/specific-where.test.ts`) cobrindo múltiplos filtros na mesma relation em `resolveSpecificWhere`, incluindo campos simples, filtros de relation, grupos OR/AND, `With` puro combinado com `WithCampo`, e `betweenMode` combinado com outro operador no mesmo campo

---

## [1.3.9] - 2026-08-10

### Added
- Now `README.md` and `README.pt-BR.md` include the `VSRepository` logo for visual identity.

---

## [1.3.9] - 2026-08-10 (Português)

### Adicionado
- Agora `README.md` e `README.pt-BR.md` contém a logo do `VSRepository` para identidade visual.

---

## [1.3.8] - 2026-08-03

### Fixed
- `vsrepo generate` now copies the README files from the `vsrepo` package root (`node_modules/vsrepo` or the repository itself) instead of the consumer project's root — previously it copied the consumer's own `README.md` and failed to find the other READMEs (`README.pt-BR.md`, `README-DynamicRepo.md`, `README-DynamicRepo.pt-BR.md`) when they didn't exist in the consumer project

### Changed
- The `files` field in `package.json` now explicitly includes the README files (`README.md`, `README.pt-BR.md`, `README-DynamicRepo.md`, `README-DynamicRepo.pt-BR.md`) so they are shipped inside the published npm package — previously only `README.md` and `README.pt-BR.md` were included automatically by npm, leaving the `README-DynamicRepo*` files missing from the installed package

---

## [1.3.8] - 2026-08-03 (Português)

### Corrigido
- `vsrepo generate` agora copia os READMEs da raiz do pacote `vsrepo` (`node_modules/vsrepo` ou o próprio repositório) em vez da raiz do projeto do consumidor — antes ele copiava o `README.md` do próprio consumidor e falhava ao não encontrar os demais READMEs (`README.pt-BR.md`, `README-DynamicRepo.md`, `README-DynamicRepo.pt-BR.md`) quando eles não existiam no projeto do consumidor

### Alterado
- O campo `files` no `package.json` agora inclui explicitamente os arquivos README (`README.md`, `README.pt-BR.md`, `README-DynamicRepo.md`, `README-DynamicRepo.pt-BR.md`) para que sejam empacotados no pacote npm publicado — antes apenas `README.md` e `README.pt-BR.md` eram incluídos automaticamente pelo npm, deixando os arquivos `README-DynamicRepo*` ausentes do pacote instalado

---

## [1.3.7] - 2026-08-03

### Added
- `vsrepo generate` now copies the project READMEs (`README.md`, `README.pt-BR.md`, `README-DynamicRepo.md`, `README-DynamicRepo.pt-BR.md`) to a `docs/` folder inside the generated output directory

### Changed
- The generated output now includes a `docs/` directory containing the project documentation

---

## [1.3.7] - 2026-08-03 (Português)

### Adicionado
- `vsrepo generate` agora copia os READMEs do projeto (`README.md`, `README.pt-BR.md`, `README-DynamicRepo.md`, `README-DynamicRepo.pt-BR.md`) para uma pasta `docs/` dentro do diretório de saída gerado

### Alterado
- A saída gerada agora inclui um diretório `docs/` contendo a documentação do projeto

---

## [1.3.6] - 2026-08-01

### Added
- `ordering` support in method options, replacing `ordenation` as the preferred name while keeping full backward compatibility — `ordenation` is now marked as deprecated
- GitHub Actions CI workflow (`.github/workflows/ci.yml`) to lint, typecheck and test the project on every push and pull request
- Error handling tests (`test/implementation/error-handling.test.ts`) covering the `VSRepoRuntimeError` error codes
- Documentation of all `VSRepoRuntimeError` error codes in README.md and README.pt-BR.md

### Fixed
- Generated `index.ts` now exports the `VSRepoDecoratorError` class (previously missing from the generated output, preventing consumers from importing it)
- Fixed internal typo `dinamic` → `dynamic` in file names, constants and types (e.g. `dynamic-method-info`, `dynamic-method-customization`, `dynamic-methods-key`)

### Changed
- Tests, examples and documentation updated to use `ordering` instead of `ordenation`
- `ordenation` marked as deprecated in favor of `ordering` (still fully supported)
- Reformatted Markdown documentation files for better consistency and readability

---

## [1.3.6] - 2026-08-01 (Português)

### Adicionado
- Suporte a `ordering` nas options dos métodos, substituindo `ordenation` como nome preferido mantendo compatibilidade total com versões anteriores — `ordenation` agora está marcado como deprecated
- Workflow de CI do GitHub Actions (`.github/workflows/ci.yml`) para executar lint, typecheck e testes a cada push e pull request
- Testes de error handling (`test/implementation/error-handling.test.ts`) cobrindo os códigos de erro do `VSRepoRuntimeError`
- Documentação de todos os códigos de erro do `VSRepoRuntimeError` no README.md e README.pt-BR.md

### Corrigido
- O `index.ts` gerado agora exporta a classe `VSRepoDecoratorError` (antes ausente na saída gerada, impedindo que consumidores conseguissem importá-la)
- Corrigido typo interno `dinamic` → `dynamic` em nomes de arquivos, constantes e tipos (ex.: `dynamic-method-info`, `dynamic-method-customization`, `dynamic-methods-key`)

### Alterado
- Testes, exemplos e documentação atualizados para usar `ordering` no lugar de `ordenation`
- `ordenation` marcado como deprecated em favor de `ordering` (ainda totalmente suportado)
- Reformatados os arquivos de documentação Markdown para melhor consistência e legibilidade

---

## [1.3.5] - 2026-07-27

### Added
- Raw `select` support in method options (`options.select`): pass a raw Prisma `select` directly in a method call, without registering it beforehand in `selectModels` — mirrors the existing raw `include` (`options.include`)
- Full typing for `options.select`: works across all base methods (`get`, `getOrThrow`, `getList`, `remove`, `save`, `saveList`, `patch`, `patchList`, `merge`, `getAll`, `softRemove`, `restore`) and dynamics, narrows the return type to exactly the selected fields, and is mutually exclusive with `selectModel`, `includeModel` and `include`
- `select` field added to `DynamicMethodOptions` (class-based `DynamicRepository` API)
- Documentation for raw `select` in README.md, README-DynamicRepo.md and their Portuguese counterparts
- Runtime validation for `QueryMethod`'s `value` parameter — throws `VSRepoDecoratorError` if it isn't a string
- Reorganized the project's tests into a dedicated `test/` folder: `test/implementation` (Jest-based runtime tests, replacing the old root-level `teste.ts`/`teste-class.ts`) and `test/typing` (compile-time type tests checked via `tsc --noEmit`, using `@ts-expect-error` to assert invalid usages are rejected)
- New npm scripts: `test`, `test:implementation`, `test:implementation:watch`, `test:typing`
- Implementation and typing tests for raw `select`, covering both the functional (`setupVSRepo`) and class-based (`DynamicRepository`) APIs

### Fixed
- Generated `VSRepoError.ts` now also exports `VSRepoDecoratorError` (previously missing from the generated output, causing consumers to be unable to import it)

### Changed
- Updated the generated file tree diagram in the README to include the `DynamicRepository.ts`/`DynamicRepository.types.d.ts` files

---

## [1.3.5] - 2026-07-27 (Português)

### Adicionado
- Suporte a `select` cru nas options dos métodos (`options.select`): permite passar um `select` bruto do Prisma diretamente na chamada, sem precisar registrá-lo antecipadamente em `selectModels` — espelha o `include` cru (`options.include`) já existente
- Tipagem completa para `options.select`: funciona em todos os métodos base (`get`, `getOrThrow`, `getList`, `remove`, `save`, `saveList`, `patch`, `patchList`, `merge`, `getAll`, `softRemove`, `restore`) e dinâmicos, restringe o tipo de retorno exatamente aos campos selecionados, e é mutuamente exclusivo com `selectModel`, `includeModel` e `include`
- Campo `select` adicionado ao `DynamicMethodOptions` (API baseada em classes `DynamicRepository`)
- Documentação do `select` cru no README.md, README-DynamicRepo.md e suas versões em português
- Validação em tempo de execução do parâmetro `value` do `QueryMethod` — lança `VSRepoDecoratorError` caso não seja uma string
- Reorganização dos testes do projeto em uma pasta `test/` dedicada: `test/implementation` (testes de runtime com Jest, substituindo os antigos `teste.ts`/`teste-class.ts` na raiz) e `test/typing` (testes de tipagem em tempo de compilação, checados com `tsc --noEmit`, usando `@ts-expect-error` para garantir que usos inválidos são rejeitados)
- Novos scripts npm: `test`, `test:implementation`, `test:implementation:watch`, `test:typing`
- Testes de implementação e de tipagem para o `select` cru, cobrindo tanto a API funcional (`setupVSRepo`) quanto a baseada em classes (`DynamicRepository`)

### Corrigido
- O `VSRepoError.ts` gerado agora também exporta `VSRepoDecoratorError` (antes ausente na saída gerada, impedindo que consumidores conseguissem importá-lo)

### Alterado
- Atualizado o diagrama da árvore de arquivos gerados no README para incluir os arquivos `DynamicRepository.ts`/`DynamicRepository.types.d.ts`

---

## [1.3.4] - 2026-07-25

### Added
- Query Methods: new `@QueryMethod` decorator (class-based) and `query` config (functional) for defining raw SQL query methods that bypass the name-parsing engine
- Support for non-modifying queries (`$queryRawUnsafe`) and modifying queries (`$executeRawUnsafe`, `modifying: true`)
- `QueryMethodArg` type for typing the `{ args, db? }` parameter
- Transaction support for query methods via `db: tx` parameter
- Query methods documentation
- Query methods examples
- Tests for query methods in both functional and class-based approaches

### Changed
- Clarified in documentation that the `WRelations` generic in `DynamicRepository` is optional and explained when to use it
- Translated documentation to Portuguese

---

## [1.3.4] - 2026-07-25 (Português)

### Adicionado
- Query Methods: novo decorador `@QueryMethod` (abordagem class-based) e config `query` (abordagem funcional) para definir métodos de query SQL raw que ignoram o engine de parsing por nome
- Suporte para queries não-modificantes (`$queryRawUnsafe`) e modificantes (`$executeRawUnsafe`, `modifying: true`)
- Tipo `QueryMethodArg` para tipar o parâmetro `{ args, db? }`
- Suporte a transações para query methods via parâmetro `db: tx`
- Documentação dos query methods
- Exemplos dos query methods
- Testes para query methods nas abordagens funcional e class-based

### Alterado
- Esclarecido na documentação que a generic `WRelations` no `DynamicRepository` é opcional e explicado quando utilizá-la
- Documentação traduzida para português

---

## [1.3.3] - 2026-07-22

### Added
- DynamicRepository: base structure for dynamic repository functionality
- Complete typing for DynamicRepository and DynamicMethod
- Native Prisma `include` support in method options typing
- Real implementation for raw include support
- Improved build logging
- DynamicRepository documentation (README-DynamicRepo.md)
- DynamicRepository examples
- Tests for DynamicRepository and include parameter

### Fixed
- Fixed typing for objects with relations
- Fixed DynamicRepository typing
- Fixed DynamicMethod typing
- Fixed pushWhere error in some dynamic methods

### Changed
- Translated package.json description to English

---

## [1.3.3] - 2026-07-22 (Português)

### Adicionado
- DynamicRepository: estrutura base da funcionalidade de repositório dinâmico
- Tipagem completa para DynamicRepository e DynamicMethod
- Suporte nativo ao `include` do Prisma na tipagem das opções de método
- Implementação real do suporte ao include raw
- Melhoria nos logs de build
- Documentação do DynamicRepository (README-DynamicRepo.md)
- Exemplos para DynamicRepository
- Testes para DynamicRepository e parâmetro include

### Corrigido
- Correção da tipagem dos objetos com relations
- Correção da tipagem do DynamicRepository
- Correção da tipagem do DynamicMethod
- Correção do erro do pushWhere em alguns métodos dinâmicos

### Alterado
- Descrição do package.json traduzida para inglês

---
