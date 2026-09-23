🇧🇷 Português | [🇺🇸 English](./query-methods.md)

[← Voltar para o README principal](../README.pt-BR.md)

# Query methods (SQL raw)

`@QueryMethod` ignora totalmente o engine de parsing por nome e executa uma instrução SQL raw através do método `query()` do adapter. Use placeholders para os valores passados via `args` — nunca interpole valores diretamente na string SQL. **A sintaxe dos placeholders depende do banco/driver usado pelo seu adapter:** o estilo `$1`, `$2`, ... usado nos exemplos abaixo é a convenção do PostgreSQL — o MySQL, por exemplo, usa `?`. Consulte a documentação do seu adapter para saber a sintaxe exata.

```typescript
class UserRepository extends VSRepository<User, string> {
    @QueryMethod('SELECT * FROM "user" WHERE email = $1')
    declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;

    @QueryMethod('UPDATE "user" SET active = true WHERE id = $1', { modifying: true })
    declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;

    // Aqui só se espera uma linha, então `singleResult` transforma o array
    // em um único objeto (ou `null` quando nenhuma linha corresponde).
    @QueryMethod('SELECT * FROM "user" WHERE id = $1 LIMIT 1', { singleResult: true })
    declare findByIdRaw: (arg: QueryMethodArg<[id: string]>) => Promise<User | null>;
}
```

| Option         | Tipo      | Padrão  | Descrição                                                                                                                                                                                                                                                                           |
| -------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modifying`    | `boolean` | `false` | Quando `true`, o método resolve para o número de linhas afetadas. Quando `false`, executa como query de leitura e resolve para o tipo de retorno declarado.                                                                                                                         |
| `singleResult` | `boolean` | `false` | Quando `true`, transforma um resultado em array no seu primeiro elemento (`null` se vazio), permitindo declarar o tipo de retorno como um objeto único em vez de array. Não tem efeito em resultados que não são array (ex.: o número de linhas afetadas de uma query `modifying`). |

Query methods aceitam `{ args, db? }` na chamada — `db` permite que participem de um bloco `transaction()`, assim como os métodos base e dinâmicos.

## Argumentos via spread com `spreadArgs`

Por padrão, um `@QueryMethod` recebe seus valores de placeholder através de um único objeto `QueryMethodArg` (`method({ args: [...] })`). Defina `spreadArgs: true` para recebê-los como argumentos posicionais separados, no estilo do JpaRepository:

```typescript
class UserRepository extends VSRepository<User, string> {
    @QueryMethod('SELECT * FROM "user" WHERE email = $1 AND "userType" = $2', {
        spreadArgs: true,
    })
    declare findByEmailAndType: (
        ...args: QueryArgs<[email: string, userType: string]>
    ) => Promise<User[]>;

    // Ao invés de usar o `QueryArgs`, você também pode simplesmente definir `DbArg` como último parâmetro
    @QueryMethod('SELECT * FROM "user" WHERE id = $1', { spreadArgs: true })
    declare findById: (id: string, db?: DbArg) => Promise<User[]>;
}

const admins = await userRepository.findByEmailAndType("joao@email.com", "admin");
```

Para rodar a query com um client ou transação específico em vez do client padrão do repository, passe `withDb(tx)` como argumento final — ele embrulha `tx` em um `DbArg`, que o resolver reconhece via `instanceof`, então nunca é confundido com um argumento posicional comum, mesmo que esse argumento seja um objeto:

```typescript
await userRepository.transaction(async tx => {
    await userRepository.findByEmailAndType("joao@email.com", "admin", withDb(tx));
});
```

`spreadArgs` afeta apenas campos declarados com `@QueryMethod` — o padrão é `false`, e chamar um método declarado sem essa opção usando mais de um argumento lança erro, já que se espera o estilo de chamada com um único `QueryMethodArg`. Não tem efeito sobre `query()`, que sempre aceita `{ args, db? }`.

## Queries raw pontuais com `query()`

Para SQL raw pontual que não justifica declarar um `@QueryMethod` na classe do repository, chame `query()` diretamente — ele está disponível em toda instância de `VSRepository` e usa o `query()` do adapter por baixo dos panos:

```typescript
query<T = any>(query: string, options?: VSRepoQueryOptions<OrmTypes>): Promise<T>;
```

```typescript
const users = await userRepository.query<User[]>('SELECT * FROM "user" WHERE email = $1', {
    args: ["maria@email.com"],
});

const linhasAfetadas = await userRepository.query<number>(
    'UPDATE "user" SET active = true WHERE id = $1',
    { args: ["123"], modifying: true },
);

// Aqui só se espera uma linha, então `singleResult` transforma o array
// em um único objeto (ou `null` quando nenhuma linha corresponde).
const user = await userRepository.query<User | null>('SELECT * FROM "user" WHERE id = $1 LIMIT 1', {
    args: ["123"],
    singleResult: true,
});
```

| Option         | Tipo      | Padrão                      | Descrição                                                                                                                                                                                               |
| -------------- | --------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `args`         | `any[]`   | `undefined`                 | Parâmetros posicionais injetados nos placeholders do SQL — a sintaxe dos placeholders depende do banco/driver usado pelo seu adapter. Nunca interpole valores diretamente na string SQL.                |
| `db`           | `any`     | Client padrão do repository | Client ou transação do banco em que essa query deve rodar.                                                                                                                                              |
| `modifying`    | `boolean` | `false`                     | Quando `true`, retorna o número de linhas afetadas.                                                                                                                                                     |
| `singleResult` | `boolean` | `false`                     | Quando `true`, transforma um resultado em array no seu primeiro elemento (`null` se vazio). Não tem efeito em resultados que não são array (ex.: o número de linhas afetadas de uma query `modifying`). |

Assim como os métodos base, dinâmicos e query, `query()` aceita `db` em `options` para participar de um bloco `transaction()`.
