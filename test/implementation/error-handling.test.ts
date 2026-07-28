// Testes de implementação para os caminhos de erro da biblioteca.
//
// Diferente de functional-api.test.ts e class-based-api.test.ts, estes testes NÃO
// precisam de um banco Postgres real: todas as validações aqui cobertas acontecem antes
// de qualquer query ser enviada ao banco (validação de config, de argumentos do
// construtor/build/extend, de PK ausente, e de argumentos de decorator). Por isso usamos
// um "prisma" falso (apenas com o formato mínimo exigido pela validação) em vez de uma
// conexão real.
//
// Rode com `npm test` ou `npm run test:implementation`.

import { describe, it, expect } from "@jest/globals";
import { UserGetPayload } from "../../generated/prisma/models";
import {
    setupVSRepo,
    DynamicRepository,
    DynamicMethod,
    QueryMethod,
    VSRepoError,
    VSRepoConfigError,
    VSRepoBuildError,
    VSRepoExtendError,
    VSRepoRuntimeError,
    VSRepoDecoratorError,
} from "../../generated/vsrepo";

type User = UserGetPayload<{
    include: {
        address: true;
        products: true;
    };
}>;

// "Prisma" mínimo o suficiente para passar pela validação de `.build()` (precisa parecer
// um client Prisma: um objeto com `$transaction`). Nenhuma query chega a ser executada
// nos testes abaixo, então não é preciso um client de verdade.
const fakePrisma = {
    $transaction: () => Promise.resolve(),
    user: {},
} as any;

// =============================================================================
// VSRepoConfigError — configuração inválida passada para setupVSRepo/VSRepository
// =============================================================================

