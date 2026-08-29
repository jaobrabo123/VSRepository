/**
 * Testes de tipagem da API baseada em classes (DynamicRepository).
 *
 * Este arquivo não é executado — ele existe apenas para ser checado pelo compilador
 * (`tsc --noEmit`). Cada cenário "inválido" usa `@ts-expect-error` para garantir que o
 * TypeScript rejeita o uso incorreto; se o comentário `@ts-expect-error` deixar de ser
 * necessário (porque o código passou a compilar), o `tsc` aponta um erro nele mesmo,
 * denunciando uma regressão na tipagem.
 *
 * Rode com `npm run test:typing`.
 */

import { UserType } from "../../../generated/prisma/enums";
import { UserGetPayload } from "../../../generated/prisma/models";
import { DynamicMethod, DynamicMethodOptions, DynamicRepository } from "../../generated/vsrepo";
import prisma from "../../examples/prisma";

type User = UserGetPayload<{
    include: {
        address: true;
        products: true;
    };
}>;

class UserRepository extends DynamicRepository<
    User,
    "User",
    string,
    { address: true; products: true }
> {
    constructor() {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            requiredWhere: { active: true },
            relations: {
                address: { mode: "oto", pk: "id", restriction: "set" },
                products: { mode: "otm", pk: "id", restriction: "add" },
            },
        });
    }

    @DynamicMethod()
    declare findByUserType: (
        userType: UserType,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;
}

const userRepository = new UserRepository();

async function baseMethodsScenarios() {
    // ── PK e retorno dos métodos base ────────────────────────────────────────

    // @ts-expect-error a PK do User é uma string (uuid), não um número
    await userRepository.get(1);

    const found = await userRepository.get("1");
    const okName: string | undefined = found?.name;

    // Diferente do setupVSRepo, o DynamicRepository não suporta selectModels — o
    // retorno é sempre a entidade completa, então "password" existe no tipo mesmo sem
    // ter sido explicitamente selecionado (ver nota sobre `select` cru abaixo).
    const okPassword: string | undefined = found?.password;

    console.log(okName, okPassword);
}

async function rawIncludeScenarios() {
    // ── Raw include (DynamicMethodOptions.include) ───────────────────────────

    const withAddress = await userRepository.get("1", {
        include: { address: true },
    });
    // O retorno permanece `User` (tipo fixo da entidade) independentemente do include —
    // o DynamicRepository não estreita o tipo a partir de `include`/`select`.
    const okAddress = withAddress?.address;

    console.log(okAddress);
}

async function rawSelectScenarios() {
    // ── Raw select (DynamicMethodOptions.select) ─────────────────────────────

    // Aceita um select cru válido para o modelo "User"
    await userRepository.get("1", { select: { id: true, name: true } });

    // @ts-expect-error chave inexistente no modelo "User" não deve ser aceita no select
    await userRepository.get("1", { select: { doesNotExist: true } });

    // @ts-expect-error chave inexistente no modelo "User" não deve ser aceita no include
    await userRepository.get("1", { include: { doesNotExist: true } });
}

async function dynamicMethodScenarios() {
    // ── Métodos dinâmicos (@DynamicMethod) ────────────────────────────────────

    const byType = await userRepository.findByUserType(UserType.ADMIN);
    const okType: UserType | undefined = byType[0]?.userType;

    // @ts-expect-error UserType inválido não deve ser aceito
    await userRepository.findByUserType("NOT_A_USER_TYPE");

    console.log(okType);
}

async function batchMethodsOmitScenarios() {
    // ── Métodos em lote omitem include/select ────────────────────────────────

    // @ts-expect-error saveList não aceita "include" (só métodos que retornam um único registro aceitam)
    await userRepository.saveList([], { include: { address: true } });

    // @ts-expect-error saveList não aceita "select"
    await userRepository.saveList([], { select: { id: true } });
}

void baseMethodsScenarios;
void rawIncludeScenarios;
void rawSelectScenarios;
void dynamicMethodScenarios;
void batchMethodsOmitScenarios;
