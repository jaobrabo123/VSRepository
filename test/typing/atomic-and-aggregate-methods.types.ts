// Testes de tipagem (compile-time only) dos 8 métodos novos. Não são
// executados pelo Jest — só precisam compilar limpo com `tsc --noEmit`
// (ver `npm run test:typing`). Cada bloco `@ts-expect-error` documenta um
// uso que DEVE falhar a compilar; se o comentário ficar "sem efeito" (ou
// seja, a linha abaixo dele passar a compilar de verdade), o `tsc` acusa
// erro TS2578 e o `test:typing` quebra — funcionando como asserção.

import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { User } from "../helpers/entities";

declare const userRepository: VSRepository<User, string>;
declare const adapter: VSRepoAdapter<User>;

// Tudo dentro de uma função async nunca chamada — só precisa compilar, não
// rodar (o arquivo é CommonJS, então `await` de topo de arquivo não é válido).
async function typeChecks(): Promise<void> {
    // --- 'field' só aceita chaves numéricas (NumericKeys<Entity>) ----------

    await userRepository.increment("user-1", "balance", 10); // ok — number
    await userRepository.increment("user-1", "bonusPoints", 10); // ok — number | null (nullable incluído)

    // @ts-expect-error "name" é string, não é NumericKeys<User>
    await userRepository.increment("user-1", "name", 10);

    // @ts-expect-error "address" é uma relação, não é NumericKeys<User>
    await userRepository.increment("user-1", "address", 10);

    await userRepository.sum("balance"); // ok
    // @ts-expect-error "email" não é NumericKeys<User>
    await userRepository.sum("email");

    // --- 'value' precisa bater com o tipo do campo --------------------------

    // @ts-expect-error 'value' precisa ser 'number' (tipo de 'balance'), não 'string'
    await userRepository.increment("user-1", "balance", "10");

    // --- 'options' de sum/average/min/max não aceita 'select'/'relations' --
    // (RestrictMethodOptions só expõe 'db'/'see' — select/relations não
    // fazem sentido para um retorno 'number | null')

    // @ts-expect-error 'select' não existe em RestrictMethodOptions
    await userRepository.sum("balance", {}, { select: { id: true } });

    // @ts-expect-error 'relations' não existe em RestrictMethodOptions
    await userRepository.average("balance", {}, { relations: {} });

    // 'increment'/'decrement'/'multiply'/'divide' continuam com
    // MethodOptions completo (aceitam 'select'/'relations'), diferente de
    // sum/average/min/max:
    await userRepository.increment("user-1", "balance", 10, {
        select: { id: true, balance: true },
    });

    // --- Contrato do adapter espelha as mesmas constraints ------------------

    await adapter.incrementOne("balance", 10, { id: "user-1" });
    // @ts-expect-error "name" não é NumericKeys<User>
    await adapter.incrementOne("name", "x", { id: "user-1" });

    await adapter.sum("balance");
    // @ts-expect-error "name" não é NumericKeys<User>
    await adapter.sum("name");
}

void typeChecks;
