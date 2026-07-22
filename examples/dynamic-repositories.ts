/*
 * This file configures the SAME domain used in "repositories.ts" (User, Product), but using the
 * OOP class-based approach: "DynamicRepository" + the "@DynamicMethod" decorator, instead of the
 * functional "setupVSRepo" approach.
 !
 ! NOTE: for the "why" behind each concept (relations, requiredWhere, softRemovekName, etc.), see the
 ! comments in "repositories.ts" first — here we focus on what's *different* about the class-based API.
 !
 ! IMPORTANT: this class-based approach requires "experimentalDecorators": true in your tsconfig.json
 ! (already configured in this project's tsconfig.json). See README-DynamicRepo.md#requirements.
*/

// * Importing what we'll need
import { UserType } from "../generated/prisma/enums";
import { ProductGetPayload, UserGetPayload } from "../generated/prisma/models";
import {
    DynamicRepository,
    DynamicMethod,
    DynamicMethodOptions,
    OrdenationModel,
    PaginationModel,
} from "../generated/vsrepo";
import prisma from "./prisma";

// * Just like in the functional approach, we use "GetPayload" so VSRepository recognizes the typing
// * of the relations we want available on the entity
// TODO Hover your mouse over "User" to see its typing
type User = UserGetPayload<{
    include: {
        address: true;
        products: true;
    };
}>;

// * Configuring the User repository as a class
// ? Why extend "DynamicRepository" with 4 generics instead of calling "setupVSRepo<User, "User">()"? Because the class-based
// ? approach needs one extra generic ("WRelations") to know which fields of "User" are relations, so "save"/"patch" can
// ? correctly type the nested create/update payloads for "address" and "products"
class UserRepository extends DynamicRepository<
    // * 1st generic: our entity's model (same as the functional approach)
    User,
    // * 2nd generic: the Prisma model name, capitalized
    "User",
    // * 3rd generic: the type of the primary key
    string,
    // * 4th generic: a flag object telling VSRepository which fields of "User" are relations
    { address: true; products: true }