describe("VSRepoConfigError", () => {
    it("é lançado quando a config não tem 'tableName'", () => {
        expect(() => {
            setupVSRepo<User, "User">()({
                pkName: "id",
            } as any);
        }).toThrow(VSRepoConfigError);
    });

    it("é lançado quando a config não tem 'pkName'", () => {
        expect(() => {
            setupVSRepo<User, "User">()({
                tableName: "user",
            } as any);
        }).toThrow(VSRepoConfigError);
    });

    it("é lançado quando 'defaultSelectModel' não é uma chave válida de 'selectModels'", () => {
        expect(() => {
            setupVSRepo<User, "User">()({
                tableName: "user",
                pkName: "id",
                selectModels: { public: { id: true } },
                defaultSelectModel: "does-not-exist",
            } as any);
        }).toThrow(VSRepoConfigError);
    });

    it("é uma instância de VSRepoError e tem type 'VSREPO_CONFIG'", () => {
        try {
            setupVSRepo<User, "User">()({} as any);
            throw new Error("deveria ter lançado VSRepoConfigError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect(err instanceof VSRepoConfigError).toBe(true);
            expect((err as any).type === "VSREPO_CONFIG").toBe(true);
        }
    });
});

// =============================================================================
// VSRepoBuildError — argumentos inválidos passados para .build()
// =============================================================================

describe("VSRepoBuildError", () => {
    const userVSRepo = setupVSRepo<User, "User">()({
        tableName: "user",
        pkName: "id",
    });

    it("é lançado quando o 'prisma' passado não é um objeto", () => {
        expect(() => {
            userVSRepo.build("not-a-prisma-client" as any);
        }).toThrow(VSRepoBuildError);
    });

    it("é lançado quando o 'prisma' passado não tem '$transaction' (não parece um Prisma Client)", () => {
        expect(() => {
            userVSRepo.build({ user: {} } as any);
        }).toThrow(VSRepoBuildError);
    });

    it("é uma instância de VSRepoError e tem type 'VSREPO_BUILD'", () => {
        try {
            userVSRepo.build(null as any);
            throw new Error("deveria ter lançado VSRepoBuildError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect(err instanceof VSRepoBuildError).toBe(true);
            expect((err as any).type === "VSREPO_BUILD").toBe(true);
        }
    });
});

// =============================================================================
// VSRepoExtendError — argumentos inválidos passados para .extend()
// =============================================================================

describe("VSRepoExtendError", () => {
    const userVSRepo = setupVSRepo<User, "User">()({
        tableName: "user",
        pkName: "id",
    });

    it("é lançado quando o argumento de .extend() não é uma função", () => {
        expect(() => {
            (userVSRepo as any).extend("not-a-function");
        }).toThrow(VSRepoExtendError);
    });

    it("é lançado quando a função passada para .extend() não retorna um objeto", () => {
        expect(() => {
            (userVSRepo as any).extend(() => "not-an-object");
        }).toThrow(VSRepoExtendError);
    });

    it("é uma instância de VSRepoError e tem type 'VSREPO_EXTEND'", () => {
        try {
            (userVSRepo as any).extend(123);
            throw new Error("deveria ter lançado VSRepoExtendError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect(err instanceof VSRepoExtendError).toBe(true);
            expect((err as any).type === "VSREPO_EXTEND").toBe(true);
        }
    });
});

// =============================================================================
// VSRepoRuntimeError — argumentos inválidos passados para os métodos em runtime
// =============================================================================

describe("VSRepoRuntimeError", () => {
    const userVSRepo = setupVSRepo<User, "User">()({
        tableName: "user",
        pkName: "id",
    });
    const userRepository = userVSRepo.build(fakePrisma);

    it("é lançado por 'get' quando a PK não é informada", async () => {
        await expect(userRepository.get(undefined as any)).rejects.toThrow(VSRepoRuntimeError);
    });

    it("é lançado por 'getOrThrow' quando a PK não é informada", async () => {
        await expect(userRepository.getOrThrow(undefined as any)).rejects.toThrow(VSRepoRuntimeError);
    });

    it("é lançado por 'remove' quando a PK não é informada", async () => {
        await expect(userRepository.remove(undefined as any)).rejects.toThrow(VSRepoRuntimeError);
    });

    it("tem um 'code' preenchido, além do 'type'", async () => {
        try {
            await userRepository.get(undefined as any);
            throw new Error("deveria ter lançado VSRepoRuntimeError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect(err instanceof VSRepoRuntimeError).toBe(true);
            expect((err as any).type === "VSREPO_RUNTIME").toBe(true);
            expect(typeof (err as any).code === "string").toBe(true);
            expect(((err as any).code?.length ?? 0) > 0).toBe(true);
        }
    });
});

// =============================================================================
// VSRepoDecoratorError — argumentos inválidos passados para @DynamicMethod/@QueryMethod
//
// Diferente dos outros, este erro é lançado no momento em que o decorator é aplicado —
// ou seja, durante a definição da classe, não durante uma chamada de método. Por isso os
// cenários abaixo definem a classe dentro de uma função e chamam essa função dentro do
// expect(), para capturar o erro no momento certo.
// =============================================================================

describe("VSRepoDecoratorError", () => {
    it("é lançado quando o 'value' de @QueryMethod não é uma string", () => {
        expect(() => {
            class Broken extends DynamicRepository<User, "User", string> {
                constructor() {
                    super(fakePrisma, { tableName: "user", pkName: "id" });
                }

                @QueryMethod(123 as any)
                declare brokenMethod: () => Promise<User[]>;
            }
            void Broken;
        }).toThrow(VSRepoDecoratorError);
    });

    it("é lançado quando a config de @DynamicMethod não é um objeto válido", () => {
        expect(() => {
            class Broken extends DynamicRepository<User, "User", string> {
                constructor() {
                    super(fakePrisma, { tableName: "user", pkName: "id" });
                }

                @DynamicMethod("not-an-object" as any)
                declare brokenMethod: () => Promise<User[]>;
            }
            void Broken;
        }).toThrow(VSRepoDecoratorError);
    });

    it("é uma instância de VSRepoError e tem type 'VSREPO_DECORATOR'", () => {
        try {
            class Broken extends DynamicRepository<User, "User", string> {
                constructor() {
                    super(fakePrisma, { tableName: "user", pkName: "id" });
                }

                @QueryMethod(123 as any)
                declare brokenMethod: () => Promise<User[]>;
            }
            void Broken;
            throw new Error("deveria ter lançado VSRepoDecoratorError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect(err instanceof VSRepoDecoratorError).toBe(true);
            expect((err as any).type === "VSREPO_DECORATOR").toBe(true);
        }
    });
});
