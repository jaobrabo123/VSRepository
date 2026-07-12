// * In this file we'll test how "relations" work in practice, both when saving/updating (save/patch)
// * and when fetching related data (select and relation filters)

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * This will be the function we use to test the relations
async function relationsTest() {
    // * Recalling the "userRepository" relations configuration (declared in "examples/repositories.ts"):
    // * - address: one-to-one (oto), restriction "set"  -> whenever sent, replaces the current address
    // * - products: one-to-many (otm), restriction "add" -> adds/updates products without deleting the existing ones

    // * Let's start by creating a user already with an address and products in the same "save" call — VSRepository takes
    // * care of creating all of this in a related way for us, without us having to manually configure the Prisma call
    // TODO Hover your mouse over "user1" to see that the autocomplete suggests "address" and "products" in the payload, this only
    // TODO works because we used "UserGetPayload" with "include" back in repositories.ts
    const user1 = await userRepository.save({
        name: "Mary",
        email: "mary@email.com",
        password: "strongPassword123",
        likesVSRepo: true,
        userType: UserType.COMMON,
        address: {
            city: "São Paulo",
            state: "SP",
            country: "Brazil",
        },
        products: [
            { name: "VSRepo T-Shirt", price: 59.9, description: "Official T-shirt" },
            { name: "VSRepo Mug", price: 29.9 },
        ],
    });

    console.log("\nUser created with address and products:", user1);

    // * Notice that "save" already returns the created address and products inside the returned object, because the
    // * "public" selectModel of this repository includes "address" and "products" (see examples/repositories.ts)

    // * Now let's test the "set" restriction on "address": when sending a new address in "patch", the previous one is
    // * completely replaced (no "orphan" address stays in the database, since it's a one-to-one relation)
    const userWithNewAddress = await userRepository.patch(user1.id, {
        address: {
            city: "Rio de Janeiro",
            state: "RJ",
            country: "Brazil",
        },
    });

    console.log("\nUser with replaced address ('set' restriction):", userWithNewAddress);

    // * The "add" restriction on "products" works differently: when sending a new product in "patch", it's
    // * added to the list, and the products that already existed remain there (they aren't removed)
    const userWithNewProduct = await userRepository.patch(user1.id, {
        products: [{ name: "VSRepo Cap", price: 39.9 }],
    });

    // TODO Notice in the log below that the user now has 3 products (the 2 created in save + this new one), since the
    // TODO "add" restriction never removes existing relationships
    console.log("\nUser with an added product ('add' restriction):", userWithNewProduct);

    // * We can also update a specific product in an "otm" relation by sending its "id" inside the array,
    // * in this case VSRepository understands it's meant to update rather than create a new one
    // ! We search by "name" instead of using a fixed array position, since Prisma doesn't guarantee the return
    // ! order of a relation without an explicit "orderBy"
    const firstProductId = userWithNewProduct.products.find(p => p.name === "VSRepo T-Shirt")!.id;

    const userWithUpdatedProduct = await userRepository.patch(user1.id, {
        products: [{ id: firstProductId, name: "VSRepo T-Shirt (Sale)", price: 39.9 }],
    });

    console.log("\nUser with a product updated by id:", userWithUpdatedProduct);

    // * Now let's see relation filters in practice — they let you filter an entity based on fields
    // * of one of its relations. These methods are already configured in "examples/repositories.ts"

    // * "findByProductsSome" fetches users who have AT LEAST one registered product
    const usersWithProducts = await userRepository.findByProductsSome();
    console.log("\nUsers with at least 1 product:", usersWithProducts);

    // * "findByProductsNone" does the opposite: fetches users who have NO products at all
    const usersWithoutProducts = await userRepository.findByProductsNone();
    console.log("\nUsers with no products:", usersWithoutProducts);

    // * "findByAddressWithout" fetches users who do NOT have a registered address (null "to-one" relation)
    const usersWithoutAddress = await userRepository.findByAddressWithout();
    console.log("\nUsers without an address:", usersWithoutAddress);

    // * It's also possible to filter by a specific field inside the relation, like the address's country
    const usersFromBrazil = await userRepository.findByAddressWithCountry("Brazil");
    console.log(
        "\nUsers with an address in Brazil (ordered by state/city):",
        usersFromBrazil,
    );

    // * On the "productRepository" side we also have relation filters, like "findByTagsSomeName", which fetches
    // * products that have a tag with a specific name (many-to-many relation)
    // * Let's create a product with tags to test this
    const productWithTags = await productRepository.save({
        name: "VSRepo Backpack",
        price: 149.9,
        userId: user1.id,
        tags: [{ name: "sale" }, { name: "new" }],
    });

    console.log("\nProduct created with tags (many-to-many relation):", productWithTags);

    // * Notice that the "tags" relation uses "pk: 'name'" in repositories.ts, this means that if a tag named
    // * "sale" already exists, it will be connected to the product instead of creating a new one (avoids duplicates)
    const productsTaggedAsSale = await productRepository.findByTagsSomeName("sale");
    console.log("\nProducts with the 'sale' tag:", productsTaggedAsSale);

    // * We can also fetch products by the owner's email (many-to-one relation, "findByUserWithEmail")
    const productsFromMary = await productRepository.findByUserWithEmail("mary@email.com");
    console.log("\nProducts whose owner has the email 'mary@email.com':", productsFromMary);

    // * Finally, let's clean up everything we created in this test
    // ! Since the "user -> address" and "user -> product" relations have "onDelete: Cascade" in schema.prisma, removing
    // ! the user also automatically removes their address and products at the database level
    await userRepository.deleteManyByIdIn([user1.id]);

    process.exit(0);
}

// * Now, to test the relations, we call the function to run all the operations
// TODO Run pnpm tsx .\examples\tests\relations.test.ts or npx tsx .\examples\tests\relations.test.ts to execute the code
void relationsTest();
