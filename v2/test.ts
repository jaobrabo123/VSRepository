import { Prisma, PrismaClient } from "../generated/prisma/client";
import { VSRepository } from "./VSRepository";
import prisma from "../examples/prisma";
import { UserGetPayload } from "../generated/prisma/models";
import { VSRepoPrisma7Adapter } from "./adapters/prisma7/prisma7.adapter";
import { DynamicMethod } from "./decorators/dynamic-method.decorator";

import "reflect-metadata";
import { VSLogLevel } from "./internal/enums/vs-log-level.enum";

type AnyAsyncFn = (...args: any[]) => Promise<any>;

type Prisma7ClientLike = {
    $executeRaw: any;
    $executeRawUnsafe: any;
    $queryRaw: any;
    $queryRawUnsafe: any;
};

type Prisma7OrmTypes<
    DB extends Prisma7ClientLike,
    TX extends Prisma7ClientLike & { $on?: never },
> = {
    dbClient: DB;
    dbTransaction: TX;
};

type User = UserGetPayload<{ include: { address: true; products: { include: { tags: true } } } }>;

class UserRepository extends VSRepository<
    User,
    string,
    Prisma7OrmTypes<PrismaClient, Prisma.TransactionClient>
> {
    constructor() {
        const adapter = new VSRepoPrisma7Adapter<User>(prisma, "user");

        super({
            pkName: "id",
            adapter,
            logLevel: VSLogLevel.DEBUG,
            defaultOrdering: { createdAt: "DESC" },
        });
    }

    @DynamicMethod()
    declare findByNameIgnoreCaseOrAgeBetweenANDActiveIsNullOrderByCreatedAtAscAndUpdatedAtDescPaginated: AnyAsyncFn;

    @DynamicMethod()
    declare upsertById: AnyAsyncFn;

    @DynamicMethod()
    declare createManyIgnoreConflicts: AnyAsyncFn;
}

const userRepository = new UserRepository();
// console.log(userRepository);

// async function test() {
//     const user = await prisma.user.create({
//         data: {
//             email: "teste",
//             likesVSRepo: true,
//             name: "teste",
//             password: "123",
//             userType: "ADMIN",
//             products: {
//                 create: {
//                     name: "blabla",
//                     price: 2,
//                     tags: {
//                         create: [{ name: "a" }],
//                     },
//                 },
//             },
//         },
//     });

//     const findUser = await userRepository.get(user.id, {
//         relations: { address: true, products: { tags: true } },
//     });

//     console.log(findUser);

//     // const result = await userRepository.getAll({})

//     await prisma.user.delete({ where: { id: user.id } });
// }

// test();
