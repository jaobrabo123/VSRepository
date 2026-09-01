// Testes dos caminhos de erro do core da v2 (`VSRepository`, `@DynamicMethod`,
// `@QueryMethod`).
//
// Diferente da v1 (que falava direto com o Prisma), a v2 é ORM-agnostic e
// delega tudo a um `VSRepoAdapter` — então NENHUM teste do core precisa de um
// banco real: usamos sempre um adapter falso (`createFakeAdapter`), no mesmo
// espírito do `fakePrisma` de `error-handling.test.ts` da v1 e do
// `createFakePrisma` usado nos testes do `VSRepoPrisma7Adapter`.

import "reflect-metadata";
import { describe, it, expect } from "@jest/globals";
import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { VSRepoError } from "../../src/errors/VSRepoError";
import { VSRepoErrorType } from "../../src/internal/enums/vsrepo-error-type.enum";
import { DynamicMethod } from "../../src/decorators/dynamic-method.decorator";
import { QueryMethod } from "../../src/decorators/query-method.decorator";
import { createFakeAdapter } from "../helpers/fake-adapter";
import { User } from "../helpers/entities";

// =============================================================================
// VSRepoErrorType.VALIDATOR — config inválida passada para o construtor de VSRepository
// =============================================================================

describe("VSRepository — validação da config do construtor", () => {
    const fakeAdapter = createFakeAdapter<User>();

    class UserRepository extends VSRepository<User, string> {
        constructor(options: any) {
            super(options);
        }
    }

    it("é lançado quando a config não tem 'adapter'", () => {
        expect(() => {
            new UserRepository({ pkName: "id" });
        }).toThrow(VSRepoError);
    });

    it("é lançado quando a config não tem 'pkName'", () => {
        expect(() => {
            new UserRepository({ adapter: fakeAdapter });
        }).toThrow(VSRepoError);
    });

    it("é lançado quando 'logLevel' não é um VSLogLevel válido", () => {
        expect(() => {
            new UserRepository({ adapter: fakeAdapter, pkName: "id", logLevel: "NOT_A_LEVEL" });
        }).toThrow(VSRepoError);
    });

    it("não lança quando a config é válida e mínima (só adapter + pkName)", () => {
        expect(() => {
            new UserRepository({ adapter: fakeAdapter, pkName: "id" });
        }).not.toThrow();
    });

    it("é uma instância de VSRepoError e tem type 'VALIDATOR'", () => {
        try {
            new UserRepository({ pkName: "id" });
            throw new Error("deveria ter lançado VSRepoError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect((err as VSRepoError).type).toBe(VSRepoErrorType.VALIDATOR);
        }
    });
});

// =============================================================================
// VSRepoErrorType.DECORATOR — argumentos inválidos passados para @DynamicMethod/@QueryMethod
//
// Assim como na v1, este erro é lançado no momento em que o decorator é
// aplicado — durante a definição da classe, não durante uma chamada de
// método. Por isso os cenários abaixo definem a classe dentro de uma função
// e chamam essa função dentro do expect(), para capturar o erro no momento certo.
// =============================================================================

describe("@DynamicMethod / @QueryMethod — validação dos argumentos do decorator", () => {
    it("é lançado quando o 'value' de @QueryMethod não é uma string", () => {
        expect(() => {
            class Broken extends VSRepository<User, string> {
                @QueryMethod(123 as any)
                declare brokenMethod: () => Promise<User[]>;
            }
            void Broken;
        }).toThrow(VSRepoError);
    });

    it("é lançado quando as options de @DynamicMethod não são um objeto válido", () => {
        expect(() => {
            class Broken extends VSRepository<User, string> {
                @DynamicMethod("not-an-object" as any)
                declare brokenMethod: () => Promise<User[]>;
            }
            void Broken;
        }).toThrow(VSRepoError);
    });

    it("tem type 'DECORATOR'", () => {
        try {
            class Broken extends VSRepository<User, string> {
                @QueryMethod(123 as any)
                declare brokenMethod: () => Promise<User[]>;
            }
            void Broken;
            throw new Error("deveria ter lançado VSRepoError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect((err as VSRepoError).type).toBe(VSRepoErrorType.DECORATOR);
        }
    });
});

// =============================================================================
// VSRepoErrorType.RESOLVER — nome de método dinâmico que não segue nenhum padrão válido
// =============================================================================

describe("@DynamicMethod — resolução de nomes de método inválidos", () => {
    it("é lançado ao construir o repository quando o nome do método não corresponde a nenhum padrão suportado", () => {
        class Broken extends VSRepository<User, string> {
            constructor(adapter: VSRepoAdapter<User>) {
                super({ adapter, pkName: "id" });
            }

            @DynamicMethod()
            declare buscarPorEmail: (email: string) => Promise<User[]>;
        }

        expect(() => {
            new Broken(createFakeAdapter<User>());
        }).toThrow(VSRepoError);
    });

    it("não lança quando o nome fora do padrão usa 'proxyTo' para apontar para um padrão válido", () => {
        class Fixed extends VSRepository<User, string> {
            constructor(adapter: VSRepoAdapter<User>) {
                super({ adapter, pkName: "id" });
            }

            @DynamicMethod({ proxyTo: "findByEmail" })
            declare buscarPorEmail: (email: string) => Promise<User[]>;
        }

        expect(() => {
            new Fixed(createFakeAdapter<User>());
        }).not.toThrow();
    });
});

// =============================================================================
// VSRepoErrorType.BASE — guard clauses de mau uso dos métodos base
// =============================================================================

describe("VSRepository — guard clauses dos métodos base", () => {
    class UserRepository extends VSRepository<User, string> {
        constructor(adapter: VSRepoAdapter<User>) {
            super({ adapter, pkName: "id" });
        }
    }

    const userRepository = new UserRepository(createFakeAdapter<User>());

    it("'removeList' é lançado quando 'pks' não é um array", async () => {
        await expect(userRepository.removeList("not-an-array" as any)).rejects.toThrow(
            VSRepoError,
        );
    });

    it("'saveList' é lançado quando 'objs' não é um array", async () => {
        await expect(userRepository.saveList("not-an-array" as any)).rejects.toThrow(
            VSRepoError,
        );
    });

    it("'getList' é lançado quando 'pks' não é um array", async () => {
        await expect(userRepository.getList("not-an-array" as any)).rejects.toThrow(
            VSRepoError,
        );
    });

    it("'transaction' é lançado quando 'fn' não é uma função", async () => {
        await expect(userRepository.transaction("not-a-function" as any)).rejects.toThrow(
            VSRepoError,
        );
    });

    it("'softRemove' é lançado quando 'softRemoveKey' não foi configurado no repository", async () => {
        await expect(userRepository.softRemove("user-1")).rejects.toThrow(VSRepoError);
    });

    it("'restore' é lançado quando 'softRemoveKey' não foi configurado no repository", async () => {
        await expect(userRepository.restore("user-1")).rejects.toThrow(VSRepoError);
    });

    it("tem type 'BASE'", async () => {
        try {
            await userRepository.removeList("not-an-array" as any);
            throw new Error("deveria ter lançado VSRepoError");
        } catch (err) {
            expect(err instanceof VSRepoError).toBe(true);
            expect((err as VSRepoError).type).toBe(VSRepoErrorType.BASE);
        }
    });
});

// =============================================================================
// Propagação de erros do adapter — o VSRepository não deve engolir erros
// lançados pelo adapter (ex.: erro do driver/ORM subjacente).
// =============================================================================

describe("VSRepository — propagação de erros do adapter", () => {
    class UserRepository extends VSRepository<User, string> {
        constructor(adapter: VSRepoAdapter<User>) {
            super({ adapter, pkName: "id" });
        }
    }

    it("propaga o erro lançado pelo adapter em 'get' sem envolvê-lo em outro tipo", async () => {
        const fakeAdapter = createFakeAdapter<User>();
        const boom = new Error("connection refused");
        fakeAdapter.findOne.mockRejectedValueOnce(boom);

        const userRepository = new UserRepository(fakeAdapter);

        await expect(userRepository.get("user-1")).rejects.toBe(boom);
    });
});
