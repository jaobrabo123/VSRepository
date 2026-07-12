/*
 * In this file we're going to configure all the repositories we'll use
 ! NOTE: ideally, in a real project you would create one file per repository
*/

// * Importing what we'll need
import { Address } from "../generated/prisma/client";
import { UserType } from "../generated/prisma/enums";
import { ProductGetPayload, UserGetPayload } from "../generated/prisma/models";
import { setupVSRepo } from "../generated/vsrepo";
import prisma from "./prisma";

// * Here we use "GetPayload" so VSRepository recognizes the typing of the relations
// TODO Hover your mouse over "User" to see its typing
type User = UserGetPayload<{
    // * We use "include" to include the relations in the typing
    include: {
        address: true;
        products: true;
    };
}>;

// * Configuring the User repository
// ? Why do we call one function right after the other: ()({...})? Because VSRepository needs 2 generics, this
// ? is the way for TypeScript to properly handle these generics
// * The first generic is our entity's model
const userVSRepo = setupVSRepo<User, "User">()({
    // * Here we define the table name, it's the "model" name defined in schema.prisma with a lowercase first letter
    // ! NOTE: This isn't necessarily the exact table name in the database
    tableName: "user",

    // * "pkName" is the name of our entity's primary key, it's important for the base methods and for the dynamic methods
    // * with the "exists" prefix (in "exists" it's used in the select so Prisma fetches as little as possible, since we only want to know whether it exists or not)
    pkName: "id",

    // * Here we're defining "requiredWhere", it contains the filter that will be injected by default in every operation (except aggregate and groupBy)
    requiredWhere: {
        // * By default we'll only fetch active users
        active: true,
    },

    // * Now let's define the "selectModels", they're Prisma select models we can use in our operations
    selectModels: {
        // * Defining the "public" model
        public: {
            id: true,
            name: true,
            email: true,
            userType: true,
            likesVSRepo: true,
            createdAt: true,
            updatedAt: true,
            address: true,
            products: {
                include: { tags: true },
            },
        },
        // * Defining the "internal" model
        internal: {
            id: true,
            name: true,
            email: true,
            userType: true,
            likesVSRepo: true,
            createdAt: true,
            updatedAt: true,
            active: true,
            password: true, // * Notice that the password is only available in this model
        },
        // * Defining the "minimal" model
        minimal: {
            id: true,
        },
    },

    // * Now we define that by default the "selectModel" used will be "public" in the base and dynamic methods
    defaultSelectModel: "public",

    // * Configuring the relations
    // ! An important detail: You're not required to configure relations, only if you want VSRepository to manage them in save/patch in an
    // ! organized way. However, if you prefer, you can manage the relations manually — it would just be more verbose
    relations: {
        // * Relation with address
        address: {
            // * We define it as a "one-to-one" (oto) relation
            mode: "oto",
            // * Address primary key (important so "save" and "patch" can properly manage this relation)
            pk: "id",
            // * We mark the restriction as "set" so that whenever we pass it in "save" or "patch" it gets overwritten
            restriction: "set",
        },

        // * Relation with products
        products: {
            // * Here it's a one-to-many (otm) relation
            mode: "otm",
            pk: "id",
            // * We set the restriction to "add", since we don't want to delete products that weren't passed in save/patch, only add
            // * new ones or update the existing ones
            restriction: "add",
        },
    },

    // * Now let's define the dynamic methods, whose behavior will be inferred from their *name*
    methods: {
        // * This method will search for users with the "userType" passed as a function parameter
        // * Notice that in the entity this column starts with a lowercase "u", but here we need to pass the capitalized name (with an uppercase first letter)
        findByUserType: { map: true },

        // * Here we create a method that finds a specific user by "email" and by "userType"
        findOneByEmailAndUserType: { map: true },

        // * This method finds users who have the passed "userType" OR whose "email" ends with the passed text
        findByUserTypeOrEmailEndsWith: { map: true },

        // * Fetching all users who like VSRepository (these guys are cool) receiving a pagination parameter
        findByLikesVSRepoIsTruePaginated: { map: true },

        // * The "Distinct" suffix returns only unique records based on the fields provided (equivalent to Prisma's "distinct")
        // * Here we don't pass any field filter, just distinct on 2 columns: it'll return 1 user for each unique
        // * combination of "userType" and "likesVSRepo" that exists in the database
        findManyDistinctUserTypeAndLikesVSRepo: { map: true },

        // * "Distinct" can also be combined with the "Paginated" suffix (and with "Ordered"/"OrderedAndPaginated"/"PaginatedAndOrdered")
        findManyDistinctUserTypePaginated: { map: true },

        // * And it can also be combined with a regular field filter: here we filter by "likesVSRepo" and return
        // * only one record for each distinct "userType" found among the ones left over from the filter
        findManyByLikesVSRepoDistinctUserType: { map: true },

        // * We can also create methods with custom names ("proxyTo" defines that method's behavior)
        findLameUsers: { map: true, proxyTo: "findByLikesVSRepoIsFalse" },

        // * Fetching the user's private data by email
        findInternalByEmail: {
            map: true,
            proxyTo: "findOneByEmail",
            // * Here we're saying that this specific method will ignore requiredWhere, meaning it will find
            // * the user even if they have "active" = false
            whereType: "overwrite",
            // * Here we say we want to use the "internal" selectModel (the one we defined in "selectModels")
            selectModel: "internal",
        },

        // * Method to check if a user exists with a given email
        existsByEmail: { map: true },

        // * This method fetches all Admins
        findAdmins: {
            map: true,
            proxyTo: "findBy",
            // * "pushWhere" automatically injects this filter into this specific method
            pushWhere: {
                userType: UserType.ADMIN,
            },
        },

        // * Now let's create a method that finds users from the same country
        findByAddressWithCountry: {
            map: true,
            // * Here we inject a fixed ordering for this method, results will be automatically ordered by state and by city
            injectOrdenation: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
        },

        // * We can also search for users without an address
        findByAddressWithout: { map: true },

        // * Well, in case we don't know the user's exact name, we can search for results that 'contain' the name we pass and ignore
        // * uppercase/lowercase differences. On top of that we'll accept a manual ordering and pagination parameter
        findByNameContainsInsensitiveOrderedAndPaginated: { map: true },

        // * Now let's create 2 methods, one to search for users with products and another for users without products
        findByProductsSome: { map: true },
        findByProductsNone: { map: true },

        // * VSRepository also supports every native Prisma operation, I'll declare an example for each one of them
        // * here just to show the possibilities, but I won't go into much detail
        findUniqueByEmail: { map: true },
        findUniqueOrThrowById: { map: true },
        findFirstByNameStartsWith: { map: true },
        findFirstOrThrowByIdOrEmail: { map: true },
        countByUserType: { map: true },
        // * The "Optional" suffix says the "name" parameter is optional in this method (we can pass this parameter as 'undefined')
        // * See VSRepository's documentation for more details: https://github.com/jaobrabo123/VSRepository#field-filters
        findManyByNameOptional: { map: true },
        createManyAndReturn: { map: true },
        createManySkipDuplicates: { map: true },
        create: { map: true },
        updateManyAndReturnByUserType: { map: true },
        // * In VSRepository some operations accept the "Where" suffix (instead of "By"), which lets you pass a literal Prisma "where"
        // * object as a parameter, useful for very complex filtering.
        // * Read VSRepository's documentation to find out which operations support the "Where" suffix: https://github.com/jaobrabo123/VSRepository#dynamic-methods
        updateManyWhere: { map: true },
        updateById: { map: true },
        upsertByEmail: { map: true },
        deleteManyByIdIn: { map: true, whereType: "overwrite" },
        deleteById: { map: true, selectModel: "minimal" },
        // * VSRepository supports "aggregate" and "groupBy". To use them you can declare a method with their exact name (it doesn't accept
        // * extra parameters), the return type is dynamically defined by Prisma itself
        // ! Important note: "aggregate" and "groupBy" ignore selectModels, requiredWhere, and pushWhere
        aggregate: { map: true },
        groupBy: { map: true },
    },
});

