// Testes de tipagem (compile-time only) do query builder (`VSQueryBuilder`).
// Não são executados pelo Jest — só precisam compilar limpo com `tsc --noEmit`
// (ver `bun run test:typing`). `Expect<Equal<A, B>>` só compila se A e B forem
// exatamente o mesmo tipo, e cada bloco `@ts-expect-error` documenta um uso
// que DEVE falhar a compilar; se a linha abaixo dele passar a compilar de
// verdade, o `tsc` acusa TS2578 e o `test:typing` quebra — funcionando como
// asserção.

import { VSRepository } from "../../src/VSRepository";
import { VSQueryBuilder } from "../../src/internal/utils/vs-query-builder.util";
import { User } from "../helpers/entities";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

declare const userRepository: VSRepository<User, string>;
declare const qb: VSQueryBuilder<User>;

// Tudo dentro de uma função async nunca chamada — só precisa compilar, não
// rodar (o arquivo é CommonJS, então `await` de topo de arquivo não é válido).
async function _typeChecks(): Promise<void> {
    // --- createQueryBuilder() ------------------------------------------------

    const created = userRepository.createQueryBuilder();
    type _CreatedIsBuilderOfEntity = Expect<Equal<typeof created, VSQueryBuilder<User, any>>>;

    // --- retorno dos métodos terminais ---------------------------------------

    const many = await qb.getResult();
    type _Many = Expect<Equal<typeof many, User[]>>;

    const one = await qb.getOneResult();
    type _One = Expect<Equal<typeof one, User | null>>;

    const oneOrThrow = await qb.getOneResultOrThrow();
    type _OneOrThrow = Expect<Equal<typeof oneOrThrow, User>>;

    const count = await qb.getCount();
    type _Count = Expect<Equal<typeof count, number>>;

    const exists = await qb.getExistence();
    type _Exists = Expect<Equal<typeof exists, boolean>>;

    const resultAndCount = await qb.getResultAndCount();
    type _ResultAndCount = Expect<Equal<typeof resultAndCount, { result: User[]; count: number }>>;

    // --- encadeamento retorna o próprio builder ------------------------------

    const chained = qb
        .select({ id: true })
        .relations({ address: true })
        .where({ active: true })
        .orderBy({ name: "asc" })
        .limit(1)
        .offset(1)
        .distinctOn("name")
        .see("all");
    type _Chained = Expect<Equal<typeof chained, VSQueryBuilder<User>>>;

    const cloned = qb.clone();
    type _Cloned = Expect<Equal<typeof cloned, VSQueryBuilder<User>>>;

    // --- select --------------------------------------------------------------

    qb.select({ id: true, name: true, password: false }); // ok
    qb.select({ address: { city: true } }); // ok — select aninhado
    qb.select({ products: { name: true } }); // ok — select aninhado em array

    // @ts-expect-error 'nope' não é um campo de User
    qb.select({ nope: true });

    // @ts-expect-error 'nope' não é um campo de Address
    qb.select({ address: { nope: true } });

    // --- relations -----------------------------------------------------------

    qb.relations({ address: true, products: true }); // ok

    // @ts-expect-error 'nope' não é uma relação de User
    qb.relations({ nope: true });

    // --- where ---------------------------------------------------------------

    qb.where({ name: "João" }); // ok
    qb.where({ balance: { gt: 10, lte: 100 } }); // ok — operadores de número
    qb.where({ name: { contains: "Jo", ignoreCase: true } }); // ok — operadores de string
    qb.where({ createdAt: { between: [new Date(), new Date()] } }); // ok — operadores de data
    qb.where({ products: { _some: { name: "x" } } }); // ok — filtro de relação (array)
    qb.where({ address: { _with: { city: "x" } } }); // ok — filtro de relação (objeto)

    qb.where({ AND: [{ active: true }], OR: { name: "João" }, NOT: [{ userType: "ADMIN" as User["userType"] }] }); // ok — operadores lógicos
    qb.where({ active: true, OR: [{ name: "João" }, { email: "joao@email.com" }] }); // ok

    // @ts-expect-error 'nope' não é um campo dentro do 'OR'
    qb.where({ OR: [{ nope: 1 }] });

    // @ts-expect-error 'nope' não é um campo de User
    qb.where({ nope: 1 });

    // @ts-expect-error 'balance' é number, não string
    qb.where({ balance: "10" });

    // @ts-expect-error 'contains' só existe em campos string
    qb.where({ balance: { contains: "1" } });

    // --- orderBy -------------------------------------------------------------

    qb.orderBy({ name: "asc" }); // ok
    qb.orderBy({ name: "DESC", createdAt: "desc" }); // ok
    qb.orderBy([{ name: "asc" }, { createdAt: "desc" }]); // ok — array

    // @ts-expect-error direção inválida
    qb.orderBy({ name: "up" });

    // @ts-expect-error 'address' é uma relação, só campos primitivos são ordenáveis
    qb.orderBy({ address: "asc" });

    // @ts-expect-error 'nope' não é um campo de User
    qb.orderBy({ nope: "asc" });

    // --- limit / offset ------------------------------------------------------

    qb.limit(10); // ok
    qb.offset(10); // ok

    // @ts-expect-error 'limit' precisa ser number
    qb.limit("10");

    // @ts-expect-error 'offset' precisa ser number
    qb.offset("10");

    // @ts-expect-error 'limit' é obrigatório (não aceita mais 'undefined')
    qb.limit(undefined);

    // --- distinctOn ----------------------------------------------------------

    qb.distinctOn("name"); // ok
    qb.distinctOn(["name", "email"]); // ok

    // @ts-expect-error 'address' é uma relação, só campos primitivos aceitam distinct
    qb.distinctOn("address");

    // @ts-expect-error 'nope' não é um campo de User
    qb.distinctOn("nope");

    // @ts-expect-error 'nope' não é um campo de User (dentro do array)
    qb.distinctOn(["name", "nope"]);

    // --- see -----------------------------------------------------------------

    qb.see("active"); // ok
    qb.see("removed"); // ok
    qb.see("all"); // ok

    // @ts-expect-error modo inexistente
    qb.see("deleted");
}
