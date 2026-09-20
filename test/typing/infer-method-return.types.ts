// Testes de tipagem (compile-time only) do utilitário `InferMethodReturn`.
// Não são executados pelo Jest — só precisam compilar limpo com `tsc --noEmit`
// (ver `bun run test:typing`). `Expect<Equal<A, B>>` só compila se A e B forem
// exatamente o mesmo tipo (não basta um ser atribuível ao outro), e cada bloco
// `@ts-expect-error` documenta um uso que DEVE falhar a compilar.

import { VSRepository } from "../../src/VSRepository";
import { MethodOptions } from "../../src/types/utils/methods-options.type";
import { InferMethodReturn } from "../../src/types/utils/infer-method-return.type";
import { User as HelperUser } from "../helpers/entities";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// Entidades do exemplo (relações obrigatórias, como em ORMs que sempre tipam o campo)
type Address = {
    id: string;
    city: string;
    state: string;
    country: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
};

type Tag = {
    id: string;
    name: string;
};

type Product = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    userId: string;
    tags: Tag[];
};

type User = {
    id: string;
    name: string;
    email: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    address: Address | null;
    products: Product[];
};

declare const userRepository: VSRepository<User, string>;

// Tudo dentro de uma função async nunca chamada — só precisa compilar, não rodar.
async function _typeChecks(): Promise<void> {
    // --- relations: escalares + relações pedidas ----------------------------
    {
        const options = { relations: { products: true } } satisfies MethodOptions<User>;
        const result: InferMethodReturn<User, typeof options> = await userRepository.getOrThrow("id", options);

        type _ = Expect<
            Equal<
                typeof result,
                {
                    id: string;
                    name: string;
                    email: string;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    products: {
                        id: string;
                        name: string;
                        description: string | null;
                        price: string;
                        userId: string;
                    }[];
                }
            >
        >;

        // @ts-expect-error 'address' não foi pedida em 'relations'
        const _1 = result.address;
        // @ts-expect-error 'tags' (relação de products) não foi pedida
        const _2 = result.products[0]?.tags;
    }

    // --- select: só os campos selecionados; `| null` no retorno preservado --
    {
        const options = {
            select: { id: true, email: true, name: true },
        } satisfies MethodOptions<User>;
        const result: InferMethodReturn<User | null, typeof options> = await userRepository.get("id", options);

        type _ = Expect<Equal<typeof result, { id: string; name: string; email: string } | null>>;
    }

    // --- relations aninhadas + relação nullable (`Address | null`) -----------
    {
        const options = {
            relations: { products: { tags: true }, address: true },
        } satisfies MethodOptions<User>;
        const result: InferMethodReturn<User[], typeof options> = await userRepository.getAll(options);

        type _ = Expect<
            Equal<
                typeof result,
                {
                    id: string;
                    name: string;
                    email: string;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    address: {
                        id: string;
                        city: string;
                        state: string;
                        country: string;
                        userId: string;
                        createdAt: Date;
                        updatedAt: Date;
                    } | null;
                    products: {
                        id: string;
                        name: string;
                        description: string | null;
                        price: string;
                        userId: string;
                        tags: {
                            id: string;
                            name: string;
                        }[];
                    }[];
                }[]
            >
        >;
    }

    // --- select com relação aninhada (relação carrega mesmo sem 'relations') -
    {
        const options = {
            select: { id: true, products: { id: true, tags: true } },
        } satisfies MethodOptions<User>;
        const result: InferMethodReturn<User[], typeof options> = await userRepository.getAll(options);

        type _ = Expect<
            Equal<
                typeof result,
                {
                    id: string;
                    products: {
                        id: string;
                        tags: {
                            id: string;
                            name: string;
                        }[];
                    }[];
                }[]
            >
        >;
    }

    // --- sem select/relations: só escalares, sem relações --------------------
    {
        const options = {} satisfies MethodOptions<User>;
        const result: InferMethodReturn<User, typeof options> = await userRepository.getOrThrow("id", options);

        type _ = Expect<
            Equal<
                typeof result,
                {
                    id: string;
                    name: string;
                    email: string;
                    active: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                }
            >
        >;

        // @ts-expect-error relações não fazem parte do retorno sem 'relations'
        const _1 = result.products;
    }
}

// --- Casos de borda -------------------------------------------------------

// Sem o 2º argumento genérico, equivale a options vazias
type _NoOptions = Expect<
    Equal<
        InferMethodReturn<Tag>,
        {
            id: string;
            name: string;
        }
    >
>;

// `null`/array-ness do retorno são preservados
type _Nullable = Expect<Equal<InferMethodReturn<Tag | null>, { id: string; name: string } | null>>;
type _Array = Expect<Equal<InferMethodReturn<Tag[]>, { id: string; name: string }[]>>;
type _NullableArray = Expect<Equal<InferMethodReturn<Tag[] | null>, { id: string; name: string }[] | null>>;

// `see` e `db` não afetam o tipo
type _SeeDb = Expect<Equal<InferMethodReturn<Tag, { see: "all"; db: unknown; select: { id: true } }>, { id: string }>>;

// `select` tem precedência: com `select` presente, `relations` é ignorado
// (espelha o adapter Prisma 7, que descarta `relations` quando há `select`)
type _SelectWinsOverRelations = Expect<
    Equal<InferMethodReturn<User, { select: { id: true }; relations: { products: true } }>, { id: string }>
>;
type _SelectWinsOverRelationsSameField = Expect<
    Equal<
        InferMethodReturn<User, { relations: { products: true }; select: { products: { id: true } } }>,
        { products: { id: string }[] }
    >
>;

// Com `select` estreitado, um `relations` "largo" também é irrelevante
type _SelectKnownRelationsWide = Expect<
    Equal<
        InferMethodReturn<User, { select: { id: true }; relations?: MethodOptions<User>["relations"] }>,
        { id: string }
    >
>;

// Relação selecionada com `true` traz todos os escalares dela, sem relações aninhadas
type _SelectRelationTrue = Expect<
    Equal<
        InferMethodReturn<User, { select: { products: true } }>,
        {
            products: {
                id: string;
                name: string;
                description: string | null;
                price: string;
                userId: string;
            }[];
        }
    >
>;

// Relação nullable selecionada preserva o `| null`
type _SelectNullableRelation = Expect<
    Equal<InferMethodReturn<User, { select: { address: { city: true } } }>, { address: { city: string } | null }>
>;

// Options "largas" (ex.: variável anotada como `MethodOptions<T>`): nada é conhecido
// em tempo de compilação, então cai na tipagem padrão da lib (entidade inteira)
type _WideOptions = Expect<Equal<InferMethodReturn<User, MethodOptions<User>>, User>>;
type _WideOptionsArray = Expect<Equal<InferMethodReturn<User[], MethodOptions<User>>, User[]>>;

// Modificadores `?` da entidade são preservados (relações/campos opcionais, como
// na entidade `User` dos helpers de teste)
type _OptionalRelations = Expect<
    Equal<
        InferMethodReturn<HelperUser, { select: { id: true; address: { city: true } } }>,
        { id: string; address?: { city: string } | null }
    >
>;
type _OptionalProducts = Expect<
    Equal<InferMethodReturn<HelperUser, { select: { products: { id: true } } }>, { products?: { id: string }[] }>
>;

// Erro de digitação em options é barrado pela constraint
// @ts-expect-error 'selec' não é uma chave de MethodOptions
type _Typo = InferMethodReturn<User, { selec: { id: true } }>;