// * Now that we've configured our repository, let's create and export an instance of it using the '.build()' method
// * For that we need to pass a PrismaClient instance as the first parameter, and we can also configure a few things about this instance
export const userRepository = userVSRepo.build(prisma, {
    // * Here we could set showWorking to 'true' to see the repository working in practice, but it generates a lot of deep-debug logs, so
    // * we'll leave it disabled since that's not the focus right now. But if you want, you can enable it to see it working and the payloads
    // * it generates for Prisma
    showWorking: false, // * It's already set to 'false' by default

    // * We can also configure the behavior of some base methods
    // * To learn more about the base methods, see VSRepository's documentation: https://github.com/jaobrabo123/VSRepository#base-methods
    baseMethods: {
        removeList: {
            // * Here we're disabling "removeList" on this instance (by default all methods come enabled)
            active: false,
        },
        remove: {
            // * The "remove" method will use the "minimal" selectModel if we don't specify one when calling it
            defaultSelect: "minimal",
        },
        getOrThrow: {
            // * Here we're saying that "getOrThrow" will ignore "requiredWhere" (similar to whereType "overwrite" in dynamic methods)
            ignoreRequiredWhere: true,
        },
        save: {
            // * Configuring that when performing an upsert internally (if the passed object has the primary key) save will ignore "requiredWhere"
            ignoreRequiredWhere: true,
        },
    },
});

