# Changelog

All notable changes to this project will be documented in this file.

(Português) Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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
