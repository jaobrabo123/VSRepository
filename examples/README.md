# Exemplos do VSRepository

Esta pasta contém exemplos práticos e comentados de como usar o **VSRepository**. A ideia aqui não é só mostrar código pronto, mas te ensinar o "porquê" de cada coisa através de comentários no próprio código (`*`, `?`, `!` e `TODO`).

> 💡 Antes de mexer nesses exemplos, vale a pena dar uma lida no [README principal do projeto](../README.md), que documenta a API completa do VSRepository em detalhes.

---

## Sumário

- [Estrutura da pasta](#estrutura-da-pasta)
- [O domínio usado nos exemplos](#o-domínio-usado-nos-exemplos)
- [Como ler os exemplos](#como-ler-os-exemplos)
- [Como configurar o ambiente](#como-configurar-o-ambiente)
- [Como rodar os testes](#como-rodar-os-testes)
- [Legenda dos comentários](#legenda-dos-comentários)
- [Ordem sugerida de leitura](#ordem-sugerida-de-leitura)

---

## Estrutura da pasta

```
examples/
├── prisma.ts            # Instância do PrismaClient usada pelos exemplos
├── repositories.ts       # Configuração de todos os repositories (User, Address, Product)
└── tests/
    ├── base-methods.test.ts       # Métodos base: get, save, patch, remove, getAll, total, has...
    ├── relations.test.ts          # Como configurar e usar relations no save/patch e em filtros
    ├── required-where.test.ts     # Como o requiredWhere é aplicado automaticamente nas queries
    ├── dynamic-methods.test.ts    # Prefixos, filtros de campo, operadores lógicos e paginação/ordenação
    └── transactions.test.ts       # Transactions com options.db e acesso à instância via repository.prisma
```

- **`prisma.ts`** configura a instância do `PrismaClient` (com o adapter do Postgres) usada por todos os repositories.
- **`repositories.ts`** é o ponto de partida: aqui é onde os repositories de `User`, `Address` e `Product` são configurados com `setupVSRepo`, incluindo `selectModels`, `requiredWhere`, `relations` e os métodos dinâmicos (`methods`). Todos os arquivos em `tests/` importam os repositories já prontos a partir daqui.
- **`tests/`** é onde a "mão na massa" acontece: cada arquivo é um script independente e executável que demonstra um conjunto de funcionalidades específico, com `console.log` em cada passo para você ver o resultado de cada operação no terminal.

---

## O domínio usado nos exemplos

Todos os exemplos giram em torno do mesmo schema do Prisma (veja [`prisma/schema.prisma`](../prisma/schema.prisma)):

- **`User`** → tem um endereço (`Address`, relação **one-to-one**) e vários produtos (`Product`, relação **one-to-many**).
- **`Address`** → pertence a um único `User` (**one-to-one**).
- **`Product`** → pertence a um único `User` (**many-to-one**) e pode ter várias `Tag` (relação **many-to-many**).
- **`Tag`** → pode estar em vários produtos.

Entender esse desenho ajuda bastante a acompanhar os exemplos de `relations.test.ts`, já que ele usa exatamente essas relações (`oto`, `otm`, `mto`, `mtm`) na prática.

---

## Como ler os exemplos

Cada arquivo de teste é **autocontido**: ele cria os dados que precisa, executa as operações de exemplo com `console.log` explicando o resultado esperado, e no final limpa o que criou no banco (para você poder rodar de novo sem deixar lixo).

Recomendamos fortemente abrir os arquivos no **VS Code** (ou outra IDE com suporte a TypeScript) ao invés de só ler no GitHub, porque:

- Muitos comentários `TODO` pedem pra você passar o mouse em cima de uma variável para ver a tipagem que o VSRepository infere automaticamente — isso só funciona com o LSP do TypeScript rodando.
- Você vai ter autocomplete nos métodos dos repositories, o que ajuda a explorar outras possibilidades além do que está nos exemplos.

---

## Como configurar o ambiente

Antes de rodar qualquer teste, você precisa de um banco Postgres rodando e o projeto configurado:

1. **Clone o repositório** (se ainda não tiver feito):
   ```
   git clone https://github.com/jaobrabo123/VSRepository.git
   cd VSRepository
   ```

2. **Instale as dependências**:
   ```
   pnpm install
   ```

3. **Configure a variável de ambiente**: copie o `.env.example` para `.env` e ajuste a `DATABASE_URL` para apontar para o seu banco Postgres:
   ```
   cp .env.example .env
   ```

4. **Rode as migrations** para criar as tabelas (`User`, `Address`, `Product`, `Tag`):
   ```
   npx prisma migrate dev
   ```

5. **Gere o Prisma Client e os tipos do VSRepository**:
   ```
   npx prisma generate
   npx vsrepo generate
   ```
   > Esses dois comandos geram as pastas `generated/prisma` e `generated/vsrepo`, que são importadas tanto em `repositories.ts` quanto nos próprios arquivos de teste.

Depois desses passos, os arquivos dentro de `examples/` já devem estar livres de erros de tipagem na sua IDE.

---

## Como rodar os testes

Cada arquivo em `tests/` é executado individualmente com o `tsx` (já incluso nas dependências do projeto):

```
npx tsx examples/tests/base-methods.test.ts
npx tsx examples/tests/relations.test.ts
npx tsx examples/tests/required-where.test.ts
npx tsx examples/tests/dynamic-methods.test.ts
npx tsx examples/tests/transactions.test.ts
```

Ou, se preferir usar o `pnpm`:

```
pnpm tsx examples/tests/base-methods.test.ts
pnpm tsx examples/tests/relations.test.ts
pnpm tsx examples/tests/required-where.test.ts
pnpm tsx examples/tests/dynamic-methods.test.ts
pnpm tsx examples/tests/transactions.test.ts
```

> ⚠️ Os testes criam e removem dados reais no banco configurado na sua `DATABASE_URL`. Por isso, é recomendável rodá-los em um banco de desenvolvimento/teste, nunca em produção.

Acompanhe a saída no terminal: cada `console.log` mostra o resultado de uma operação específica, geralmente com um comentário `TODO` no código explicando o que esperar daquele log.

---

## Legenda dos comentários

Para deixar a leitura mais fácil, os comentários nos exemplos seguem um padrão:

| Prefixo | Significado |
| ------- | ----------- |
| `*`     | Explicação do que está sendo feito naquele trecho de código |
| `?`     | Uma pergunta que você talvez esteja se fazendo, respondida ali mesmo |
| `!`     | Um aviso ou detalhe importante de atenção (comportamento que pode surpreender) |
| `TODO`  | Uma ação sugerida para você (ex: passar o mouse em cima de uma variável, ou rodar um comando) |

---

## Ordem sugerida de leitura

Se você está começando agora com o VSRepository, essa é a ordem recomendada para acompanhar os exemplos:

1. **[`repositories.ts`](./repositories.ts)** — entenda como os repositories são configurados (`selectModels`, `requiredWhere`, `relations`, `methods`).
2. **[`tests/base-methods.test.ts`](./tests/base-methods.test.ts)** — veja os métodos base (`get`, `save`, `patch`, `remove`, `getAll`, `total`, `has`...) em ação.
3. **[`tests/relations.test.ts`](./tests/relations.test.ts)** — entenda como o `save`/`patch` gerenciam relações automaticamente (`set` vs `add`) e como usar filtros de relação (`Some`, `None`, `With`, `Without`).
4. **[`tests/required-where.test.ts`](./tests/required-where.test.ts)** — veja como o `requiredWhere` é injetado automaticamente nas queries e como ignorá-lo quando necessário (`ignoreRequiredWhere`, `whereType: "overwrite"`).
5. **[`tests/dynamic-methods.test.ts`](./tests/dynamic-methods.test.ts)** — explore os métodos dinâmicos: prefixos, filtros de campo, operadores lógicos (`And`/`Or`), `proxyTo` e sufixos de paginação/ordenação.
6. **[`tests/transactions.test.ts`](./tests/transactions.test.ts)** — entenda como acessar a instância do Prisma com `repository.prisma`, abrir uma transaction com `$transaction` e fazer múltiplos repositories participarem dela via `options.db`, incluindo um exemplo de rollback.

Depois de passar por esses 6 arquivos, você já terá visto na prática praticamente tudo que está documentado no [README principal](../README.md). A partir daí, a melhor forma de aprender é editar os próprios exemplos: troque os campos, crie novos métodos dinâmicos em `repositories.ts` e veja o autocomplete e a tipagem reagindo em tempo real.

---

Encontrou algo que poderia estar mais claro nos exemplos? Abra uma [issue](https://github.com/jaobrabo123/VSRepository/issues) ou contribua direto com um Pull Request 🙂