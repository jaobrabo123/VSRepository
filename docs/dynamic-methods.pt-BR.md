<a id="top"></a>

🇧🇷 Português | [🇺🇸 English](./dynamic-methods.md)

[← Voltar para o Sumário](./README.pt-BR.md)

# Métodos dinâmicos

Métodos dinâmicos são declarados como um campo `declare` anotado com `@DynamicMethod()`. O comportamento deles — qual método do adapter chamar, quais filtros aplicar e como os argumentos se mapeiam para eles — é inferido inteiramente a partir do **nome** do campo.

```typescript
class UserRepository extends VSRepository<User, string> {
    @DynamicMethod()
    declare findByEmail: (email: string, options?: MethodOptions<User>) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmail: (email: string) => Promise<User | null>;

    @DynamicMethod()
    declare updateById: (id: string, data: DeepPartial<User>) => Promise<User>;

    // Baseado em where: VSRepoWhere<T> como primeiro parâmetro, pagination penúltimo, MethodOptions por último
    @DynamicMethod()
    declare findWherePaginated: (
        where: VSRepoWhere<User>,
        pagination: Pagination,
        options?: MethodOptions<User>,
    ) => Promise<User[]>;

    // filtros de campo, depois pagination, depois MethodOptions
    @DynamicMethod()
    declare findByNameIgnoreCaseOrAgeBetweenOrderByCreatedAtAscPaginated: (
        name: string,
        age: [number, number],
        pagination: Pagination,
        options?: MethodOptions<User>,
    ) => Promise<User[]>;
}
```