> {
    constructor() {
        // * Unlike "setupVSRepo(...)()" + ".build(prisma, ...)", here everything happens in one call to "super(...)":
        // * the first argument is the PrismaClient, the second is the same kind of config object used in the functional
        // * approach's "setupVSRepo" (minus "selectModels"/"defaultSelectModel"/"includeModels", which don't exist here)
        super(prisma, {
            tableName: "user",
            pkName: "id",

            // * "requiredWhere" works exactly the same as in the functional approach: it's injected by default in every operation
            requiredWhere: {
                active: true,
            },

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

            // * "build" replaces the functional approach's ".build(prisma, config)" second argument — same idea, but
            // * without "freeze" (always frozen) and without "active"/"defaultSelect" per base method (there's no
            // * select model to default to, and base methods can't be individually disabled)
            build: {
                showWorking: false,
                baseMethods: {
                    getOrThrow: {
                        // * Same meaning as in the functional approach: "getOrThrow" will ignore "requiredWhere"
                        ignoreRequiredWhere: true,
                    },
                    save: {
                        // * "save" ignores "requiredWhere" during its internal upsert check
                        ignoreRequiredWhere: true,
                    },
                    remove: {
                        ignoreRequiredWhere: true,
                    }
                },
            },
        });
    }

    // * Dynamic methods are declared as class fields with "declare" + "@DynamicMethod()".
    // ! Always use "declare", never a regular class property — "declare" tells TypeScript the field exists
    // ! without emitting initialization code, since the decorator wires up the actual implementation at runtime

    // * Simple dynamic method: finds users by their "userType"
    @DynamicMethod()
    declare findByUserType: (
        userType: UserType,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    // * Finds one user matching both "email" and "userType"
    @DynamicMethod()
    declare findOneByEmailAndUserType: (
        email: string,
        userType: UserType,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;

    // * Finds users who have the passed "userType" OR whose "email" ends with the passed text
    @DynamicMethod()
    declare findByUserTypeOrEmailEndsWith: (
        userType: UserType,
        emailSuffix: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    // * Fetches users who like VSRepository, receiving a pagination parameter (the "Paginated" suffix works exactly
    // * like in the functional approach)
    @DynamicMethod()
    declare findByLikesVSRepoIsTruePaginated: (
        pagination: PaginationModel<"User">,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    // * We can create methods with custom names via "proxyTo", same as the functional approach
    @DynamicMethod<"User">({ proxyTo: "findByLikesVSRepoIsFalse" })
    declare findLameUsers: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    // * "whereType: overwrite" makes this specific method ignore "requiredWhere" — useful for internal/admin
    // * lookups that need to find a user even if "active" is false
    // ! Since "DynamicRepository" doesn't support "selectModels", there's no "selectModel: internal" option here like
    // ! in the functional example — use "options.include" if you need to shape the returned data instead
    @DynamicMethod<"User">({ proxyTo: "findOneByEmail", whereType: "overwrite" })
    declare findInternalByEmail: (
        email: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;

    // * Checks whether a user exists with a given email
    @DynamicMethod()
    declare existsByEmail: (
        email: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<boolean>;

    // * "pushWhere" injects a fixed extra filter on top of "requiredWhere" — here we reuse the "findBy" pattern
    // * (no field filter) plus a fixed filter for admins
    @DynamicMethod<"User">({ proxyTo: "findBy", pushWhere: { userType: UserType.ADMIN } })
    declare findAdmins: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    // * "injectOrdenation" injects a fixed ordering automatically, without needing an "Ordered" suffix or an
    // * extra "order" parameter — here every call is automatically ordered by the address's state and city
    @DynamicMethod<"User">({
        injectOrdenation: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
    })
    declare findByAddressWithCountry: (
        country: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    // * Combines a text filter ("Contains" + "Insensitive"), a manual ordering parameter ("Ordered") and pagination
    // * ("Paginated") in a single method
    @DynamicMethod()
    declare findByNameContainsInsensitiveOrderedAndPaginated: (
        name: string,
        order: OrdenationModel<"User">,
        pagination: PaginationModel<"User">,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;
}

// * Unlike the functional approach (where you export the result of ".build(prisma, config)"), here we simply
// * export an instance of the class — the repository is built automatically inside the constructor
export const userRepository = new UserRepository();

// TODO Hover your mouse over "UserRepositoryKeys" to see our repository's methods (base + dynamic)
export type UserRepositoryKeys = keyof typeof userRepository;

// * Now let's configure the Product repository, this time showcasing "softRemovekName" and the "mto"/"mtm"
// * relation modes in the class-based approach
type Product = ProductGetPayload<{
    include: {
        tags: true;
        user: true;
    };
}>;

class ProductRepository extends DynamicRepository<
    Product,
    "Product",
    string,
    { user: true; tags: true }
> {
    constructor() {
        super(prisma, {
            tableName: "product",
            pkName: "id",

            // * Just like in the functional approach, providing a DateTime field here automatically enables
            // * "softRemove", "softRemoveList", "restore", and "restoreList" on this repository
            softRemovekName: "deletedAt",

            // * We only want to work with products belonging to active users
            requiredWhere: { user: { is: { active: true } } },

            relations: {
                user: {
                    mode: "mto",
                    pk: "id",
                    restriction: "add",
                    // * "nullable: false" because "userId" is required in schema.prisma
                    nullable: false,
                },
                tags: {
                    mode: "mtm",
                    // ! "name" is used as the pk here (not "id") because it's marked "@unique" in schema.prisma — this lets
                    // ! "save"/"patch" connect an existing tag by name, or create a new one if it doesn't exist yet
                    pk: "name",
                    restriction: "set",
                },
            },

            build: {
                baseMethods: {
                    removeList: { ignoreRequiredWhere: true },
                },
            },
        });
    }

    @DynamicMethod()
    declare findByNameStartsWithInsensitive: (
        name: string,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByPriceLessThan: (
        price: number,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByPriceBetween: (
        range: [number, number],
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByTagsSomeName: (
        tagName: string,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByUserWithEmail: (
        email: string,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByIdIn: (
        ids: string[],
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;
}

export const productRepository = new ProductRepository();

// * Now that we've configured both repositories with the class-based approach, let's move on to
// * "tests/dynamic-repository.test.ts" to see them in practice
