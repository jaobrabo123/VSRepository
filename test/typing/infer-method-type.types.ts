// Testes de tipagem (compile-time only) do utilitário `InferMethodType`.
// Não são executados pelo Jest — só precisam compilar limpo com `tsc --noEmit`
// (ver `bun run test:typing`). `Expect<Equal<A, B>>` só compila se A e B forem
// exatamente o mesmo tipo, e cada `@ts-expect-error` documenta um uso que DEVE
// falhar a compilar (se passar a compilar, o TS2578 quebra o `test:typing`).

import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { DynamicMethod } from "../../src/decorators/dynamic-method.decorator";
import { InferMethodType } from "../../src/types/utils/infer-method-type.type";
import { MethodOptions } from "../../src/types/utils/methods-options.type";
import { User as HelperUser } from "../helpers/entities";

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

type Tag = { id: string; name: string };

type Product = {
    id: string;
    name: string;
    description: string | null;
    tags: Tag[];
};

type User = {
    id: string;
    name: string;
    email: string;
    deletedAt: Date | null;
    address: { id: string; city: string } | null;
    products: Product[];
};

// ORM types "concretos", para testar a 3ª generic (`db` tipado)
class MyClient {
    query(): void {}
}
class MyTransaction {
    commit(): void {}
}
type MyOrmTypes = { dbClient: MyClient; dbTransaction: MyTransaction };

class UserRepository extends VSRepository<User, string, MyOrmTypes> {
    // Exemplo do uso principal: 3ª generic informada
    @DynamicMethod()
    declare findByName: InferMethodType<[name: string], User[], MyOrmTypes>;

    // 3ª generic opcional
    @DynamicMethod()
    declare findOneByEmail: InferMethodType<[email: string], User | null>;

    // Vários argumentos (incluindo opcional): `options` vem sempre depois de todos
    @DynamicMethod()
    declare findByNameAndEmail: InferMethodType<[name: string, email?: string], User[]>;
}

declare const adapter: VSRepoAdapter<User>;
const repo = new UserRepository(adapter as never);

// Tudo dentro de uma função async nunca chamada — só precisa compilar, não rodar.
async function _typeChecks(): Promise<void> {
    // --- sem options: só escalares ------------------------------------------
    {
        const result = await repo.findByName("John");
        type _ = Expect<Equal<typeof result, { id: string; name: string; email: string; deletedAt: Date | null }[]>>;
    }

    // --- relations ------------------------------------------------------------
    {
        const result = await repo.findByName("John", { relations: { products: true } });
        type _ = Expect<
            Equal<
                typeof result,
                {
                    id: string;
                    name: string;
                    email: string;
                    deletedAt: Date | null;
                    products: { id: string; name: string; description: string | null }[];
                }[]
            >
        >;
    }

    // --- select (com relação aninhada) ---------------------------------------
    {
        const result = await repo.findByName("John", {
            select: { id: true, products: { id: true, tags: true } },
        });
        type _ = Expect<
            Equal<typeof result, { id: string; products: { id: string; tags: { id: string; name: string }[] }[] }[]>
        >;
    }

    // --- `| null` do retorno preservado, 3ª generic omitida ---------------------
    {
        const result = await repo.findOneByEmail("a@b.com", {
            select: { id: true, address: true },
        });
        type _ = Expect<Equal<typeof result, { id: string; address: { id: string; city: string } | null } | null>>;
    }

    // --- vários argumentos: options depois de todos ----------------------------
    {
        const r1 = await repo.findByNameAndEmail("John");
        const r2 = await repo.findByNameAndEmail("John", "a@b.com", { select: { id: true } });
        type _1 = Expect<Equal<typeof r1, { id: string; name: string; email: string; deletedAt: Date | null }[]>>;
        type _2 = Expect<Equal<typeof r2, { id: string }[]>>;

        // @ts-expect-error `options` não pode ocupar a posição do argumento opcional 'email'
        await repo.findByNameAndEmail("John", { select: { id: true } });
    }

    // --- `select` tem precedência sobre `relations` (igual ao InferMethodReturn) -
    {
        const result = await repo.findByName("John", {
            select: { id: true },
            relations: { products: true },
        });
        type _ = Expect<Equal<typeof result, { id: string }[]>>;
    }

    // --- `see` e `db` aceitos e sem efeito no tipo; `db` tipado pela 3ª generic --
    {
        const result = await repo.findByName("John", {
            select: { id: true },
            see: "all",
            db: new MyClient(),
        });
        const inTx = await repo.findByName("John", {
            select: { id: true },
            db: new MyTransaction(),
        });
        type _1 = Expect<Equal<typeof result, { id: string }[]>>;
        type _2 = Expect<Equal<typeof inTx, { id: string }[]>>;

        // @ts-expect-error 'db' precisa ser MyClient | MyTransaction (3ª generic)
        await repo.findByName("John", { db: "não é um client" });
        // @ts-expect-error 'see' precisa ser um SeeMode
        await repo.findByName("John", { see: "nope" });
    }

    // --- options já declaradas (variável) --------------------------------------
    {
        const narrow = { select: { id: true, name: true } } satisfies MethodOptions<User>;
        const r1 = await repo.findByName("John", narrow);
        type _1 = Expect<Equal<typeof r1, { id: string; name: string }[]>>;

        // Anotada como `MethodOptions<T>` não dá para saber o conteúdo: tipagem padrão da lib
        const wide: MethodOptions<User> = { select: { id: true } };
        const r2 = await repo.findByName("John", wide);
        type _2 = Expect<Equal<typeof r2, User[]>>;
    }

    // --- chaves inexistentes são barradas (não perdemos o excess property check) --
    {
        // @ts-expect-error 'idd' não existe em User
        await repo.findByName("John", { select: { id: true, idd: true } });
        // @ts-expect-error 'idd' não existe em Product
        await repo.findByName("John", { select: { products: { id: true, idd: true } } });
        // @ts-expect-error 'idd' não existe em Tag (2 níveis de profundidade)
        await repo.findByName("John", { select: { products: { tags: { idd: true } } } });
        // @ts-expect-error 'tagz' não existe em Product
        await repo.findByName("John", { relations: { products: { tagz: true } } });
        // @ts-expect-error 'productz' não existe em User
        await repo.findByName("John", { relations: { productz: true } });
        // @ts-expect-error campo escalar não aceita um objeto aninhado
        await repo.findByName("John", { select: { id: { x: true } } });
        // @ts-expect-error 'selec' não é uma chave de MethodOptions
        await repo.findByName("John", { selec: { id: true } });
    }

    // --- argumentos posicionais continuam checados ------------------------------
    {
        // @ts-expect-error 'name' precisa ser string
        await repo.findByName(123);
        // @ts-expect-error 'name' é obrigatório
        await repo.findByName();
    }
}

// --- Entidade com relações/campos opcionais (`?`): modificadores preservados ---
declare const helperRepo: {
    findById: InferMethodType<[id: string], HelperUser | null>;
};

async function _optionalModifiers(): Promise<void> {
    const result = await helperRepo.findById("1", {
        select: { id: true, address: { city: true }, products: { id: true } },
    });
    type _ = Expect<
        Equal<typeof result, { id: string; address?: { city: string } | null; products?: { id: string }[] } | null>
    >;
}
