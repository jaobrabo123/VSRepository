// * In this file we'll test how "requiredWhere" works in practice. It's a filter that's "locked" to the
// * repository and automatically injected into (almost) every operation, very useful for soft-delete, multi-tenancy,
// * or any business rule that needs to apply to everything

import { UserType } from "../../generated/prisma/enums";
import { userRepository } from "../repositories";

// * This will be the function we use to test requiredWhere
async function requiredWhereTest() {
    // * Recalling the "userRepository" configuration (declared in "examples/repositories.ts"):
    // * requiredWhere: { active: true }
    // * In other words, by default, EVERY operation on this repository only sees users with "active: true"

    // * Let's create an active user and then make them inactive to see the behavior
    const activeUser = await userRepository.save(
        {
            name: "Active User",
            email: "active@email.com",
            password: "password123",
            likesVSRepo: true,
            userType: UserType.COMMON,
            active: true,
        },
        { selectModel: "internal" },
    );

    console.log("\nActive user created:", activeUser);

    activeUser.active = false;
    activeUser.email = "inactive@email.com";
    activeUser.name = "Inactive User";
    const inactiveUser = await userRepository.save(activeUser, { selectModel: "internal" });

    console.log("\nDeactivated user:", inactiveUser);

    // ! Notice that "save" was able to deactivate the user normally. This happens because, back in repositories.ts,
    // ! we configured "baseMethods.save.ignoreRequiredWhere: true", meaning "save" ignores requiredWhere on the upsert
    // ! (otherwise, Prisma would try to locate the record already applying "active: true", and since the user we passed
    // ! already had an id, the upsert wouldn't find it and would throw an error)

    // * Now let's try to fetch the inactive user using the regular "get"
    const foundInactiveUser = await userRepository.get(inactiveUser.id);

    // * This log will show "null", because the requiredWhere "active: true" was automatically injected into the
    // * query and the inactive user doesn't pass that filter
    console.log("\nTrying to fetch the inactive user with 'get' (expected: null):", foundInactiveUser);

    // * The same applies to "By"-based dynamic methods, such as "findOneByEmailAndUserType"
    const foundByEmail = await userRepository.findOneByEmailAndUserType(
        "inactive@email.com",
        UserType.COMMON,
    );

    // * This also returns "null" for the same reason: requiredWhere is combined (AND) with the method's filter
    console.log("\nFetching the inactive user by email and type (expected: null):", foundByEmail);

    // * Creating an active user
    const otherUser = await userRepository.save({
        name: "Another Active User",
        email: "other@email.com",
        password: "password321",
        likesVSRepo: true,
        userType: UserType.COMMON,
        active: true,
    });

    // * An active user, on the other hand, is found normally, since they pass the requiredWhere
    const foundOtherUser = await userRepository.get(otherUser.id);
    console.log("\nFetching an active user with 'get' (expected: found):", foundOtherUser);

    // * There are 2 ways to "bypass" requiredWhere when needed: configuring "ignoreRequiredWhere" in
    // * "baseMethods" (we've already seen this in save) or using "whereType: 'overwrite'" in dynamic methods

    // * The "findInternalByEmail" method was configured like this in repositories.ts:
    // * proxyTo: "findOneByEmail", whereType: "overwrite", selectModel: "internal"
    // * This means it completely ignores requiredWhere and still returns the internal data (with the password)
    const internalInactiveUser = await userRepository.findInternalByEmail("inactive@email.com");

    // * Now the inactive user IS found, because this specific method is marked as "overwrite"
    console.log(
        "\nFetching the inactive user with 'findInternalByEmail' (ignores requiredWhere):",
        internalInactiveUser,
    );

    // * It's also possible to ignore requiredWhere for a base method on a case-by-case basis. Remember that in repositories.ts
    // * we configured "baseMethods.getOrThrow.ignoreRequiredWhere: true"
    const inactiveUserViaGetOrThrow = await userRepository.getOrThrow(inactiveUser.id);
    console.log(
        "\nFetching the inactive user with 'getOrThrow' (ignoreRequiredWhere enabled):",
        inactiveUserViaGetOrThrow,
    );

    // * Important: requiredWhere is also combined into count and existence-check operations
    const totalUsers = await userRepository.total();
    console.log(
        "\nTotal users (only counting active ones because of requiredWhere):",
        totalUsers,
    );

    const existsInactive = await userRepository.has(inactiveUser.id);

    // * "has" uses pkName internally in a minimal select, but requiredWhere is still applied, so the
    // * inactive user doesn't "exist" from this repository's point of view
    console.log("\nDoes the inactive user exist (via 'has', expected: false):", existsInactive);

    // * And finally, "remove" applies requiredWhere by default (the default for "ignoreRequiredWhere" on remove is
    // * "false"), and since we didn't override this config in repositories.ts, let's confirm the default behavior
    // * by removing the active user, which we know passes the filter
    await userRepository.remove(otherUser.id);
    console.log("\nActive user removed successfully");

    // * To clean up the inactive user from the database, since a regular "remove" would apply requiredWhere (and it
    // * wouldn't pass), we'll use "deleteManyByIdIn", which is configured with "whereType: 'overwrite'" in repositories.ts
    await userRepository.deleteManyByIdIn([inactiveUser.id]);
    console.log(
        "\nInactive user removed successfully (via deleteManyByIdIn, which ignores requiredWhere)",
    );

    process.exit(0);
}

// * Now, to test requiredWhere, we call the function to run all the operations
// TODO Run pnpm tsx .\examples\tests\required-where.test.ts or npx tsx .\examples\tests\required-where.test.ts to execute the code
void requiredWhereTest();
