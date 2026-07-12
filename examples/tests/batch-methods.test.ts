// * In this file we'll test the new base batch-operation methods and "merge":
// *
// *   getList    — fetches multiple records from a list of PKs (in a single query)
// *   saveList   — saves an array of objects in a single automatic transaction (supports relations)
// *   patchList  — partially updates multiple records via [pk, obj] tuples in an automatic transaction (supports relations)
// *   merge      — fetches a record by PK, deep merges it in MEMORY, and returns the result without persisting

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * This will be the function we use to test the batch methods
async function batchMethodsTest() {
    // * -----------------------------------------------------------------------------------------
    // * 1) saveList — creating multiple records in a single transaction, with relation support
    // * -----------------------------------------------------------------------------------------

    // * "saveList" saves an array of objects in a single automatic transaction managed by VSRepository.
    // * Each object follows the same rules as "save": if it has the PK it performs an upsert, if not it performs a create.
    // * Just like "save", "saveList" also manages relations automatically — just include them in the payload.
    // TODO Hover your mouse over "createdUsers" to see the typing: it's an array of the "public" selectModel
    const createdUsers = await userRepository.saveList([
        {
            name: "Fernanda Costa",
            email: "fernanda@email.com",
            password: "password123",
            likesVSRepo: true,
            userType: UserType.COMMON,
            // * Passing the "address" relation directly in the payload — VSRepository creates the address
            // * linked to the user, within the same transaction
            address: {
                city: "Fortaleza",
                state: "CE",
                country: "Brazil",
            },
        },
        {
            name: "Gabriel Souza",
            email: "gabriel@email.com",
            password: "password123",
            likesVSRepo: true,
            userType: UserType.ADMIN,
        },
        {
            name: "Helena Lima",
            email: "helena@email.com",
            password: "password123",
            likesVSRepo: false,
            userType: UserType.COMMON,
        },
    ]);

    console.log(
        "\nUsers created with saveList:",
        createdUsers.map(u => ({ name: u.name, address: u.address })),
    );

    const [fernanda, gabriel, helena] = createdUsers;

    // * -----------------------------------------------------------------------
    // * 2) getList — fetching multiple records by a list of PKs
    // * -----------------------------------------------------------------------

    // * "getList" performs a single database query to fetch several records at once by a list of PKs.
    // ! Important: the ORDER of the results may not respect the order of the PK list you passed.
    // * The default selector (defaultSelectModel) is applied normally, as is requiredWhere.
    const foundUsers = await userRepository.getList([fernanda!.id, gabriel!.id, helena!.id]);

    console.log(
        "\nUsers found with getList:",
        foundUsers.map(u => u.name),
    );

    // * Just like the other base methods, "getList" accepts options — including a different selectModel
    const minimalUsers = await userRepository.getList([fernanda!.id, gabriel!.id], {
        selectModel: "minimal",
    });
    // TODO Hover your mouse over "minimalUsers" to see that only "id" is available
    console.log("\ngetList with selectModel 'minimal' (IDs only):", minimalUsers);

    // * -----------------------------------------------------------------------------------------------
    // * 3) patchList — updating multiple records in an automatic transaction, with relation support
    // * -----------------------------------------------------------------------------------------------

    // * "patchList" receives an array of [pk, payload] tuples and applies the patch of each one within a
    // * single automatic transaction. Just like "patch", "patchList" also manages relations automatically.
    // TODO Hover your mouse over "updatedUsers" to see that it's an array of the "public" selectModel
    const updatedUsers = await userRepository.patchList([
        [
            fernanda!.id,
            {
                name: "Fernanda Costa Silva",
                // * Updating Fernanda's address via patchList — VSRepository manages the "set"
                // * of the "address" relation (configured with restriction: "set" in repositories.ts)
                address: {
                    city: "Recife",
                    state: "PE",
                    country: "Brazil",
                },
            },
        ],
        [gabriel!.id, { userType: UserType.COMMON }],
        [helena!.id, { likesVSRepo: true, name: "Helena Lima Carvalho" }],
    ]);

    console.log(
        "\nUsers after patchList:",
        updatedUsers.map(u => ({
            name: u.name,
            userType: u.userType,
            likesVSRepo: u.likesVSRepo,
            address: u.address,
        })),
    );

    // * -----------------------------------------------------------------------
    // * 4) merge — deep merge in MEMORY (without persisting to the database)
    // * -----------------------------------------------------------------------

    // * "merge" is analogous to TypeORM's "preload": it fetches the record by PK, performs a deep merge
    // * in memory with the object you provided, and returns the merged result — but it does NOT save anything
    // * to the database. It's up to the caller to decide what to do with the returned object.
    // *
    // ? When should you use merge vs patch?
    // *   patch  — modifies the database directly without loading the object first; returns the updated state
    // *   merge  — useful when you need the merged state in memory before deciding whether to save,
    // *            apply additional validations, show a change preview, or build a more
    // *            complex payload before manually calling save

    const productForMerge = await productRepository.save({
        name: "VSRepo Backpack",
        price: 149.9,
        description: "Original backpack",
        userId: fernanda!.id,
    });

    console.log("\nProduct before merge:", {
        name: productForMerge.name,
        price: Number(productForMerge.price),
        description: productForMerge.description,
    });

    // * "merge" merges the fields in memory: the provided fields overwrite the existing ones,
    // * the fields that aren't provided keep their original value from the database
    const mergedProduct = await productRepository.merge(
        productForMerge.id,
        {
            price: 129.9,
            description: "Limited edition",
        },
        { selectModel: "publicWithoutUser" },
    );

    // TODO Hover your mouse over "mergedProduct" to see that the return type is the "public" selectModel | null
    // * merge returns null if the record isn't found (just like "get"), since it performs an internal "get" first
    console.log(
        "\nProduct after merge in memory (price and description merged, nothing persisted yet):",
        {
            name: mergedProduct?.name,
            price: Number(mergedProduct?.price),
            description: mergedProduct?.description,
        },
    );

    // * If you want to persist the merged result, just call save with the object returned by merge
    if (mergedProduct) {
        const savedAfterMerge = await productRepository.save(mergedProduct);
        console.log("\nProduct persisted after merge + save:", {
            name: savedAfterMerge.name,
            price: Number(savedAfterMerge.price),
            description: savedAfterMerge.description,
        });
    }

    // * -----------------------------------------------------------------------
    // * 5) Final cleanup
    // * -----------------------------------------------------------------------

    // ! Since "Product" and "Address" have "onDelete: Cascade" linked to the user, removing the user already
    // ! permanently removes their products and address
    await userRepository.deleteManyByIdIn([fernanda!.id, gabriel!.id, helena!.id]);

    process.exit(0);
}

// * Now, to test the batch methods, we call the function to run all the operations
// TODO Run pnpm tsx examples/tests/batch-methods.test.ts or npx tsx examples/tests/batch-methods.test.ts to execute the code
void batchMethodsTest();
