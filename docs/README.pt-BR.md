# Documentação

🇧🇷 Português | [🇺🇸 English](./README.md)

[← Voltar para o README principal](../README.pt-BR.md)

Guias detalhados e com bastante exemplos para cada funcionalidade do VSRepository. Para o quickstart, notas de migração da v1 e status dos adapters, veja o [README principal](../README.pt-BR.md).

| Guia | Cobre |
| --- | --- |
| [Métodos base, configuração & soft-delete](./base-methods.pt-BR.md) | Options do construtor, os 12 métodos CRUD automáticos, soft-delete nativo, e os 8 métodos atômicos/de agregação (`increment`, `sum`, ...). |
| [`select` e `relations`](./select-and-relations.pt-BR.md) | Seleção de campos e carregamento de relações ad-hoc em qualquer chamada, e o `InferMethodReturn` para estreitar o tipo de retorno de acordo. |
| [Métodos dinâmicos](./dynamic-methods.pt-BR.md) | Métodos no estilo `findByEmail`, resolvidos a partir de um nome de método `declare`d: prefixos, filtros de campo, operadores lógicos, filtros de relação, ordenação/paginação/distinct. |
| [Query methods (SQL raw)](./query-methods.pt-BR.md) | Métodos de SQL raw via `@QueryMethod`, ignorando totalmente o parser de nomes dos métodos dinâmicos. |
| [Query builder](./query-builder.pt-BR.md) | A API fluente `createQueryBuilder()` para queries montadas em tempo de execução, incluindo paginação, visibilidade de soft-delete e transações. |
| [Transações](./transactions.pt-BR.md) | Rodando vários repositories na mesma transação nativa do ORM. |
| [Tipos utilitários](./utility-types.pt-BR.md) | Os tipos utilitários exportados (`InferMethodType`, `InferMethodReturn`, `KeysOfType`, ...) e onde cada um é usado. |
| [Escrevendo seu próprio adapter](./writing-an-adapter.pt-BR.md) | Como implementar o `VSRepoAdapter` para um novo ORM ou banco, método a método. |
| [Tratamento de erros](./error-handling.pt-BR.md) | `VSRepoError`, `VSRepoErrorType`, e `VSRepoAdapterError`/`AdapterErrorCode`. |
| [Logging](./logging.pt-BR.md) | `logLevel`, `logSlowThresholdMs`, e o formato de log usado pelo repository e pelo query builder. |
