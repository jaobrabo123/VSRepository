🇧🇷 Português | [🇺🇸 English](./logging.md)

[← Voltar para o Sumário](./README.pt-BR.md)

# Logging

Todo repository tem um logger interno, configurado via `logLevel` e `logSlowThresholdMs` nas options do construtor:

```typescript
import { VSLogLevel } from "vsrepo";

super({
    pkName: "id",
    adapter,
    logLevel: VSLogLevel.DEBUG,
    logSlowThresholdMs: 200, // avisa se qualquer operação levar mais de 200ms
    // logSlowThresholdMs: false, // desabilita os avisos de operação lenta completamente
});
```

| Nível           | Significado                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| `DEBUG`         | Detalhes internos verbosos, incluindo toda query resolvida — muito útil para debugar métodos dinâmicos. |
| `INFO`          | Eventos de alto nível do ciclo de vida, como a inicialização do repository.                             |
| `WARN` (padrão) | Problemas recuperáveis e operações lentas (veja `logSlowThresholdMs`, padrão de 300ms).                 |
| `ERROR`         | Falhas lançadas durante a execução de uma operação.                                                     |

O [query builder](./query-builder.pt-BR.md#logs-do-query-builder) usa o mesmo logger: em `DEBUG` ele também registra cada chamada encadeada e a query resolvida de cada método terminal, e cada método terminal tem o tempo medido como qualquer outra operação.
