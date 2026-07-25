# Changelog

All notable changes to this project will be documented in this file.

(Português) Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

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
