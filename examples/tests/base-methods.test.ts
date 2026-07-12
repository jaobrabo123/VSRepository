// * Now that we've configured our repositories, let's start the tests — first let's test the base methods that already come when you create a repository

import { UserType } from "../../generated/prisma/enums";
import { userRepository } from "../repositories";

// * This will be the function we use to test the base methods
async function baseMethodsTest() {
    // * Well, to start, let's test getAll to fetch all users. It can receive a pagination and ordering configuration as a parameter,
    // * let's start by trying to fetch 20 records
    // TODO Hover your mouse over "getAllResult" to see its typing, it matches our "public" model that we set as default on the repository
    const getAllResult = await userRepository.getAll({ pagination: { take: 20 } });

    // * Since we haven't registered any users yet, it probably returned nothing, but let's do a console.log to see the result
    console.log("\n'getAll' result:", getAllResult);

    // * Now let's populate our database with a few users. Since VSRepository *doesn't yet* support a method like "saveMany" or "saveList"
    // * to save several records at once, we'll do a save one at a time. However, a more robust option would be to use the createMany we declared
    // * in our repository to use Prisma's native createMany (a createManyAndReturn would also be an option), but in this case we'll use save
    // TODO Hover your mouse over each of them to see the typing, notice that so far the password is never returned
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
    const user3 = await userRepository.save({
        name: "Tony Stark",
        email: "tony@stark.com",
        password: "jarvi5123",
        likesVSRepo: true,
        userType: UserType.ADMIN,
    });

    // * Now let's log each of the users to the console
    console.log("\nUser 1:", user1);
    console.log("\nUser 2:", user2);
    console.log("\nUser 3:", user3);

    // * We can check the total number of users with the "total" method
    const totalUsers = await userRepository.total();
    console.log("\nTotal users:", totalUsers);

    // * We can quickly check whether a user exists using "has"
    const user1Exists = await userRepository.has(user1.id);
    console.log("\nDoes User 1 exist?", user1Exists);

    // * We can also partially change the user's data using "patch"
    const updatedUser2 = await userRepository.patch(user2.id, {
        likesVSRepo: true,
        name: "A pretty cool guy",
        email: "cool@guy.com",
    });
    console.log("\nUpdated User 2:", updatedUser2);

    // * To fetch a specific user we use "get" passing their id
    // * In this case we'll also choose a specific selectModel (other than the default) to see the difference in the result
    // TODO Hover your mouse over "internalUser3" to see that now we're returning the password
    const internalUser3 = await userRepository.get(user3.id, { selectModel: "internal" });
    console.log("\nUser 3 internal data:", internalUser3);

    // * We can also update a user with "save", as long as the provided object contains the user's id so save performs an "upsert"
    // ? Here we assert the user isn't null with '!' because get returns the user's data if found, or null if not found
    // ? but in this case we "are sure" it exists
    internalUser3!.password = "J4rv1s0987";
    internalUser3!.email = "jarvis@email.com";

    const updatedUser3 = await userRepository.save(internalUser3!);
    console.log("\nUpdated User 3:", updatedUser3);

    // * To really make sure a record exists before trying to do something, we can use "getOrThrow" — it fetches a user by id and throws
    // * an error if not found
    try {
        // * To test this, let's try to fetch a user that doesn't exist
        const unknownUser = await userRepository.getOrThrow(crypto.randomUUID());
        console.log("\nThis log won't show up:", unknownUser);
    } catch (error: any) {
        console.log("\nExpected error:", error.message);
    }

    // * We can also remove a specific user with "remove"
    await userRepository.remove(user2.id);

    // * Now let's fetch all users with "getAll" to check whether User 2 was really removed
    const allUsers = await userRepository.getAll();
    console.log("\nAll users:", allUsers);

    // * Well, and to avoid leaving our database polluted, let's remove everything we created in this test
    // * NOTE: here we're using "deleteManyByIdIn" since we disabled "removeList" on our repository's instance
    await userRepository.deleteManyByIdIn([user1.id, user2.id, user3.id]);

    process.exit(0);
}

// * Now, to test the base methods, we call the function to run all the operations
// TODO Run pnpm tsx .\examples\tests\base-methods.test.ts or npx tsx .\examples\tests\base-methods.test.ts to execute the code
void baseMethodsTest();
