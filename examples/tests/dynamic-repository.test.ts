// * This test demonstrates the class-based "DynamicRepository" approach in practice, using the same
// * User/Product domain as the other tests, but built with "dynamic-repositories.ts" instead of "repositories.ts"
// * See README-DynamicRepo.md for the full documentation of this approach.

import { UserType } from "../../generated/prisma/enums";
import { productRepository, userRepository } from "../dynamic-repositories";

async function dynamicRepositoryTest() {
    // * Let's start by creating a couple of users — "save" works exactly like in the functional approach
    // TODO Hover your mouse over "user1" to see its typing: notice it already includes "address" and "products"
    // TODO in the type, since we flagged them as relations in the 4th generic parameter of "DynamicRepository"
    const user1 = await userRepository.save({
        name: "John",
        email: "john@email.com",
        likesVSRepo: true,
        password: "n0tSoSecureP4ss",
        userType: UserType.ADMIN,
    });
    const user2 = await userRepository.save({
        name: "Some lame guy",
        email: "lame@guy.com",
        likesVSRepo: false,
        password: "password123",
        userType: UserType.COMMON,
    });

    console.log("\nUser 1:", user1);
    console.log("\nUser 2:", user2);

    // * "get" works the same way as in the functional approach, but since there's no "selectModels" here, it
    // * always returns Prisma's default payload for the model (unless you shape it with "options.include")
    const fetchedUser1 = await userRepository.get(user1.id);
    console.log("\nFetched User 1:", fetchedUser1);

    // * We can eagerly load relations with "options.include" — this is the class-based equivalent of
    // * "includeModels" in the functional approach, but using raw Prisma "include" syntax
    const userWithAddress = await userRepository.get(user1.id, {
        include: { address: true },
    });
    console.log("\nUser 1 with address included:", userWithAddress);

    // * Dynamic methods behave exactly like their functional counterparts — the method name determines the
    // * Prisma operation and the filters, "@DynamicMethod()" config just fine-tunes the behavior
    const admins = await userRepository.findByUserType(UserType.ADMIN);
    console.log("\nAdmins found via 'findByUserType':", admins);

    const lameUsers = await userRepository.findLameUsers();
    console.log("\nUsers who don't like VSRepository ('findLameUsers' -> proxyTo):", lameUsers);

    // * "findInternalByEmail" was configured with "whereType: overwrite", so it ignores "requiredWhere" —
    // * meaning it can find a user even if they're not "active"
    await userRepository.patch(user2.id, { active: false });
    const internalLookup = await userRepository.findInternalByEmail("lame@guy.com");
    console.log("\nInactive user still found via 'findInternalByEmail':", internalLookup);

    // * Now let's test the Product repository, showcasing soft-delete in the class-based approach
    // ! Relation payloads use a plain object with the relation's "pk" field, not Prisma's own "connect"/"create"
    // ! syntax — VSRepository resolves "connectOrCreate"/"upsert" internally based on the "relations" config
    const product1 = await productRepository.save({
        name: "VSRepository Mug",
        description: "A mug for people who like typed repositories",
        price: 29.9,
        userId: user1.id,
    });
    console.log("\nProduct 1:", product1);

    // * "softRemove" marks the record as deleted (fills "deletedAt") instead of actually deleting it
    await productRepository.softRemove(product1.id);

    // * By default, "getAll" (and every other read method) only sees "active" (non soft-deleted) records
    const activeProducts = await productRepository.getAll();
    console.log(
        "\nActive products after soft-delete (should not include Product 1):",
        activeProducts,
    );

    // * Using "see: 'removed'" we can fetch only the soft-deleted records
    const removedProducts = await productRepository.getAll({ see: "removed" });
    console.log("\nRemoved products:", removedProducts);

    // * "restore" brings the record back
    const restoredProduct = await productRepository.restore(product1.id);
    console.log("\nRestored product:", restoredProduct);

    // * "getAll" also accepts "pagination" and "order", exactly like in the functional approach
    const firstPageOrdered = await userRepository.getAll({
        pagination: { take: 10 },
        order: { createdAt: "desc" },
    });
    console.log("\nFirst page of users, ordered by 'createdAt' desc:", firstPageOrdered);

    // * Transactions work the same way as in the functional approach: access the Prisma client via
    // * "repository.prisma" and pass "{ db: tx }" to any method to include it in the transaction
    await userRepository.prisma.$transaction(async tx => {
        await userRepository.patch(
            user1.id,
            { name: "John (updated in a transaction)" },
            { db: tx },
        );
        await productRepository.patch(product1.id, { price: 24.9 }, { db: tx });
    });
    console.log("\nUser 1 and Product 1 updated together inside a transaction");

    // * Let's clean up what we created in this test
    await productRepository.remove(product1.id);
    await userRepository.remove(user1.id);
    await userRepository.remove(user2.id);

    process.exit(0);
}

// TODO Run pnpm tsx examples/tests/dynamic-repository.test.ts or npx tsx examples/tests/dynamic-repository.test.ts to execute the code
void dynamicRepositoryTest();
