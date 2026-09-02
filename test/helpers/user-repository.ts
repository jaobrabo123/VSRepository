// `VSRepository` concreta usada nos testes de implementação. Reúne alguns
// métodos dinâmicos (`@DynamicMethod`) e um método de query crua
// (`@QueryMethod`) representativos, no mesmo espírito do `userVSRepo`
// usado em `functional-api.test.ts`/`class-based-api.test.ts` na v1.

import { VSRepository } from "../../src/VSRepository";
import { VSRepoAdapter } from "../../src/VSRepoAdapter";
import { DynamicMethod } from "../../src/decorators/dynamic-method.decorator";
import { QueryMethod } from "../../src/decorators/query-method.decorator";
import { QueryMethodArg } from "../../src/types/utils/query-method-arg.type";
import { VSLogLevel } from "../../src/internal/enums/vs-log-level.enum";
import { User } from "./entities";

export class UserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({ adapter, pkName: "id", logLevel: VSLogLevel.ERROR });
    }

    @DynamicMethod()
    declare findByEmail: (email: string) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmail: (email: string) => Promise<User | null>;

    @DynamicMethod()
    declare findByUserType: (userType: string) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByIdAndEmail: (id: string, email: string) => Promise<User | null>;

    @DynamicMethod()
    declare existsByEmail: (email: string) => Promise<boolean>;

    @DynamicMethod<User>({ injectOrdering: { createdAt: "desc" } })
    declare findByActiveIsTrue: () => Promise<User[]>;

    @QueryMethod('SELECT * FROM "user" WHERE email = $1')
    declare findByEmailRaw: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;
}

export class SoftDeletableUserRepository extends VSRepository<User, string> {
    constructor(adapter: VSRepoAdapter<User>) {
        super({
            adapter,
            pkName: "id",
            softRemoveKey: "deletedAt",
            logLevel: VSLogLevel.ERROR,
        });
    }
}
