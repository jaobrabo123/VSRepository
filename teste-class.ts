import prisma from "./examples/prisma";
import { UserGetPayload } from "./generated/prisma/models";
import {
    DynamicMethod,
    DynamicMethodOptions,
    DynamicRepository,
    PaginationModel,
} from "./generated/vsrepo";

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

    @DynamicMethod<"User">({ injectOrdenation: { createdAt: "desc" } })
    declare findByNameContainsPaginated: (
        email: string,
        pagination: PaginationModel<"User">,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmail: (email: string) => Promise<User | null>;
}

const userRepository = new UserRepository();

userRepository
    .findByNameContainsPaginated("teste", { take: 10 }, { include: { address: true } })
    .then(console.log);
