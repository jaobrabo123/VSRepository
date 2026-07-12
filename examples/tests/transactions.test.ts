// * In this file we'll test transactions with VSRepository. The core idea is: ".build(prisma)" stores the
// * PrismaClient instance you passed, and it's available at "repository.prisma". This is what lets you
// * open a native Prisma transaction and have multiple repositories participate in it

import { userRepository, productRepository, addressRepository } from "../repositories";
import { UserType } from "../../generated/prisma/enums";
import { VSRepoError } from "../../generated/vsrepo";
import { User } from "../../generated/prisma/client";

// * This will be the function we use to test transactions
async function transactionsTest() {
    // * ---------------------------------------------------------------------
    // * 1) ACCESSING THE PRISMA INSTANCE VIA "repository.prisma"
    // * ---------------------------------------------------------------------

    // * Every repository built with ".build(prisma)" stores that same instance at ".prisma". This is just the
    // * "plain" PrismaClient behind it, so any of its native methods (like "$transaction", "$queryRaw", etc.)
    // * is available normally
    // TODO Hover your mouse over "userRepository.prisma" to see that the type is exactly "PrismaClient"
    console.log("\nIs userRepository.prisma the same instance passed into build:", userRepository.prisma === productRepository.prisma);

    // ! Notice that we compared "userRepository.prisma" with "productRepository.prisma" and the result is "true": this
    // ! happens because, in "examples/repositories.ts", all repositories were built with the SAME
    // ! PrismaClient instance (imported from "examples/prisma.ts"). This isn't mandatory, but it's the
    // ! most common scenario and is exactly what allows all of them to participate in the same transaction, on top of being best practice

    // * ------------------------------------------------------------------------------------
    // * 2) SUCCESSFUL TRANSACTION: multiple repositories participating in the same transaction
    // * ------------------------------------------------------------------------------------

    // * Every VSRepository method accepts a last options argument with a "db" field.
    // * When you pass the "tx" received by "$transaction" into that field, the operation
    // * starts running INSIDE that transaction instead of using the "standalone" PrismaClient connection
    const { user, address, product } = await userRepository.prisma.$transaction(async (tx) => {
        // * Creating the user inside the transaction (notice the "{ db: tx }" at the end)
        const createdUser = await userRepository.save(
            {
                name: "Beatriz Souza",
                email: "beatriz@email.com",
                password: "password123",
                likesVSRepo: true,
                userType: UserType.COMMON,
            },
            { db: tx },
        );

        // * Creating this user's address, also inside the SAME transaction, but using "addressRepository"
        const createdAddress = await addressRepository.save(
            {
                userId: createdUser.id,
                city: "Aracaju",
                state: "SE",
                country: "Brazil",
            },
            { db: tx },
        );

        // * And creating a product linked to this user, also participating in the transaction
        const createdProduct = await productRepository.save(
            {
                name: "VSRepo T-Shirt",
                price: 59.9,
                userId: createdUser.id,
            },
            { db: tx },
        );

        // * If we get here without any error being thrown, Prisma automatically COMMITS at the end of the
        // * callback, persisting all 3 operations at once
        return { user: createdUser, address: createdAddress, product: createdProduct };
    });

    console.log("\nTransaction completed successfully, records created:", { user, address, product });

    // * ---------------------------------------------------------------------
    // * 3) TRANSACTION WITH ROLLBACK: an error in the middle undoes everything
    // * ---------------------------------------------------------------------

    // * Now let's simulate a failure scenario: the "userId" field on "Address" is "@unique" in schema.prisma
    // * (a true one-to-one relation), meaning you can't have 2 addresses for the same user. Let's
    // * try to create a second valid user, but an address with a "userId" that's already in use, inside the
    // * SAME transaction, to see the rollback happen

    let failedUser: User | null = null;

    try {
        await userRepository.prisma.$transaction(async (tx) => {
            // * This user is created normally inside the transaction...
            const newUser = await userRepository.save(
                {
                    name: "Rafael Lima",
                    email: "rafael@email.com",
                    password: "password123",
                    likesVSRepo: true,
                    userType: UserType.COMMON,
                },
                { db: tx, selectModel: "internal" },
            );

            failedUser = newUser;

            // * ...but here we force an error: we try to create an address using "Beatriz Souza"'s userId,
            // * who ALREADY HAS an address (created in the previous step). Since "userId" is "@unique" on Address, Prisma
            // * will throw a constraint violation error
            await addressRepository.save(
                {
                    userId: user.id, // * userId that already has an address, this will cause a conflict
                    city: "Recife",
                    state: "PE",
                    country: "Brazil",
                },
                { db: tx },
            );

            // * This "console.log" is never executed, because the error above interrupts the transaction before
            // * reaching this point
            console.log("This line should never show up in the console");
        });
    } catch (error) {
        // ! When any operation inside the "$transaction" callback throws an error, Prisma rolls back
        // ! EVERYTHING that was done inside that callback, including the "newUser" we had just created
        // ! In this specific case the error comes from PRISMA (a @unique constraint violation), not from VSRepoError, that's
        // ! why we check "VSRepoError" first and fall into the "else" for Prisma's native error. VSRepoError is
        // ! thrown in specific situations within VSRepository itself (e.g. invalid configuration), it doesn't replace
        // ! the errors Prisma already throws
        if (error instanceof VSRepoError) {
            console.log("\nError handled by VSRepository (VSRepoError):", error.message);
        } else {
            console.log("\nDatabase constraint error, thrown by Prisma (@unique violation on Address.userId):", (error as Error).message);
        }
    }

    // * Let's confirm that the rollback really happened: "Rafael Lima" should NOT exist in the database, even
    // * though he was successfully created before the error, since he was part of the same transaction that failed
    // ? That 'as' is there so TS doesn't flag it as 'never'
    const rafaelExists = failedUser ? await userRepository.has((failedUser as User).id) : false;

    // * This log should show "false": it's proof that the rollback also undid the creation of "Rafael Lima",
    // * even though the error happened in a later operation (the Address one)
    console.log("\nDoes the user created before the error still exist in the database? (expected: false):", rafaelExists);

    // * --------------------------------------------------------------------------
    // * 4) USING "options.db" OUTSIDE A "$transaction" (with the standalone instance)
    // * --------------------------------------------------------------------------

    // * The "db" field isn't only for transactions: it accepts any "ClientOrTransaction", so it's also
    // * possible to pass Prisma's own "standalone" instance (without being inside a transaction). In practice
    // * this is the same as not passing "db" at all, but it's useful in scenarios where you receive the client via
    // * dependency injection and don't know whether it's a transaction or not
    const userViaStandaloneDb = await userRepository.get(user.id, { db: userRepository.prisma });
    console.log("\nFetching the user by passing Prisma's 'standalone' instance in options.db:", userViaStandaloneDb);

    // * Finally, let's clean up everything we created in this test
    // ! Since "Address" and "Product" have "onDelete: Cascade" in schema.prisma, removing the user already
    // ! automatically removes their address and products
    await userRepository.remove(user.id);

    process.exit(0);
}

// * Now, to test the transactions, we call the function to run all the operations
// TODO Run pnpm tsx .\examples\tests\transactions.test.ts or npx tsx .\examples\tests\transactions.test.ts to execute the code
void transactionsTest();