> Quer que o tipo de retorno acompanhe o `select`/`relations` passados, em vez de ser sempre a entidade inteira? Declare o método com [`InferMethodType`](#tipagem-de-retorno-restrita-com-infermethodtype).

## Prefixos disponíveis

| Prefixo                    | Método do adapter     | Observações                                                                                                                              |
| -------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `findBy`                   | `findMany`            | Filtros de campo seguem o prefixo.                                                                                                       |
| `findOneBy`                | `findOne`             | Filtros de campo seguem o prefixo; resultado único.                                                                                      |
| `findOneOrThrowBy`         | `findOneOrThrow`      | Lança erro se não encontrar.                                                                                                             |
| `findOneOrThrow`           | `findOneOrThrow`      | Sem filtros de campo; aplica só soft-delete/`see`.                                                                                       |
| `findOneOrThrowWhere`      | `findOneOrThrow`      | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `findWhere`                | `findMany`            | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `findOneWhere`             | `findOne`             | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `findOne`                  | `findOne`             | Sem filtros de campo; aplica só soft-delete/`see`.                                                                                       |
| `countBy`                  | `count`               | Filtros de campo seguem o prefixo.                                                                                                       |
| `countWhere`               | `count`               | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `count`                    | `count`               | Sem filtros de campo.                                                                                                                    |
| `existsBy`                 | `exists`              | Retorna `boolean`.                                                                                                                       |
| `existsWhere`              | `exists`              | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `create`                   | `create`              | Recebe `DeepPartial<Entity>` como argumento.                                                                                             |
| `createMany`               | `createMany`          | Recebe `DeepPartial<Entity>[]` como argumento; suporta `IgnoreConflicts`.                                                                |
| `createManyReturning`      | `createManyReturning` | Recebe `DeepPartial<Entity>[]` como argumento; suporta `IgnoreConflicts`; retorna os registros criados (`T[]`), em vez de `CountResult`. |
| `updateBy`                 | `update`              | Filtros de campo + `DeepPartial<Entity>` como argumento.                                                                                 |
| `updateWhere`              | `update`              | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois `DeepPartial<Entity>`.                                                        |
| `updateManyBy`             | `updateMany`          | Filtros de campo + `DeepPartial<Entity>`.                                                                                                |
| `updateManyWhere`          | `updateMany`          | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois `DeepPartial<Entity>`.                                                        |
| `updateManyReturningBy`    | `updateManyReturning` | Filtros de campo + `DeepPartial<Entity>`; retorna os registros atualizados.                                                              |
| `updateManyReturningWhere` | `updateManyReturning` | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois `DeepPartial<Entity>`; retorna os registros atualizados.                      |
| `upsertBy`                 | `upsert`              | Filtros de campo + payloads `create`/`update`.                                                                                           |
| `upsertWhere`              | `upsert`              | Recebe um `VSRepoWhere<T>` como primeiro argumento, depois os payloads `create`/`update`.                                                |
| `deleteBy`                 | `delete`              | Filtros de campo seguem o prefixo.                                                                                                       |
| `deleteWhere`              | `delete`              | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `deleteManyBy`             | `deleteMany`          | Filtros de campo seguem o prefixo.                                                                                                       |
| `deleteManyWhere`          | `deleteMany`          | Recebe um `VSRepoWhere<T>` como primeiro argumento.                                                                                      |
| `deleteManyReturningBy`    | `deleteManyReturning` | Filtros de campo seguem o prefixo; retorna os registros removidos.                                                                       |
| `deleteManyReturningWhere` | `deleteManyReturning` | Recebe um `VSRepoWhere<T>` como primeiro argumento; retorna os registros removidos.                                                      |

> `groupBy` **não está planejado** para a v2 — ele não se encaixa bem no contrato agnóstico de ORM. Um prefixo `aggregate` separado também dificilmente será implementado: as operações de agregação mais comuns (`sum`, `average`, `min`, `max`, `increment`, `decrement`, `multiply`, `divide`) já estão disponíveis como métodos base dedicados — veja [Métodos atômicos e de agregação](./base-methods.pt-BR.md#métodos-atômicos-e-de-agregação). Para qualquer coisa mais complexa, use um `@QueryMethod` com SQL raw.

## Filtros de campo

Aplicados como sufixos ao nome do campo dentro do método (mesma ideia da v1, com um sufixo renomeado):

| Sufixo             | Significado                                                                                                                                                | Argumento                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| _(sem sufixo)_ / `Equals` | igualdade (`=`)                                                                                                                                      | sim                                      |
| `Not` / `NotEquals`       | negação                                                                                                                                              | sim                                      |
| `In`               | está em                                                                                                                                                    | sim (array)                              |
| `NotIn`            | não está em                                                                                                                                                | sim (array)                              |
| `Contains`         | contém substring                                                                                                                                           | sim                                      |
| `NotContains`      | não contém substring                                                                                                                                       | sim                                      |
| `StartsWith`       | começa com                                                                                                                                                 | sim                                      |
| `NotStartsWith`    | não começa com                                                                                                                                             | sim                                      |
| `EndsWith`         | termina com                                                                                                                                                | sim                                      |
| `NotEndsWith`      | não termina com                                                                                                                                            | sim                                      |
| `GreaterThan`      | `>`                                                                                                                                                        | sim                                      |
| `GreaterThanEqual` | `>=`                                                                                                                                                       | sim                                      |
| `LessThan`         | `<`                                                                                                                                                        | sim                                      |
| `LessThanEqual`    | `<=`                                                                                                                                                       | sim                                      |
| `Between`          | intervalo inclusivo                                                                                                                                        | sim (tupla `[min, max]`)                 |
| `NotBetween`       | fora de um intervalo inclusivo                                                                                                                             | sim (tupla `[min, max]`)                 |
| `IsNull`           | campo é `null`                                                                                                                                             | não                                      |
| `IsNotNull`        | campo não é `null`                                                                                                                                         | não                                      |
| `IsTrue`           | campo é `true`                                                                                                                                             | não                                      |
| `IsFalse`          | campo é `false`                                                                                                                                            | não                                      |
| `IgnoreCase`       | combinador case-insensitive para filtros de texto                                                                                                          | sim _(renomeado do `Insensitive` da v1)_ |
| `Optional`         | flag opcional para deixar explícito que o parâmetro é opcional | sim _(na prática não muda nada)_                                       |

```typescript
@DynamicMethod()
declare findByNameContainsIgnoreCase: (name: string) => Promise<User[]>;

@DynamicMethod()
declare findByAgeBetween: (age: [number, number]) => Promise<User[]>;
```

> **Colisão de palavra-chave em nome de campo:** um sufixo/operador só é reconhecido numa fronteira de camelCase — seguido de letra maiúscula, de caractere não-ASCII ou (para sufixos de campo) do fim do nome — então `findByOrganizationId` e `findByNotes` resolvem para os campos `organizationId` e `notes`, não para as palavras-chave `Or`/`Not`. Ainda fica um caso ambíguo: um campo cujo nome termina de fato numa fronteira com as mesmas letras de uma palavra-chave (ex.: `checkIn`, que por padrão é lido como o campo `check` + o sufixo `In`). Adicione `Equals` (ou `NotEquals`) para forçar igualdade e desambiguar: `findByCheckInEquals` resolve para o campo `checkIn`.

## Operadores lógicos

| Operador | Uso no nome                    | Exemplo                                             |
| -------- | ------------------------------ | --------------------------------------------------- |
| `And`    | entre dois campos              | `findOneByIdAndEmail`                               |
| `Or`     | entre dois campos              | `findByNameOrEmail`                                 |
| `AND`    | separa um bloco final em `AND` | `findByEmailOrNameANDActiveStatusAndAgeGreaterThan` |

Regras do `AND` (em capslock), iguais às da v1: só é permitido **um** `AND` por nome de método; todo campo conectado por `And` depois dele é aninhado dentro de `AND: []`; `Or` não pode aparecer depois de um `AND` — usar dessa forma lança um `VSRepoError` (`RESOLVER`) ao construir o repository. Veja [Tratamento de erros](./error-handling.pt-BR.md#tratamento-de-erros).

## Filtros de relação

Filtram por campos de entidades relacionadas. Internamente, mapeiam para os operadores `_some`/`_every`/`_none`/`_with`/`_without` de `VSRepoWhere` (veja [`select` e `relations`](./select-and-relations.pt-BR.md#select-e-relations) para o equivalente de eager loading).

| Sufixo         | Significado                                       | Restrição                                                               |
| -------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| `Some`         | pelo menos um registro relacionado corresponde    | apenas relações to-many                                                 |
| `SomeField`    | filtra dentro dos registros relacionados          | apenas relações to-many                                                 |
| `Every`        | todo registro relacionado corresponde             | apenas relações to-many (precisa de `Field` para ser um filtro efetivo) |
| `EveryField`   | filtra dentro dos registros relacionados          | apenas relações to-many                                                 |
| `None`         | nenhum registro relacionado corresponde           | apenas relações to-many                                                 |
| `NoneField`    | filtra dentro dos registros relacionados          | apenas relações to-many                                                 |
| `With`         | o registro relacionado existe                     | apenas relações to-one                                                  |
| `WithField`    | filtra um campo dentro do registro relacionado    | apenas relações to-one                                                  |
| `Without`      | o registro relacionado não existe                 | apenas relações to-one                                                  |
| `WithoutField` | filtro negado em um campo do registro relacionado | apenas relações to-one                                                  |

```typescript
@DynamicMethod()
declare findByAddressWithCityStartsWithIgnoreCase: (city: string) => Promise<User[]>;

@DynamicMethod()
declare findByProductsSome: () => Promise<User[]>;
```

## Ordenação, paginação e distinct

| Sufixo                                     | Efeito                                                                                                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Paginated`                                | Injeta um argumento `pagination` (`{ limit?, offset? }`) como **penúltimo** parâmetro (antes do `MethodOptions` opcional).                                                     |
| `Ordered`                                  | Injeta um argumento `order: Ordering<T>` como **penúltimo** parâmetro (antes do `MethodOptions` opcional).                                                                     |
| `OrderedAndPaginated`                      | Injeta `order` como antepenúltimo, depois `pagination` como penúltimo — ambos antes do `MethodOptions`.                                                                        |
| `PaginatedAndOrdered`                      | Injeta `pagination` como antepenúltimo, depois `order` como penúltimo — ambos antes do `MethodOptions`.                                                                        |
| `OrderBy<Campo>Asc` / `OrderBy<Campo>Desc` | Embute uma ordenação fixa diretamente no nome do método — encadeie campos com `And` (ex.: `OrderByCreatedAtAscAndNameDesc`). Não precisa de argumento `order`. *OBS: Se você não especificar `Asc` ou `Desc` ele considera como `Asc`* |
| `Distinct<Campo>And<Campo>...`             | Embute campos `distinct` fixos diretamente no nome do método (só válido em métodos da família `findBy`/`findWhere`).                                                           |
| `IgnoreConflicts`                          | No `createMany`/`createManyReturning`, ignora registros que violariam uma constraint única, em vez de lançar erro. _(Renomeado do `SkipDuplicates` da v1.)_                    |

> ⚠️ **Ordem dos parâmetros:** `pagination` e `order` sempre vêm **antes** do último argumento opcional `MethodOptions<T>`. Quando `order` e `pagination` estão presentes juntos, a ordem relativa entre eles segue o nome do sufixo (`OrderedAndPaginated` → order, pagination; `PaginatedAndOrdered` → pagination, order).
>
> Usar `Paginated`/`Ordered`/`OrderBy`, `Distinct` ou `IgnoreConflicts` num prefixo que não os suporta (ex.: `Distinct` em `findOneBy`, `Paginated` em `existsBy`, `IgnoreConflicts` em `create`) lança um `VSRepoError` (`RESOLVER`) ao construir o repository, em vez de virar silenciosamente parte do nome do campo.

```typescript
// Paginated: pagination é o penúltimo parâmetro (antes do MethodOptions)
@DynamicMethod()
declare findByActiveOrderByCreatedAtDescPaginated:
    (active: boolean, pagination: Pagination, options?: MethodOptions<User>) => Promise<User[]>;

// OrderedAndPaginated: order, depois pagination, depois MethodOptions
@DynamicMethod()
declare findByNameContainsIgnoreCaseOrderedAndPaginated:
    (name: string, order: Ordering<User>, pagination: Pagination, options?: MethodOptions<User>) => Promise<User[]>;

@DynamicMethod()
declare createManyIgnoreConflicts: (data: DeepPartial<User>[]) => Promise<{ count: number }>;

// createManyReturning: mesmo comportamento do createMany, mas retorna os registros criados
@DynamicMethod()
declare createManyReturningIgnoreConflicts: (data: DeepPartial<User>[]) => Promise<User[]>;

// findOne sem filtro (equivalente ao findOneOrThrow sem filtro, mas retorna null em vez de lançar)
@DynamicMethod()
declare findOne: (options?: MethodOptions<User>) => Promise<User | null>;
```

> ⚠️ **Precedência entre `Distinct` e `OrderBy`:** quando os dois são usados no mesmo nome de método, **`Distinct` deve vir antes de `OrderBy`**:
>
> ```typescript
> @DynamicMethod()
> declare findByActiveDistinctNameOrderByCreatedAtDesc:
>     (active: boolean) => Promise<User[]>;
> ```
>
> Colocar `OrderBy` antes de `Distinct` (ex.: `findByActiveOrderByCreatedAtDescDistinctName`) não é um padrão válido e não será interpretado como esperado.

## Options do decorador

`@DynamicMethod<T>(options?)` aceita:

| Option           | Tipo          | Descrição                                                                                                                                |
| ---------------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `proxyTo`        | `string`      | Redireciona a lógica do método para outro padrão de método dinâmico válido — útil para nomes que não seguem a convenção de nomenclatura. |
| `injectOrdering` | `Ordering<T>` | Ordenação fixa injetada automaticamente, sobrescrevendo o `defaultOrdering` do repository.                                               |

```typescript
// proxyTo: dá um nome customizado ao método reutilizando um padrão existente
@DynamicMethod<User>({ proxyTo: "findByEmail" })
declare buscarPorEmail: (email: string, options?: MethodOptions<User>) => Promise<User[]>;

// injectOrdering: sempre ordena por createdAt desc, sobrescrevendo o defaultOrdering
@DynamicMethod<User>({ injectOrdering: { createdAt: "desc" } })
declare findByStatus: (status: string) => Promise<User[]>;
```

## Tipagem de retorno restrita com `InferMethodType`

Normalmente você escreve à mão a assinatura de um método dinâmico, e o retorno é o que você declarar (em geral a entidade inteira). `InferMethodType<Args, Return, OrmTypes?>` declara o método para você e infere o retorno **a cada chamada** a partir do `select`/`relations` passados — com as mesmas regras do [`InferMethodReturn`](./select-and-relations.pt-BR.md#tipagem-de-retorno-restrita-com-infermethodreturn):

```typescript
class UserRepository extends VSRepository<User, string, MyOrmTypes> {
    @DynamicMethod()
    declare findByName: InferMethodType<[name: string], User[], MyOrmTypes>;

    // a terceira generic (OrmTypes) é opcional
    @DynamicMethod()
    declare findOneByEmail: InferMethodType<[email: string], User | null>;
}

await userRepository.findByName("John");
// { id: string; name: string; email: string }[]  (apenas os campos escalares)

await userRepository.findByName("John", { select: { id: true, products: { id: true } } });
// { id: string; products: { id: string }[] }[]

await userRepository.findOneByEmail("john@example.com", { relations: { address: true } });
// { id: string; name: string; email: string; address: Address | null } | null
```

| Generic    | Descrição                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Args`     | Tupla com os argumentos posicionais do método, **sem** `options` — ex.: `[name: string]` ou `[where: VSRepoWhere<User>, pagination: Pagination]`.         |
| `Return`   | O que o método resolve: `Entity`, `Entity \| null` ou `Entity[]`. O tipo da entidade usado em `select`/`relations` é extraído daqui.                      |
| `OrmTypes` | _Opcional._ `VSRepoOrmTypes` do seu ORM, usado para tipar a option `db` (veja [Criando um repository](../README.pt-BR.md#criando-um-repository)). Padrão: `VSRepoOrmTypes`. |

- `options` (`MethodOptions<Entity, OrmTypes>`) é sempre o **último** parâmetro, opcional, depois de todos os argumentos de `Args`. Se algum desses argumentos for opcional, passe `undefined` explicitamente para alcançar `options`.
- Sem `options` o resultado tem apenas os campos escalares; com elas, segue as [mesmas regras](./select-and-relations.pt-BR.md#tipagem-de-retorno-restrita-com-infermethodreturn) do `InferMethodReturn` (inclusive `select` vencendo `relations`).
- Chaves inexistentes em `select`/`relations` (em qualquer profundidade) são rejeitadas em tempo de compilação, e o editor as sugere via autocomplete — igual a um parâmetro `MethodOptions<Entity>` comum.
- Funciona junto com as [options do decorador](#options-do-decorador) (`proxyTo`, `injectOrdering`).
- Foi pensado para métodos dinâmicos que retornam entidades (`findBy…`, `findOneBy…`, `findWhere…`, …). Os que não retornam — `countBy…`, `existsBy…` — mantêm a assinatura normal.

[⬆️ Voltar ao topo](#top)