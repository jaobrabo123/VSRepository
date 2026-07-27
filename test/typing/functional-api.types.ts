/**
 * Testes de tipagem da API funcional (setupVSRepo).
 *
 * Este arquivo não é executado — ele existe apenas para ser checado pelo compilador
 * (`tsc --noEmit`). Cada cenário "inválido" usa `@ts-expect-error` para garantir que o
 * TypeScript rejeita o uso incorreto; se o comentário `@ts-expect-error` deixar de ser
 * necessário (porque o código passou a compilar), o `tsc` aponta um erro nele mesmo,
 * denunciando uma regressão na tipagem.
 *
 * Rode com `npm run test:typing`.
 */

import { UserType } from "@vsrepo/prisma/types";
import { UserGetPayload } from "../../generated/prisma/models";
import { setupVSRepo } from "../../generated/vsrepo";
import prisma from "../../examples/prisma";

type User = UserGetPayload<{
    include: {
        address: true;
        products: true;
    };
}>;

const userVSRepo = setupVSRepo<User, "User">()({
    tableName: "user",
    pkName: "id",

    selectModels: {
        public: { id: true, name: true, email: true, userType: true },
        internal: { id: true, name: true, email: true, password: true },
    },
    defaultSelectModel: "public",

    includeModels: {
        withAddress: { address: true },
        withProducts: { products: true },
    },

    methods: {
        findByUserType: { map: true },
    },
});

const userRepository = userVSRepo.build(prisma);

async function selectModelsScenarios() {
    // ── selectModel narrowing ────────────────────────────────────────────────

    // Sem opções: usa o defaultSelectModel ("public"), então "password" não deve existir
    const withDefault = await userRepository.get("1");
    // @ts-expect-error "password" não faz parte do selectModel "public" (default)
    withDefault?.password;

    // Com selectModel "internal": "password" deve existir
    const withInternal = await userRepository.get("1", { selectModel: "internal" });
    const okPassword: string | undefined = withInternal?.password;

    // Com selectModel: false, retorna o payload completo do Prisma
    const withFullPayload = await userRepository.get("1", { selectModel: false });
    const okActive: boolean | undefined = withFullPayload?.active;

    // @ts-expect-error selectModel inexistente não deve ser aceito
    await userRepository.get("1", { selectModel: "does-not-exist" });

    console.log(okPassword, okActive);
}

async function includeModelsScenarios() {
    // ── includeModel narrowing ───────────────────────────────────────────────

    const withAddress = await userRepository.get("1", { includeModel: "withAddress" });
    const okAddress = withAddress?.address;

    // @ts-expect-error "products" não foi incluído por "withAddress"
    withAddress?.products;

    // @ts-expect-error selectModel e includeModel são mutuamente exclusivos
    await userRepository.get("1", { selectModel: "public", includeModel: "withAddress" });

    console.log(okAddress);
}

async function rawIncludeScenarios() {
    // ── Raw include (options.include) ────────────────────────────────────────

    const rawIncluded = await userRepository.get("1", {
        include: { address: true },
    });
    const okAddress = rawIncluded?.address;

    // @ts-expect-error include cru e selectModel são mutuamente exclusivos
    await userRepository.get("1", { include: { address: true }, selectModel: "public" });

    // @ts-expect-error include cru e includeModel são mutuamente exclusivos
    await userRepository.get("1", { include: { address: true }, includeModel: "withAddress" });

    console.log(okAddress);
}

async function rawSelectScenarios() {
    // ── Raw select (options.select) ──────────────────────────────────────────

    const rawSelected = await userRepository.get("1", {
        select: { id: true, name: true },
    });

    // @ts-expect-error "email" não faz parte do select cru { id, name }
    rawSelected?.email;

    const okId: string | undefined = rawSelected?.id;
    const okName: string | null | undefined = rawSelected?.name;

    // @ts-expect-error select cru e selectModel são mutuamente exclusivos
    await userRepository.get("1", { select: { id: true }, selectModel: "public" });

    // @ts-expect-error select cru e includeModel são mutuamente exclusivos
    await userRepository.get("1", { select: { id: true }, includeModel: "withAddress" });

    // @ts-expect-error select cru e include cru são mutuamente exclusivos
    await userRepository.get("1", { select: { id: true }, include: { address: true } });

    console.log(okId, okName);
}

async function pkAndDynamicMethodsScenarios() {
    // ── Tipagem da PK ─────────────────────────────────────────────────────────

    // @ts-expect-error a PK do User é uma string (uuid), não um número
    await userRepository.get(1);

    // ── Métodos dinâmicos (config.methods) ───────────────────────────────────

    const byType = await userRepository.findByUserType(UserType.ADMIN);
    const okType: UserType | undefined = byType[0]?.userType;

    // @ts-expect-error UserType inválido não deve ser aceito
    await userRepository.findByUserType("NOT_A_USER_TYPE");

    console.log(okType);
}

void selectModelsScenarios;
void includeModelsScenarios;
void rawIncludeScenarios;
void rawSelectScenarios;
void pkAndDynamicMethodsScenarios;
