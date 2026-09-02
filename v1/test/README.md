# Testes

Este projeto tem dois tipos de teste, em duas pastas separadas:

```text
test/
  implementation/   # Testes de implementação (comportamento em runtime), rodados com Jest
  typing/           # Testes de tipagem (compile-time), checados com tsc --noEmit
  tsconfig.json     # tsconfig usado pelo ts-jest para compilar os testes de implementação
```

## Testes de implementação (`test/implementation`)

São testes de integração que rodam contra um banco Postgres real (via Prisma), exercitando o
comportamento em runtime da biblioteca — os mesmos cenários que antes viviam em `teste.ts` e
`teste-class.ts` na raiz do projeto, agora organizados com Jest:

- `functional-api.test.ts` — API funcional (`setupVSRepo`)
- `class-based-api.test.ts` — API baseada em classes (`DynamicRepository` + `@DynamicMethod`)
- `error-handling.test.ts` — os caminhos de erro (`VSRepoConfigError`, `VSRepoBuildError`,
  `VSRepoExtendError`, `VSRepoRuntimeError`, `VSRepoDecoratorError`). **Não precisa de banco
  real** — todas as validações cobertas aqui acontecem antes de qualquer query ser enviada ao
  Postgres, então esse arquivo roda (e passa) mesmo sem `DATABASE_URL` configurada.

Cada `describe` reproduz o fluxo original (`runAllTests`), com um `it` por área testada
(métodos base, métodos dinâmicos, relations, includes, transações, etc). `beforeAll` limpa o
banco e `afterAll` desconecta o Prisma.

**Pré-requisitos:**

1. Uma instância Postgres acessível, com a `DATABASE_URL` configurada (veja `.env` /
   `examples/prisma.ts`).
2. `dist/` e `generated/vsrepo/` atualizados com a tipagem mais recente, caso você tenha
   alterado algo em `src/`:

   ```bash
   npm run build
   npm run vsrepo
   ```

**Rodando:**

```bash
npm run test:implementation          # roda uma vez
npm run test:implementation:watch    # modo watch
```

> Por padrão o Prisma 7 usa um query compiler em WASM, que faz `import()` dinâmico — o Jest
> roda em CommonJS e precisa da flag `--experimental-vm-modules` do Node para suportar isso.
> O script `test:implementation` já cuida disso (via `cross-env`), então normalmente você não
> precisa se preocupar com isso.

## Testes de tipagem (`test/typing`)

São arquivos TypeScript que não são executados — eles existem só para serem checados pelo
compilador (`tsc --noEmit`). Cada cenário inválido usa `@ts-expect-error`, então, se algum
cenário que deveria falhar passar a compilar (ou vice-versa), o `tsc` aponta o erro.

- `functional-api.types.ts` — narrowing de `selectModel`/`includeModel`, raw `include`, raw
  `select`, exclusividade mútua entre eles, tipagem de PK e de métodos dinâmicos, para a API
  funcional.
- `class-based-api.types.ts` — os mesmos cenários (adaptados) para `DynamicRepository`.

**Rodando:**

```bash
npm run test:typing
```

## Rodando tudo

```bash
npm test
```

Roda `test:typing` e depois `test:implementation`, nessa ordem — assim, uma regressão de
tipagem falha rápido, antes de tentar abrir conexão com o banco.

## CI

O workflow `.github/workflows/ci.yml` roda `pnpm test` (tipagem + implementação) a cada push
e pull request pra `main`, usando um serviço Postgres efêmero. Antes de rodar os testes, o CI
aplica as migrations (`prisma migrate deploy`), builda (`pnpm build`) e regenera
`generated/vsrepo` (`pnpm vsrepo`) — os mesmos passos descritos acima para rodar localmente.