// * Now that we've created the instance, we can check whether it actually created the methods
// TODO Hover your mouse over "UserRepositoryKeys" to see our repository's methods
export type UserRepositoryKeys = keyof typeof userRepository;

// * Now that we understand how to create and configure a repository, let's quickly create the repositories for the other entities

// * Configuring the Address repository
// * Notice that here we don't use GetPayload, since we won't manage or filter relations in this repository
const addressVSRepo = setupVSRepo<Address, "Address">()({
    tableName: "address",
    pkName: "id",

    // * Also notice that in this repository we don't define any selectModel, which means the operations will return Prisma's
    // * default payload. This isn't a good practice, it's just showing that it's a possibility for quick/simple projects

    methods: {
        findFirstByCityStartsWith: { map: true },

        findByCountry: { map: true },

        findByUserId: { map: true },
    },
});

export const addressRepository = addressVSRepo
    .build(prisma, {
        baseMethods: { removeList: { ignoreRequiredWhere: true } },
    })
    // * We can extend a repository using the "extend" function when creating an instance.
    // * More details in the documentation: https://github.com/jaobrabo123/VSRepository#extending-a-repository
    .extend(repo => ({
        findAddressesFromBrazil: async () => {
            return repo.findByCountry("Brazil");
        },
    }));

// * Configuring the Product repository
type Product = ProductGetPayload<{
    include: {
        tags: true;
        user: true;
    };
}>;

const productVSRepo = setupVSRepo<Product, "Product">()({
    tableName: "product",
    pkName: "id",

    // * "softRemovekName" is the new setting that enables soft-delete on this repository.
    // * By providing the name of a DateTime field on the model, VSRepository automatically offers
    // * the following methods: softRemove, softRemoveList, restore, and restoreList.
    // * The field must be of type DateTime (nullable) in schema.prisma — VSRepository validates this at build time.
    softRemovekName: "deletedAt",

    selectModels: {
        public: {
            id: true,
            description: true,
            name: true,
            price: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            tags: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    userType: true,
                    likesVSRepo: true,
                },
            },
        },
        publicWithoutUser: {
            id: true,
            description: true,
            name: true,
            price: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            tags: true,
            userId: true,
        },
    },
    defaultSelectModel: "public",

    // * We only want to fetch products belonging to active users
    requiredWhere: { user: { is: { active: true } } },

    relations: {
        user: {
            mode: "mto",
            pk: "id",
            restriction: "add",
            // * "nullable" only exists on "mto" (many-to-one) relations, it's used to say whether the foreign key (in this case userId) can be null.
            // * Since userId is not null (we defined this in schema.prisma) we set "nullable" to false (default = false).
            // * This is used by VSRepository to decide what to do if you pass the relation as null in save/patch: if true it will
            // * perform a disconnect (set the fk to null), and if false it throws an error
            nullable: false,
        },
        tags: {
            mode: "mtm",
            // ! WARNING: Notice that here we set "name" as the pk even though tag's primary key is "id" — how come?? Won't that cause an error?? It won't cause an error in this case,
            // ! because we marked "name" as unique in schema.prisma, so VSRepository is able to tell apart the tags that already exist from the ones that don't yet.
            // ? Ok, that makes sense, but why do it this way here? Because in this specific system's business rules, we want a provided tag that already exists to
            // ? be connected to our product, and if there's no tag with that name, it should be created and connected to the product. But if tags were fixed (if it doesn't exist,
            // ? don't auto-create it), the ideal would be to set the pk as "id". Be very careful with these kinds of "workarounds" though — always test before shipping to production.
            pk: "name",
            restriction: "set",
        },
    },

    methods: {
        findByNameStartsWithInsensitive: { map: true },

        findByPriceLessThan: { map: true },

        findByPriceBetween: { map: true },

        // * This method searches for products without a description
        findByDescriptionIsNull: { map: true },

        findByTagsSomeName: { map: true },

        findByUserWithEmail: { map: true },

        findByUserId: { map: true },

        findByIdIn: { map: true },
    },
});

export const productRepository = productVSRepo.build(prisma, {
    baseMethods: { removeList: { ignoreRequiredWhere: true } },
});

// * Ok, now that we've configured our repositories, let's move on to the "tests" folder to test them in practice
