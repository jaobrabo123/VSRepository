import { UserType } from "./generated/prisma/enums";
import { ProductGetPayload, UserCreateInput, UserGetPayload } from "./generated/prisma/models";
import {
    DynamicRepository,
    DynamicMethod,
    DynamicMethodOptions,
    PaginationModel,
} from "./generated/vsrepo";
import prisma from "./examples/prisma";

type User = UserGetPayload<{ include: { address: true; products: true } }>;
type Product = ProductGetPayload<{ include: { tags: true; user: true } }>;

class UserRepository extends DynamicRepository<
    User,
    "User",
    string,
    { address: true; products: true }
> {
    constructor() {
        super(prisma, {
            tableName: "user",
            pkName: "id",
            requiredWhere: { active: true },
            defaultOrdenation: [{ createdAt: "desc" }],
            relations: {
                address: { mode: "oto", pk: "id", restriction: "set" },
                products: { mode: "otm", pk: "id", restriction: "add" },
            },
            build: {
                showWorking: false,
                baseMethods: {
                    remove: { ignoreRequiredWhere: true },
                    getOrThrow: { ignoreRequiredWhere: true },
                    save: { ignoreRequiredWhere: true },
                },
            },
        });
    }

    @DynamicMethod()
    declare findByUserType: (
        userType: UserType,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare findOneByEmailAndUserType: (
        email: string,
        userType: UserType,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;

    @DynamicMethod()
    declare findByUserTypeOrEmailEndsWith: (
        userType: UserType,
        emailEndsWith: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare findByLikesVSRepoIsTruePaginated: (
        pagination: PaginationModel<"User">,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod<"User">()
    declare findManyDistinctUserTypeAndLikesVSRepo: (
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod<"User">()
    declare findManyDistinctUserTypePaginated: (
        pagination: PaginationModel<"User">,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod<"User">()
    declare findManyByLikesVSRepoDistinctUserType: (
        likesVSRepo: boolean,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod<"User">({ proxyTo: "findByLikesVSRepoIsFalse" })
    declare buscarUsuariosPaias: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    @DynamicMethod<"User">({ proxyTo: "findOneByEmail", whereType: "overwrite" })
    declare findInternalByEmail: (
        email: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;

    @DynamicMethod()
    declare existsByEmail: (email: string) => Promise<boolean>;

    @DynamicMethod<"User">({ proxyTo: "findMany", pushWhere: { userType: UserType.ADMIN } })
    declare findAdmins: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    @DynamicMethod<"User">({
        injectOrdenation: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
    })
    declare findByAddressWithCountry: (
        country: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare findByAddressWithout: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    @DynamicMethod()
    declare findByProductsSome: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    @DynamicMethod()
    declare findByProductsNone: (options?: DynamicMethodOptions<"User">) => Promise<User[]>;

    @DynamicMethod()
    declare findByNameContainsInsensitiveOrderedAndPaginated: (
        name: string,
        order: any,
        pagination: PaginationModel<"User">,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare findUniqueByEmail: (
        email: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;

    @DynamicMethod()
    declare findUniqueOrThrowById: (
        id: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User>;

    @DynamicMethod()
    declare findFirstByNameStartsWith: (
        name: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;

    @DynamicMethod()
    declare findFirstOrThrowByIdOrEmail: (
        id: string,
        email: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User>;

    @DynamicMethod()
    declare countByUserType: (userType: UserType) => Promise<number>;

    @DynamicMethod()
    declare findManyByNameOptional: (
        name?: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare createManyAndReturn: (
        data: any[],
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare createManySkipDuplicates: (data: any[]) => Promise<{ count: number }>;

    @DynamicMethod()
    declare create: (
        data: UserCreateInput,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User>;

    @DynamicMethod()
    declare updateManyAndReturnByUserType: (
        userType: UserType,
        data: any,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User[]>;

    @DynamicMethod()
    declare updateManyWhere: (where: any, data: any) => Promise<{ count: number }>;

    @DynamicMethod()
    declare updateById: (
        id: string,
        data: any,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User>;

    @DynamicMethod()
    declare upsertByEmail: (
        email: string,
        update: any,
        create: UserCreateInput,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User>;

    @DynamicMethod<"User">({ whereType: "overwrite" })
    declare deleteManyByIdIn: (ids: string[]) => Promise<{ count: number }>;

    @DynamicMethod<"User">({ whereType: "overwrite" })
    declare deleteManyWhere: (where: any) => Promise<{ count: number }>;

    @DynamicMethod()
    declare deleteById: (id: string) => Promise<User>;

    @DynamicMethod()
    declare aggregate: (args: any) => Promise<any>;

    @DynamicMethod()
    declare groupBy: (args: any) => Promise<any>;

    @DynamicMethod()
    declare findOneByEmail: (
        email: string,
        options?: DynamicMethodOptions<"User">,
    ) => Promise<User | null>;
}

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
            softRemovekName: "deletedAt",
            requiredWhere: { user: { is: { active: true } } },
            relations: {
                user: { mode: "mto", pk: "id", restriction: "add", nullable: false },
                tags: { mode: "mtm", pk: "name", restriction: "set" },
            },
            build: {
                showWorking: false,
                baseMethods: { removeList: { ignoreRequiredWhere: true } },
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
    declare findByDescriptionIsNull: (
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByTagsSomeName: (
        name: string,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByUserWithEmail: (
        email: string,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByUserId: (
        userId: string,
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod()
    declare findByIdIn: (
        ids: string[],
        options?: DynamicMethodOptions<"Product">,
    ) => Promise<Product[]>;

    @DynamicMethod<"Product">({ whereType: "overwrite" })
    declare deleteManyWhere: (where: any) => Promise<{ count: number }>;
}

const userRepository = new UserRepository();
const productRepository = new ProductRepository();

// process.exit(0)

async function cleanDatabase() {
    await productRepository.deleteManyWhere({}).catch(console.error);
    await userRepository.deleteManyWhere({}).catch(console.error);
}

async function createTestUser(overrides: Record<string, unknown> = {}) {
    return userRepository.save({
        name: "Test User",
        email: "test@example.com",
        password: "secret123",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        ...overrides,
    });
}

async function createTestProduct(userId: string, overrides: Record<string, unknown> = {}) {
    return productRepository.save(
        {
            name: "Test Product",
            description: "A test product",
            price: 99.9,
            userId,
            ...overrides,
        },
        { include: { user: true } },
    );
}

async function testUserBaseMethods() {
    console.log("\n=== USER -- BASE METHODS (DynamicRepository) ===");

    const created = await createTestUser({ email: "base-save@example.com" });
    console.assert(!!created.id, "save (create): must return user with id");
    console.log("save (create):", created.id);

    const found = await userRepository.get(created.id);
    console.assert(found?.id === created.id, "get: must find user by id");
    console.log("get:", found?.id);

    const foundOrThrow = await userRepository.getOrThrow(created.id);
    console.assert(foundOrThrow.id === created.id, "getOrThrow: must return without error");
    console.log("getOrThrow:", foundOrThrow.id);

    created.name = "Updated Name";
    const updated = await userRepository.save(created);
    console.assert(updated.name === "Updated Name", "save (update): must update name");
    console.log("save (update):", updated.name);

    const patched = await userRepository.patch(created.id, { name: "Patched Name" });
    console.assert(patched.name === "Patched Name", "patch: must apply partial update");
    console.log("patch:", patched.name);

    const exists = await userRepository.has(created.id);
    console.assert(exists === true, "has: must return true for existing id");
    console.log("has (true):", exists);

    const notExists = await userRepository.has(crypto.randomUUID());
    console.assert(notExists === false, "has: must return false for non-existing id");
    console.log("has (false):", notExists);

    const count = await userRepository.total();
    console.assert(typeof count === "number" && count >= 1, "total: must return number >= 1");
    console.log("total:", count);

    const all = await userRepository.getAll();
    console.assert(
        Array.isArray(all) && all.length >= 1,
        "getAll: must return array with >= 1 item",
    );
    console.log("getAll:", all.length, "users");

    const paginated = await userRepository.getAll({ pagination: { skip: 0, take: 1 } });
    console.assert(paginated.length === 1, "getAll (paginated): must return exactly 1 item");
    console.log("getAll (paginated):", paginated.length);

    const toRemove = await createTestUser({ email: "remove@example.com" });
    const removed = await userRepository.remove(toRemove.id);
    console.assert(removed.id === toRemove.id, "remove: must return removed user");
    const afterRemove = await userRepository.get(toRemove.id);
    console.assert(afterRemove === null, "remove: user should no longer exist");
    console.log("remove:", removed.id);

    const u1 = await createTestUser({ email: "removelist1@example.com" });
    const u2 = await createTestUser({ email: "removelist2@example.com" });
    const { count: removedCount } = await userRepository.removeList([u1.id, u2.id]);
    console.assert(removedCount === 2, "removeList: must remove 2 users");
    console.log("removeList count:", removedCount);

    return created;
}

async function testUserDynamicMethods() {
    console.log("\n=== USER -- DYNAMIC METHODS (DynamicRepository) ===");

    const email = "dynamic@example.com";
    const adminEmail = "admin@corp.com";

    const user = await createTestUser({ email, userType: UserType.COMMON, likesVSRepo: true });
    const admin = await createTestUser({
        email: adminEmail,
        userType: UserType.ADMIN,
        likesVSRepo: false,
    });

    const byType = await userRepository.findByUserType(UserType.COMMON);
    console.assert(Array.isArray(byType) && byType.length >= 1, "findByUserType: must return list");
    console.log("findByUserType:", byType.length);

    const byEmailAndType = await userRepository.findOneByEmailAndUserType(email, UserType.COMMON);
    console.assert(
        byEmailAndType?.id === user.id,
        "findOneByEmailAndUserType: must find correct user",
    );
    console.log("findOneByEmailAndUserType:", byEmailAndType?.id);

    const byTypeOrEmail = await userRepository.findByUserTypeOrEmailEndsWith(
        UserType.ADMIN,
        "@corp.com",
    );
    console.assert(
        byTypeOrEmail.some(u => u.id === admin.id),
        "findByUserTypeOrEmailEndsWith: must contain admin",
    );
    console.log("findByUserTypeOrEmailEndsWith:", byTypeOrEmail.length);

    const likers = await userRepository.findByLikesVSRepoIsTruePaginated({ skip: 0, take: 10 });
    console.assert(Array.isArray(likers), "findByLikesVSRepoIsTruePaginated: must return array");
    console.assert(
        likers.every(u => u.likesVSRepo === true),
        "findByLikesVSRepoIsTruePaginated: all must have likesVSRepo=true",
    );
    console.log("findByLikesVSRepoIsTruePaginated:", likers.length);

    const distinctTypeAndLikes = await userRepository.findManyDistinctUserTypeAndLikesVSRepo();
    console.assert(
        Array.isArray(distinctTypeAndLikes),
        "findManyDistinctUserTypeAndLikesVSRepo: must return array",
    );
    const uniqueCombos = new Set(
        distinctTypeAndLikes.map(u => `${u.userType}-${u.likesVSRepo}`),
    );
    console.assert(
        uniqueCombos.size === distinctTypeAndLikes.length,
        "findManyDistinctUserTypeAndLikesVSRepo: no duplicate combos",
    );
    console.assert(
        distinctTypeAndLikes.some(u => u.userType === UserType.COMMON && u.likesVSRepo === true) &&
            distinctTypeAndLikes.some(
                u => u.userType === UserType.ADMIN && u.likesVSRepo === false,
            ),
        "findManyDistinctUserTypeAndLikesVSRepo: must contain (COMMON,true) and (ADMIN,false)",
    );
    console.log(
        "findManyDistinctUserTypeAndLikesVSRepo:",
        distinctTypeAndLikes.map(u => u.userType).join(", "),
    );

    const distinctTypePaginated = await userRepository.findManyDistinctUserTypePaginated({
        skip: 0,
        take: 10,
    });
    console.assert(
        Array.isArray(distinctTypePaginated),
        "findManyDistinctUserTypePaginated: must return array",
    );
    const uniqueTypes = new Set(distinctTypePaginated.map(u => u.userType));
    console.assert(
        uniqueTypes.size === distinctTypePaginated.length,
        "findManyDistinctUserTypePaginated: no duplicate userType",
    );
    console.assert(
        uniqueTypes.has(UserType.COMMON) && uniqueTypes.has(UserType.ADMIN),
        "findManyDistinctUserTypePaginated: must contain COMMON and ADMIN",
    );
    console.log(
        "findManyDistinctUserTypePaginated:",
        distinctTypePaginated.map(u => u.userType).join(", "),
    );

    const distinctByLikes = await userRepository.findManyByLikesVSRepoDistinctUserType(true);
    console.assert(
        Array.isArray(distinctByLikes),
        "findManyByLikesVSRepoDistinctUserType: must return array",
    );
    console.assert(
        distinctByLikes.every(u => u.likesVSRepo === true),
        "findManyByLikesVSRepoDistinctUserType: all must have likesVSRepo=true",
    );
    const uniqueTypesFiltered = new Set(distinctByLikes.map(u => u.userType));
    console.assert(
        uniqueTypesFiltered.size === distinctByLikes.length,
        "findManyByLikesVSRepoDistinctUserType: no duplicate userType",
    );
    console.log(
        "findManyByLikesVSRepoDistinctUserType:",
        distinctByLikes.map(u => u.userType).join(", "),
    );

    const paias = await userRepository.buscarUsuariosPaias();
    console.assert(Array.isArray(paias), "buscarUsuariosPaias: must return array");
    console.assert(
        paias.every(u => u.likesVSRepo === false),
        "buscarUsuariosPaias: all must have likesVSRepo=false",
    );
    console.log("buscarUsuariosPaias:", paias.length);

    const internal = await userRepository.findInternalByEmail(email);
    console.assert(internal?.id === user.id, "findInternalByEmail: must return correct user");
    console.log("findInternalByEmail:", internal?.id);

    const emailExists = await userRepository.existsByEmail(email);
    console.assert(emailExists === true, "existsByEmail: must return true for existing email");
    const emailNotExists = await userRepository.existsByEmail("naoexiste@nada.com");
    console.assert(
        emailNotExists === false,
        "existsByEmail: must return false for non-existing email",
    );
    console.log("existsByEmail (true/false):", emailExists, emailNotExists);

    const admins = await userRepository.findAdmins();
    console.assert(
        admins.every(u => u.userType === UserType.ADMIN),
        "findAdmins: all must be ADMIN",
    );
    console.log("findAdmins:", admins.length);

    const withCountry = await userRepository.findByAddressWithCountry("BR");
    console.assert(Array.isArray(withCountry), "findByAddressWithCountry: must return array");
    console.log("findByAddressWithCountry:", withCountry.length);

    const withoutAddress = await userRepository.findByAddressWithout();
    console.assert(Array.isArray(withoutAddress), "findByAddressWithout: must return array");
    console.log("findByAddressWithout:", withoutAddress.length);

    const withProducts = await userRepository.findByProductsSome();
    console.assert(Array.isArray(withProducts), "findByProductsSome: must return array");
    console.log("findByProductsSome:", withProducts.length);

    const withoutProducts = await userRepository.findByProductsNone();
    console.assert(Array.isArray(withoutProducts), "findByProductsNone: must return array");
    console.assert(
        withoutProducts.some(u => u.id === user.id),
        "findByProductsNone: user without product should appear",
    );
    console.log("findByProductsNone:", withoutProducts.length);

    const byName = await userRepository.findByNameContainsInsensitiveOrderedAndPaginated(
        "test",
        { name: "asc" },
        { skip: 0, take: 5 },
    );
    console.assert(
        Array.isArray(byName),
        "findByNameContainsInsensitiveOrderedAndPaginated: must return array",
    );
    console.log("findByNameContainsInsensitiveOrderedAndPaginated:", byName.length);

    const uniqueEmail = await userRepository.findUniqueByEmail(email);
    console.assert(uniqueEmail?.id === user.id, "findUniqueByEmail: must return correct user");
    console.log("findUniqueByEmail:", uniqueEmail?.id);

    const uniqueOrThrow = await userRepository.findUniqueOrThrowById(user.id);
    console.assert(
        uniqueOrThrow.id === user.id,
        "findUniqueOrThrowById: must return without error",
    );
    console.log("findUniqueOrThrowById:", uniqueOrThrow.id);

    const firstByName = await userRepository.findFirstByNameStartsWith("Test");
    console.assert(firstByName !== null, "findFirstByNameStartsWith: must find at least 1 user");
    console.log("findFirstByNameStartsWith:", firstByName?.id);

    const firstOrThrow = await userRepository.findFirstOrThrowByIdOrEmail(user.id, email);
    console.assert(
        firstOrThrow.id === user.id,
        "findFirstOrThrowByIdOrEmail: must return correct user",
    );
    console.log("findFirstOrThrowByIdOrEmail:", firstOrThrow.id);

    const countUsers = await userRepository.countByUserType(UserType.COMMON);
    console.assert(
        typeof countUsers === "number" && countUsers >= 1,
        "countByUserType: must return number >= 1",
    );
    console.log("countByUserType:", countUsers);

    const withName = await userRepository.findManyByNameOptional("Test User");
    const withoutName = await userRepository.findManyByNameOptional(undefined);
    console.assert(
        Array.isArray(withName),
        "findManyByNameOptional (with name): must return array",
    );
    console.assert(
        Array.isArray(withoutName),
        "findManyByNameOptional (without name): must return array",
    );
    console.log("findManyByNameOptional (with/without name):", withName.length, withoutName.length);

    const emailMock = "123@email.com";
    const manyCreated = await userRepository.createManyAndReturn([
        {
            name: "Batch 1",
            email: "batch1-@ex.com",
            password: "x",
            userType: UserType.COMMON,
            likesVSRepo: false,
            active: true,
        },
        {
            name: "Batch 2",
            email: emailMock,
            password: "x",
            userType: UserType.COMMON,
            likesVSRepo: false,
            active: true,
        },
    ]);
    console.assert(
        Array.isArray(manyCreated) && manyCreated.length === 2,
        "createManyAndReturn: must return 2 users",
    );
    console.log("createManyAndReturn:", manyCreated.length);

    const skipResult = await userRepository.createManySkipDuplicates([
        {
            name: "Skip 1",
            email: "skip@ex.com",
            password: "x",
            userType: UserType.COMMON,
            likesVSRepo: false,
            active: true,
        },
        {
            name: "Skip 1",
            email: emailMock,
            password: "x",
            userType: UserType.COMMON,
            likesVSRepo: false,
            active: true,
        },
    ]);
    console.assert(
        typeof skipResult.count === "number",
        "createManySkipDuplicates: must return { count }",
    );
    console.log("createManySkipDuplicates count:", skipResult.count);

    const directCreated = await userRepository.create({
        name: "Direct Create",
        email: "direct@ex.com",
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
    });
    console.assert(!!directCreated.id, "create: must return user with id");
    console.log("create:", directCreated.id);

    const updatedMany = await userRepository.updateManyAndReturnByUserType(UserType.COMMON, {
        likesVSRepo: true,
    });
    console.assert(Array.isArray(updatedMany), "updateManyAndReturnByUserType: must return array");
    console.log("updateManyAndReturnByUserType:", updatedMany.length);

    const updateWhere = await userRepository.updateManyWhere(
        { userType: UserType.COMMON },
        { likesVSRepo: true },
    );
    console.assert(typeof updateWhere.count === "number", "updateManyWhere: must return { count }");
    console.log("updateManyWhere count:", updateWhere.count);

    const updatedById = await userRepository.updateById(user.id, { name: "Updated By Id" });
    console.assert(updatedById.name === "Updated By Id", "updateById: must update name");
    console.log("updateById:", updatedById.name);

    const upserted = await userRepository.upsertByEmail(
        email,
        { name: "Upserted Update" },
        {
            name: "Upserted Create",
            email,
            password: "x",
            userType: UserType.COMMON,
            likesVSRepo: true,
            active: true,
        },
    );
    console.assert(upserted.id === user.id, "upsertByEmail: must upsert existing user");
    console.log("upsertByEmail:", upserted.id);

    const toDelete = await createTestUser({ email: "del@ex.com" });
    const deleteResult = await userRepository.deleteManyByIdIn([toDelete.id]);
    console.assert(
        typeof deleteResult.count === "number",
        "deleteManyByIdIn: must return { count }",
    );
    console.log("deleteManyByIdIn count:", deleteResult.count);

    const toDeleteOne = await createTestUser({ email: "delone@ex.com" });
    const deletedOne = await userRepository.deleteById(toDeleteOne.id);
    console.assert(deletedOne.id === toDeleteOne.id, "deleteById: must return removed id");
    console.log("deleteById:", deletedOne.id);

    const aggregated = await userRepository.aggregate({
        _count: { _all: true },
        _min: { createdAt: true },
    });
    console.assert(
        typeof aggregated._count._all === "number",
        "aggregate: must return _count._all as number",
    );
    console.log("aggregate _count._all:", aggregated._count._all);

    const grouped: any[] = await userRepository.groupBy({
        by: ["userType"],
        _count: { userType: true },
    });
    console.assert(Array.isArray(grouped), "groupBy: must return array");
    console.assert(
        grouped.every(g => g._count.userType >= 0),
        "groupBy: each group must have _count.userType",
    );
    console.log("groupBy:", grouped.map(g => g.userType).join(", "));

    return { user, admin };
}

async function testProductBaseMethods(userId: string) {
    console.log("\n=== PRODUCT -- BASE METHODS (DynamicRepository) ===");

    const product = await createTestProduct(userId, { name: "Base Product", price: 50 });
    console.assert(!!product.id, "save (create): must create product with id");
    console.log("save (create):", product.id);

    const found = await productRepository.get(product.id);
    console.assert(found?.id === product.id, "get: must find product");
    console.log("get:", found?.id);

    const foundOrThrow = await productRepository.getOrThrow(product.id);
    console.assert(foundOrThrow.id === product.id, "getOrThrow: must return without error");
    console.log("getOrThrow:", foundOrThrow.id);

    product.name = "Base Product Updated";
    const { user, ...prod } = product;
    const prodResolved = { ...prod, userId: user.id };
    const updated = await productRepository.save(prodResolved);
    console.assert(updated.name === "Base Product Updated", "save (update): must update name");
    console.log("save (update):", updated.name);

    const patched = await productRepository.patch(product.id, { price: 200 });
    console.assert(patched.price.toNumber() === 200, "patch: must update price");
    console.log("patch price:", patched.price);

    const has = await productRepository.has(product.id);
    console.assert(has === true, "has: must return true");
    console.log("has:", has);

    const total = await productRepository.total();
    console.assert(total >= 1, "total: must be >= 1");
    console.log("total:", total);

    const all = await productRepository.getAll();
    console.assert(all.length >= 1, "getAll: must have at least 1 product");
    console.log("getAll:", all.length);

    const p1 = await createTestProduct(userId, { name: "RL1", price: 10 });
    const p2 = await createTestProduct(userId, { name: "RL2", price: 20 });
    const { count } = await productRepository.removeList([p1.id, p2.id]);
    console.assert(count === 2, "removeList: must return count=2");
    console.log("removeList count:", count);

    return product;
}

async function testProductDynamicMethods(userId: string) {
    console.log("\n=== PRODUCT -- DYNAMIC METHODS (DynamicRepository) ===");

    const product = await createTestProduct(userId, {
        name: "Dynamic Widget",
        description: "A cool widget",
        price: 149.9,
        tags: [{ name: "electronics" }],
    });
    const cheapProduct = await createTestProduct(userId, {
        name: "Cheap Thing",
        description: null,
        price: 9.99,
    });

    const byName = await productRepository.findByNameStartsWithInsensitive("dynamic");
    console.assert(
        byName.some(p => p.id === product.id),
        "findByNameStartsWithInsensitive: must find Dynamic Widget",
    );
    console.log("findByNameStartsWithInsensitive:", byName.length);

    const cheap = await productRepository.findByPriceLessThan(50);
    console.assert(
        cheap.some(p => p.id === cheapProduct.id),
        "findByPriceLessThan: must contain cheap product",
    );
    console.log("findByPriceLessThan:", cheap.length);

    const inRange = await productRepository.findByPriceBetween([100, 200]);
    console.assert(
        inRange.some(p => p.id === product.id),
        "findByPriceBetween: must contain Dynamic Widget",
    );
    console.log("findByPriceBetween:", inRange.length);

    const noDescription = await productRepository.findByDescriptionIsNull();
    console.assert(
        noDescription.some(p => p.id === cheapProduct.id),
        "findByDescriptionIsNull: must contain product without description",
    );
    console.log("findByDescriptionIsNull:", noDescription.length);

    const byTag = await productRepository.findByTagsSomeName("electronics");
    console.assert(
        byTag.some(p => p.id === product.id),
        "findByTagsSomeName: must find product with tag electronics",
    );
    console.log("findByTagsSomeName:", byTag.length);

    const userEntity = await userRepository.getOrThrow(userId);
    const byUserEmail = await productRepository.findByUserWithEmail(userEntity.email);
    console.assert(
        byUserEmail.some(p => p.id === product.id),
        "findByUserWithEmail: must find product of user",
    );
    console.log("findByUserWithEmail:", byUserEmail.length);

    const byUserId = await productRepository.findByUserId(userId);
    console.assert(
        byUserId.some(p => p.id === product.id),
        "findByUserId: must find products of user",
    );
    console.log("findByUserId:", byUserId.length);

    const byIds = await productRepository.findByIdIn([product.id, cheapProduct.id]);
    console.assert(byIds.length === 2, "findByIdIn: must return exactly 2 products");
    console.log("findByIdIn:", byIds.length);
}

async function testRelations() {
    console.log("\n=== RELATIONS (DynamicRepository) ===");

    const userWithAddress = await userRepository.save({
        name: "User With Address",
        email: "addr-@ex.com",
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: { city: "Aracaju", state: "SE", country: "BR" },
    });
    const loaded = await userRepository.getOrThrow(userWithAddress.id, {
        include: { address: true },
    });
    console.assert(loaded.address !== undefined, "save with address (oto): must save address");
    console.log("save with address:", loaded.address?.city);

    const userWithProducts = await userRepository.save({
        name: "User With Products",
        email: "prod@ex.com",
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        products: [{ name: "Product A", price: 10 }],
    });
    const loadedWithProds = await userRepository.getOrThrow(userWithProducts.id, {
        include: { products: true },
    });
    console.assert(
        Array.isArray(loadedWithProds.products),
        "save with products (otm): must have products list",
    );
    console.log("save with products:", loadedWithProds.products.length);

    const relUser = await createTestUser({ email: "reluser@ex.com" });
    const productWithUser = await productRepository.save({
        name: "Product With User",
        price: 77,
        tags: [{ name: "tag-a" }, { name: "tag-b" }],
        userId: relUser.id,
    });
    const loadedProduct = await productRepository.getOrThrow(productWithUser.id, {
        include: { tags: true, user: true },
    });
    console.assert(
        loadedProduct.user?.id === relUser.id,
        "save product with user (mto): must link user",
    );
    console.assert(
        Array.isArray(loadedProduct.tags) && loadedProduct.tags.length === 2,
        "save product with tags (mtm): must save 2 tags",
    );
    console.log(
        "save product with user + tags:",
        loadedProduct.user?.id,
        loadedProduct.tags.length,
    );
}

async function testRawInclude() {
    console.log("\n=== RAW INCLUDE (DynamicMethodOptions) ===");

    const user = await userRepository.save({
        name: "Raw Include User",
        email: "rawinclude@ex.com",
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: { city: "Rio de Janeiro", state: "RJ", country: "BR" },
        products: [
            { name: "Raw Included Product 1", price: 150 },
            { name: "Raw Included Product 2", price: 250 },
        ],
    });

    const userWithAddress = await userRepository.getOrThrow(user.id, {
        include: { address: true },
    });
    console.assert(
        userWithAddress.address?.city === "Rio de Janeiro",
        "include literal (address): must return address",
    );
    console.assert(
        userWithAddress.products === undefined,
        "include literal (address): must not return products",
    );
    console.log("getOrThrow with include literal (address):", userWithAddress.address?.city);

    const userFull = await userRepository.getOrThrow(user.id, {
        include: { address: true, products: { include: { tags: true } } },
    });
    console.assert(userFull.address !== undefined, "include literal (full): must return address");
    console.assert(
        Array.isArray(userFull.products) && userFull.products.length === 2,
        "include literal (full): must return 2 products",
    );
    console.assert(
        userFull.products.every(p => Array.isArray((p as any).tags)),
        "include literal (full): each product must have tags (array)",
    );
    console.log(
        "getOrThrow with include literal (full): address found &",
        userFull.products.length,
        "products",
    );

    const allWithProducts = await userRepository.getAll({ include: { products: true } });
    const foundInAll = allWithProducts.find(u => u.id === user.id);
    console.assert(
        Array.isArray(foundInAll?.products),
        "include literal in getAll: must return products for all items",
    );
    console.log("getAll with include literal (products): OK");
}

async function testTransactions() {
    console.log("\n=== TRANSACTIONS (DynamicRepository) ===");

    let transactionUserId: string | null = null;
    try {
        await userRepository.prisma.$transaction(async tx => {
            const user = await userRepository.save(
                {
                    name: "Transaction User",
                    email: "x@ex.com",
                    password: "x",
                    userType: UserType.COMMON,
                    likesVSRepo: false,
                    active: true,
                },
                { db: tx },
            );
            transactionUserId = user.id;
            throw new Error("forced rollback");
        });
    } catch {
        /* expected */
    }

    if (transactionUserId) {
        const shouldNotExist = await userRepository.get(transactionUserId);
        console.assert(
            shouldNotExist === null,
            "transaction (rollback): user must not persist after rollback",
        );
        console.log("transaction rollback: user does not persist");
    }

    let txUserId: string | null = null;
    await userRepository.prisma.$transaction(async tx => {
        const user = await userRepository.save(
            {
                name: "TX Success User",
                email: "txok@ex.com",
                password: "x",
                userType: UserType.COMMON,
                likesVSRepo: true,
                active: true,
            },
            { db: tx },
        );
        txUserId = user.id;
    });

    const txUser = txUserId ? await userRepository.get(txUserId) : null;
    console.assert(txUser?.id === txUserId, "transaction (commit): user must persist after commit");
    console.log("transaction commit:", txUser?.id);
}

async function runAllTests() {
    console.log("Starting DynamicRepository tests...\n");
    try {
        await cleanDatabase();
        const baseUser = await testUserBaseMethods();
        await testUserDynamicMethods();
        await testProductBaseMethods(baseUser.id);
        await testProductDynamicMethods(baseUser.id);
        await testRelations();
        await testRawInclude();
        await testTransactions();
        console.log("\nAll DynamicRepository tests passed!\n");
    } catch (err) {
        console.error("\nError during tests:", err);
        process.exit(1);
    }
}

runAllTests();
