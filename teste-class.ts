import prisma from "./examples/prisma";
import { UserGetPayload } from "./generated/prisma/models";
import { DynamicRepository } from "./generated/vsrepo";

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
            pkName: "id",
            tableName: "user",
            relations: {
                address: {
                    mode: "oto",
                    pk: "id",
                    restriction: "set",
                },

                products: {
                    mode: "otm",
                    pk: "id",
                    restriction: "add",
                },
            },
            build: {
                showWorking: true,
            },
        });
    }
}

const userRepository = new UserRepository();

userRepository.get(crypto.randomUUID(), {}).then(console.log);
