// * In this file we'll test VSRepository's "soft-delete". By configuring "softRemovekName" in
// * setupVSRepo, the repository automatically gains 4 new base methods: softRemove, softRemoveList,
// * restore, and restoreList. On top of that, the "see" field in MethodOptions (and in the "total" and "has"
// * methods) lets you control whether the query sees active, removed, or all records.

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * This will be the function we use to test soft-delete
async function softDeleteTest() {
    // * First, let's create a user and a few products to serve as test data
    const user = await userRepository.save({
        name: "Larissa Mendes",
        email: "larissa@email.com",
        password: "password123",
        likesVSRepo: true,
        userType: UserType.COMMON,
    });

    const product1 = await productRepository.save({
        name: "VSRepo T-Shirt",
        price: 59.9,
        userId: user.id,
    });
    const product2 = await productRepository.save({
        name: "VSRepo Mug",
        price: 29.9,
        userId: user.id,
    });
    const product3 = await productRepository.save({
        name: "VSRepo Sticker",
        price: 4.9,
        userId: user.id,
    });

    console.log("\nProducts created:", [product1.name, product2.name, product3.name]);

    // * -----------------------------------------------------------------------
    // * 1) softRemove — soft-delete of a single record
    // * -----------------------------------------------------------------------

    // * "softRemove" marks the record as removed by filling the "deletedAt" field with the current timestamp.
    // ! Important: the record is NOT deleted from the database — it stays there, but VSRepository treats it as
    // ! "removed" by default in all operations
    const removedProduct1 = await productRepository.softRemove(product1.id);

    console.log("\nProduct 1 after softRemove (deletedAt filled in):", removedProduct1.deletedAt);

    // * -----------------------------------------------------------------------
    // * 2) SeeMode — controlling which records the query sees
    // * -----------------------------------------------------------------------

    // * By default, all repository operations only see "active" records (without deletedAt).
    // * To change this behavior on a case-by-case basis, we pass "see" in the call's options.
    // *
    // * SeeMode's possible values are:
    // *   "active"  → only non-removed records (default)
    // *   "removed" → only removed records (deletedAt not null)
    // *   "all"     → all records, regardless of status

    // * Trying to fetch the removed product with the default behavior ("active")
    const notFound = await productRepository.get(product1.id);
    console.log("\nFetching the removed product without see (default 'active') → expected null:", notFound);

    // * Now fetching the same removed product with see: "removed"
    const foundRemoved = await productRepository.get(product1.id, { see: "removed" });
    console.log(
        "\nFetching the removed product with see: 'removed' → expected: found:",
        foundRemoved?.name,
    );

    // * And with see: "all" we see both active and removed
    const allProducts = await productRepository.getAll({ see: "all" });
    console.log(
        "\ngetAll with see: 'all' (active + removed):",
        allProducts.map(p => ({ name: p.name, deletedAt: p.deletedAt })),
    );

    // * -----------------------------------------------------------------------
    // * 3) softRemoveList — batch soft-delete
    // * -----------------------------------------------------------------------

    // * "softRemoveList" works just like softRemove but for multiple records at once,
    // * returning a { count } object with the number of affected records.
    const { count: softRemovedCount } = await productRepository.softRemoveList([
        product2.id,
        product3.id,
    ]);
    console.log(
        "\nProducts 2 and 3 after softRemoveList (soft-removed count):",
        softRemovedCount,
    );

    // * Confirm that the total of "active" products is now 0 (all of them were soft-removed)
    const totalActive = await productRepository.total();
    console.log("\nTotal active products after soft-removing everything (expected: 0):", totalActive);

    // * And the total of removed products is 3
    const totalRemoved = await productRepository.total({ see: "removed" });
    console.log("\nTotal removed products (expected: 3):", totalRemoved);

    // * "has" also respects SeeMode: with see: "removed" it sees soft-deleted records
    const product1ExistsAsRemoved = await productRepository.has(product1.id, { see: "removed" });
    console.log("\nDoes product 1 exist as removed? (expected: true):", product1ExistsAsRemoved);

    const product1ExistsAsActive = await productRepository.has(product1.id);
    console.log("\nDoes product 1 exist as active? (expected: false):", product1ExistsAsActive);

    // * -----------------------------------------------------------------------
    // * 4) restore — restoring a soft-deleted record
    // * -----------------------------------------------------------------------

    // * "restore" undoes the soft-delete on a single record: it clears the "deletedAt" field (sets it to null)
    // * and the record becomes visible again in standard ("active") operations
    const restoredProduct1 = await productRepository.restore(product1.id);

    console.log("\nProduct 1 after restore (deletedAt should be null):", restoredProduct1.deletedAt);

    // * Now product 1 can be found normally again
    const foundAgain = await productRepository.get(product1.id);
    console.log("\nFetching product 1 after restore (expected: found):", foundAgain?.name);

    // * -----------------------------------------------------------------------
    // * 5) restoreList — restoring multiple records
    // * -----------------------------------------------------------------------

    // * "restoreList" works just like restore but for a list of PKs, returning an object
    // * { count } with the number of restored records
    const { count: restoredCount } = await productRepository.restoreList([
        product2.id,
        product3.id,
    ]);
    console.log("\nProducts 2 and 3 after restoreList (restored count):", restoredCount);

    // * Confirm that all active products came back
    const totalActiveAtTheEnd = await productRepository.total();
    console.log(
        "\nTotal active products after restoring everything (expected: 3):",
        totalActiveAtTheEnd,
    );

    // * -----------------------------------------------------------------------
    // * 6) Final cleanup
    // * -----------------------------------------------------------------------

    // ! Since "Product" has "onDelete: Cascade" linked to the user, removing the user already permanently
    // ! removes the products — so it's enough to delete the user
    await userRepository.deleteManyByIdIn([user.id]);

    process.exit(0);
}

// * Now, to test soft-delete, we call the function to run all the operations
// TODO Run pnpm tsx examples/tests/soft-delete.test.ts or npx tsx examples/tests/soft-delete.test.ts to execute the code
void softDeleteTest();
