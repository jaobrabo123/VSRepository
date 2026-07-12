// * In this file we'll test the "dynamic methods", which are the methods we declared in "methods" in
// * repositories.ts and have their behavior automatically inferred from their own name

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * This will be the function we use to test the dynamic methods
async function dynamicMethodsTest() {
    // * First, let's populate the database with a few users and products so we have data to play with
    const user1 = await userRepository.save({
        name: "Ana Beatriz",
        email: "ana@email.com",
        password: "password123",
        likesVSRepo: true,
        userType: UserType.ADMIN,
    });
    const user2 = await userRepository.save({
        name: "Carlos Eduardo",
        email: "carlos@email.com",
        password: "password123",
        likesVSRepo: false,
        userType: UserType.COMMON,
    });
    const user3 = await userRepository.save({
        name: "Ana Clara",
        email: "anaclara@email.com",
        password: "password123",
        likesVSRepo: true,
        userType: UserType.COMMON,
    });

    console.log("\nUsers created for the test:", [user1.name, user2.name, user3.name]);

    // * -------------------------------------------------------------
    // * 1) PREFIXES: each prefix decides which operation will be performed
    // * -------------------------------------------------------------

    // * "findByUserType" uses the "findBy" prefix, which by default returns a LIST (findMany)
    const admins = await userRepository.findByUserType(UserType.ADMIN);
    console.log("\nAll admins (findByUserType):", admins);

    // * "findUniqueByEmail" uses the "findUniqueBy" prefix, which calls Prisma's "findUnique" and requires the
    // * searched field to be unique in the database (in this case, "email" is "@unique" in schema.prisma)
    const userByEmail = await userRepository.findUniqueByEmail("ana@email.com");
    console.log("\nUnique user by email (findUniqueByEmail):", userByEmail);

    // * "findUniqueOrThrowById" works like "findUniqueByEmail", but throws an error if not found
    const userOrThrow = await userRepository.findUniqueOrThrowById(user1.id);
    console.log("\nUser fetched with findUniqueOrThrowById:", userOrThrow);

    // * "findFirstByNameStartsWith" uses the "findFirstBy" prefix, which accepts field filters and calls "findFirst"
    const firstAna = await userRepository.findFirstByNameStartsWith("Ana");
    console.log("\nFirst user whose name starts with 'Ana' (findFirstByNameStartsWith):", firstAna);

    // * "countByUserType" uses the "countBy" prefix, which returns the count (number) instead of the records
    const totalAdmins = await userRepository.countByUserType(UserType.ADMIN);
    console.log("\nTotal admins (countByUserType):", totalAdmins);

    // * "existsByEmail" uses the "existsBy" prefix, which returns a boolean
    const emailExists = await userRepository.existsByEmail("carlos@email.com");
    console.log("\nDoes the email 'carlos@email.com' exist? (existsByEmail):", emailExists);

    // * ------------------------------------------------------------------------
    // * 2) FIELD FILTERS: suffixes applied to the field name inside the method
    // * ------------------------------------------------------------------------

    // * "findByUserTypeOrEmailEndsWith" combines the "Or" logical operator with the "EndsWith" filter
    const adminsOrEmailCom = await userRepository.findByUserTypeOrEmailEndsWith(UserType.ADMIN, "@email.com");
    console.log("\nAdmins OR emails ending in '@email.com' (findByUserTypeOrEmailEndsWith):", adminsOrEmailCom);

    // * "findByNameContainsInsensitiveOrderedAndPaginated" combines "Contains" + "Insensitive" (ignores upper/
    // * lower case) and still accepts manual ordering and pagination as extra parameters
    const paginatedAnas = await userRepository.findByNameContainsInsensitiveOrderedAndPaginated(
        "ana", // * filter: name contains "ana", ignoring case
        { name: "asc" }, // * manual ordering
        { skip: 0, take: 5 }, // * manual pagination
    );
    console.log("\nUsers with 'ana' in their name (case-insensitive), ordered and paginated:", paginatedAnas);

    // * "findManyByNameOptional" has the "Optional" suffix on the field, meaning we can pass "undefined" to
    // * not filter by name and bring back all records (still respecting requiredWhere, if any)
    const allWithoutFilter = await userRepository.findManyByNameOptional(undefined);
    console.log("\nAll users, without applying a name filter (findManyByNameOptional):", allWithoutFilter.length);

    // * On the "productRepository" side we also have numeric filters, like "findByPriceLessThan" and "findByPriceBetween"
    const product1 = await productRepository.save({ name: "VSRepo Pen", price: 9.9, userId: user1.id });
    const product2 = await productRepository.save({ name: "VSRepo Notebook", price: 24.9, userId: user1.id });
    const product3 = await productRepository.save({ name: "VSRepo Backpack", price: 149.9, userId: user1.id });

    const cheapProducts = await productRepository.findByPriceLessThan(25);
    console.log("\nProducts priced under 25 (findByPriceLessThan):", cheapProducts);

    // * "Between" receives a tuple [min, max]
    const midRangeProducts = await productRepository.findByPriceBetween([10, 30]);
    console.log("\nProducts priced between 10 and 30 (findByPriceBetween):", midRangeProducts);

    // * ---------------------------------------------------------------------
    // * 3) LOGICAL OPERATORS: "And" between fields and "Or" between fields
    // * ---------------------------------------------------------------------

    // * "findOneByEmailAndUserType" requires BOTH fields to match
    const exactMatch = await userRepository.findOneByEmailAndUserType("ana@email.com", UserType.ADMIN);
    console.log("\nUser with a specific email AND userType (findOneByEmailAndUserType):", exactMatch);

    // * ---------------------------------------------------------------------
    // * 4) METHODS WITH A CUSTOM NAME (proxyTo)
    // * ---------------------------------------------------------------------

    // * "findLameUsers" is a name completely outside the library's pattern, so in repositories.ts it was
    // * configured with "proxyTo: 'findByLikesVSRepoIsFalse'", delegating its behavior to that valid pattern
    const lameUsers = await userRepository.findLameUsers();
    console.log("\nUsers who don't like VSRepository (findLameUsers -> proxyTo):", lameUsers);

    // * ---------------------------------------------------------------------
    // * 5) PAGINATION AND ORDERING SUFFIXES
    // * ---------------------------------------------------------------------

    // * "findByLikesVSRepoIsTruePaginated" combines the "IsTrue" modifier (which does NOT take an argument, since the
    // * "true" value is already fixed in the method name) with the "Paginated" suffix, which injects the pagination
    // * argument as the function's only parameter
    const usersWhoLikeIt = await userRepository.findByLikesVSRepoIsTruePaginated({ skip: 0, take: 10 });
    console.log("\nUsers who like VSRepository, paginated (findByLikesVSRepoIsTruePaginated):", usersWhoLikeIt);

    // * ---------------------------------------------------------------------
    // * 6) DISTINCT SUFFIX
    // * ---------------------------------------------------------------------

    // * "findManyDistinctUserTypeAndLikesVSRepo" doesn't take any field filter, just the "Distinct" suffix with 2
    // * fields separated by "And". Since user1=(ADMIN,true), user2=(COMMON,false), and user3=(COMMON,true) form 3
    // * different combinations, the return here will have 1 record for each of them
    const uniqueCombinations = await userRepository.findManyDistinctUserTypeAndLikesVSRepo();
    console.log(
        "\nOne combination of (userType, likesVSRepo) per record (findManyDistinctUserTypeAndLikesVSRepo):",
        uniqueCombinations,
    );

    // * "findManyDistinctUserTypePaginated" combines "Distinct" with the "Paginated" suffix — here the distinct is only on
    // * "userType", so even though there are 2 "COMMON" users (user2 and user3), the return brings back only 1 record of each
    // * userType (ADMIN and COMMON)
    const uniqueTypes = await userRepository.findManyDistinctUserTypePaginated({ skip: 0, take: 10 });
    console.log("\nOne record per userType (findManyDistinctUserTypePaginated):", uniqueTypes);

    // * "findManyByLikesVSRepoDistinctUserType" combines a regular field filter ("likesVSRepo") with "Distinct"
    // * on another field ("userType"). Filtering only those with likesVSRepo=true (user1, ADMIN, and user3, COMMON) and
    // * applying distinct on "userType", the result brings back 2 records: one ADMIN and one COMMON, both with
    // * likesVSRepo=true
    const byTypeAmongFans = await userRepository.findManyByLikesVSRepoDistinctUserType(true);
    console.log(
        "\nOne record per userType, only among those who like VSRepository (findManyByLikesVSRepoDistinctUserType):",
        byTypeAmongFans,
    );

    // * ---------------------------------------------------------------------
    // * 7) NATIVE PRISMA OPERATIONS EXPOSED AS DYNAMIC METHODS
    // * ---------------------------------------------------------------------

    // * "updateById" uses the "updateBy" prefix (Prisma's "update" operation) filtering by "id"
    const updatedUser2 = await userRepository.updateById(user2.id, { name: "Carlos Eduardo Silva" });
    console.log("\nUser updated via updateById:", updatedUser2);

    // * "upsertByEmail" creates or updates based on the email, receiving the "update" and "create" objects
    const upsertedUser = await userRepository.upsertByEmail(
        "new@email.com",
        { name: "Updated User" }, // * update: used if a user already exists with that email
        {
            name: "New User",
            email: "new@email.com",
            password: "password123",
            likesVSRepo: true,
            userType: UserType.COMMON,
        }, // * create: used if it doesn't exist
    );
    console.log("\nupsertByEmail result:", upsertedUser);

    // * Finally, let's clean up everything we created in this test
    // ! Here we use "removeList" for the products, since unlike userRepository, productRepository doesn't have the
    // ! "deleteManyByIdIn" dynamic method configured in repositories.ts (each repository only exposes the methods
    // ! you decide to map in "methods")
    await productRepository.removeList([product1.id, product2.id, product3.id]);
    await userRepository.deleteManyByIdIn([user1.id, user2.id, user3.id, upsertedUser.id]);

    process.exit(0);
}

// * Now, to test the dynamic methods, we call the function to run all the operations
// TODO Run pnpm tsx .\examples\tests\dynamic-methods.test.ts or npx tsx .\examples\tests\dynamic-methods.test.ts to execute the code
void dynamicMethodsTest();
