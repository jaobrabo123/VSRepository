// Testes de implementação (comportamento em runtime) da API baseada em classes (DynamicRepository).
// Requer uma instância Postgres acessível via DATABASE_URL. Rode com `npm test` ou `npm run test:implementation`.

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { UserType } from "../../generated/prisma/enums";
import { ProductGetPayload, UserCreateInput, UserGetPayload } from "../../generated/prisma/models";
import {
    DynamicRepository,
    DynamicMethod,
    DynamicMethodOptions,
    PaginationModel,
    QueryMethod,
    QueryMethodArg,
} from "../../generated/vsrepo";
import prisma from "../../examples/prisma";

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
            defaultOrdering: [{ createdAt: "desc" }],
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
        injectOrdering: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
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

    @QueryMethod('select * from "user" where email = $1')
    declare findByEmail: (arg: QueryMethodArg<[email: string]>) => Promise<User[]>;

    @QueryMethod('update "user" set active = true where id = $1', { modifying: true })
    declare activateUser: (arg: QueryMethodArg<[id: string]>) => Promise<number>;
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
    const created = await createTestUser({ email: "base-save@example.com" });
    expect(!!created.id).toBe(true); // save (create): must return user with id

    const found = await userRepository.get(created.id);
    expect(found?.id === created.id).toBe(true); // get: must find user by id

    const foundOrThrow = await userRepository.getOrThrow(created.id);
    expect(foundOrThrow.id === created.id).toBe(true); // getOrThrow: must return without error

    created.name = "Updated Name";
    const updated = await userRepository.save(created);
    expect(updated.name === "Updated Name").toBe(true); // save (update): must update name

    const patched = await userRepository.patch(created.id, { name: "Patched Name" });
    expect(patched.name === "Patched Name").toBe(true); // patch: must apply partial update

    const exists = await userRepository.has(created.id);
    expect(exists === true).toBe(true); // has: must return true for existing id

    const notExists = await userRepository.has(crypto.randomUUID());
    expect(notExists === false).toBe(true); // has: must return false for non-existing id

    const count = await userRepository.total();
    expect(typeof count === "number" && count >= 1).toBe(true); // total: must return number >= 1

    const all = await userRepository.getAll();
    expect(Array.isArray(all) && all.length >= 1).toBe(true); // getAll: must return array with >= 1 item

    const paginated = await userRepository.getAll({ pagination: { skip: 0, take: 1 } });
    expect(paginated.length === 1).toBe(true); // getAll (paginated): must return exactly 1 item

    const toRemove = await createTestUser({ email: "remove@example.com" });
    const removed = await userRepository.remove(toRemove.id);
    expect(removed.id === toRemove.id).toBe(true); // remove: must return removed user
    const afterRemove = await userRepository.get(toRemove.id);
    expect(afterRemove === null).toBe(true); // remove: user should no longer exist

    const u1 = await createTestUser({ email: "removelist1@example.com" });
    const u2 = await createTestUser({ email: "removelist2@example.com" });
    const { count: removedCount } = await userRepository.removeList([u1.id, u2.id]);
    expect(removedCount === 2).toBe(true); // removeList: must remove 2 users

    return created;
}

async function testUserDynamicMethods() {
    const email = "dynamic@example.com";
    const adminEmail = "admin@corp.com";

    const user = await createTestUser({ email, userType: UserType.COMMON, likesVSRepo: true });
    const admin = await createTestUser({
        email: adminEmail,
        userType: UserType.ADMIN,
        likesVSRepo: false,
    });

    const byType = await userRepository.findByUserType(UserType.COMMON);
    expect(Array.isArray(byType) && byType.length >= 1).toBe(true); // findByUserType: must return list

    const byEmailAndType = await userRepository.findOneByEmailAndUserType(email, UserType.COMMON);
    expect(byEmailAndType?.id === user.id).toBe(true); // findOneByEmailAndUserType: must find correct user

    const byTypeOrEmail = await userRepository.findByUserTypeOrEmailEndsWith(
        UserType.ADMIN,
        "@corp.com",
    );
    expect(byTypeOrEmail.some(u => u.id === admin.id)).toBe(true); // findByUserTypeOrEmailEndsWith: must contain admin

    const likers = await userRepository.findByLikesVSRepoIsTruePaginated({ skip: 0, take: 10 });
    expect(Array.isArray(likers)).toBe(true); // findByLikesVSRepoIsTruePaginated: must return array
    expect(likers.every(u => u.likesVSRepo === true)).toBe(true); // findByLikesVSRepoIsTruePaginated: all must have likesVSRepo=true

    const distinctTypeAndLikes = await userRepository.findManyDistinctUserTypeAndLikesVSRepo();
    expect(Array.isArray(distinctTypeAndLikes)).toBe(true); // findManyDistinctUserTypeAndLikesVSRepo: must return array
    const uniqueCombos = new Set(distinctTypeAndLikes.map(u => `${u.userType}-${u.likesVSRepo}`));
    expect(uniqueCombos.size === distinctTypeAndLikes.length).toBe(true); // findManyDistinctUserTypeAndLikesVSRepo: no duplicate combos
    expect(
        distinctTypeAndLikes.some(u => u.userType === UserType.COMMON && u.likesVSRepo === true) &&
            distinctTypeAndLikes.some(
                u => u.userType === UserType.ADMIN && u.likesVSRepo === false,
            ),
    ).toBe(true); // findManyDistinctUserTypeAndLikesVSRepo: must contain (COMMON,true) and (ADMIN,false)

    const distinctTypePaginated = await userRepository.findManyDistinctUserTypePaginated({
        skip: 0,
        take: 10,
    });
    expect(Array.isArray(distinctTypePaginated)).toBe(true); // findManyDistinctUserTypePaginated: must return array
    const uniqueTypes = new Set(distinctTypePaginated.map(u => u.userType));
    expect(uniqueTypes.size === distinctTypePaginated.length).toBe(true); // findManyDistinctUserTypePaginated: no duplicate userType
    expect(uniqueTypes.has(UserType.COMMON) && uniqueTypes.has(UserType.ADMIN)).toBe(true); // findManyDistinctUserTypePaginated: must contain COMMON and ADMIN

    const distinctByLikes = await userRepository.findManyByLikesVSRepoDistinctUserType(true);
    expect(Array.isArray(distinctByLikes)).toBe(true); // findManyByLikesVSRepoDistinctUserType: must return array
    expect(distinctByLikes.every(u => u.likesVSRepo === true)).toBe(true); // findManyByLikesVSRepoDistinctUserType: all must have likesVSRepo=true
    const uniqueTypesFiltered = new Set(distinctByLikes.map(u => u.userType));
    expect(uniqueTypesFiltered.size === distinctByLikes.length).toBe(true); // findManyByLikesVSRepoDistinctUserType: no duplicate userType

    const paias = await userRepository.buscarUsuariosPaias();
    expect(Array.isArray(paias)).toBe(true); // buscarUsuariosPaias: must return array
    expect(paias.every(u => u.likesVSRepo === false)).toBe(true); // buscarUsuariosPaias: all must have likesVSRepo=false

    const internal = await userRepository.findInternalByEmail(email);
    expect(internal?.id === user.id).toBe(true); // findInternalByEmail: must return correct user

    const emailExists = await userRepository.existsByEmail(email);
    expect(emailExists === true).toBe(true); // existsByEmail: must return true for existing email
    const emailNotExists = await userRepository.existsByEmail("naoexiste@nada.com");
    expect(emailNotExists === false).toBe(true); // existsByEmail: must return false for non-existing email

    const admins = await userRepository.findAdmins();
    expect(admins.every(u => u.userType === UserType.ADMIN)).toBe(true); // findAdmins: all must be ADMIN

    const withCountry = await userRepository.findByAddressWithCountry("BR");
    expect(Array.isArray(withCountry)).toBe(true); // findByAddressWithCountry: must return array

    const withoutAddress = await userRepository.findByAddressWithout();
    expect(Array.isArray(withoutAddress)).toBe(true); // findByAddressWithout: must return array

    const withProducts = await userRepository.findByProductsSome();
    expect(Array.isArray(withProducts)).toBe(true); // findByProductsSome: must return array

    const withoutProducts = await userRepository.findByProductsNone();
    expect(Array.isArray(withoutProducts)).toBe(true); // findByProductsNone: must return array
    expect(withoutProducts.some(u => u.id === user.id)).toBe(true); // findByProductsNone: user without product should appear

    const byName = await userRepository.findByNameContainsInsensitiveOrderedAndPaginated(
        "test",
        { name: "asc" },
        { skip: 0, take: 5 },
    );
    expect(Array.isArray(byName)).toBe(true); // findByNameContainsInsensitiveOrderedAndPaginated: must return array

    const uniqueEmail = await userRepository.findUniqueByEmail(email);
    expect(uniqueEmail?.id === user.id).toBe(true); // findUniqueByEmail: must return correct user

    const uniqueOrThrow = await userRepository.findUniqueOrThrowById(user.id);
    expect(uniqueOrThrow.id === user.id).toBe(true); // findUniqueOrThrowById: must return without error

    const firstByName = await userRepository.findFirstByNameStartsWith("Test");
    expect(firstByName !== null).toBe(true); // findFirstByNameStartsWith: must find at least 1 user

    const firstOrThrow = await userRepository.findFirstOrThrowByIdOrEmail(user.id, email);
    expect(firstOrThrow.id === user.id).toBe(true); // findFirstOrThrowByIdOrEmail: must return correct user

    const countUsers = await userRepository.countByUserType(UserType.COMMON);
    expect(typeof countUsers === "number" && countUsers >= 1).toBe(true); // countByUserType: must return number >= 1

    const withName = await userRepository.findManyByNameOptional("Test User");
    const withoutName = await userRepository.findManyByNameOptional(undefined);
    expect(Array.isArray(withName)).toBe(true); // findManyByNameOptional (with name): must return array
    expect(Array.isArray(withoutName)).toBe(true); // findManyByNameOptional (without name): must return array

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
    expect(Array.isArray(manyCreated) && manyCreated.length === 2).toBe(true); // createManyAndReturn: must return 2 users

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
    expect(typeof skipResult.count === "number").toBe(true); // createManySkipDuplicates: must return { count }

    const directCreated = await userRepository.create({
        name: "Direct Create",
        email: "direct@ex.com",
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
    });
    expect(!!directCreated.id).toBe(true); // create: must return user with id

    const updatedMany = await userRepository.updateManyAndReturnByUserType(UserType.COMMON, {
        likesVSRepo: true,
    });
    expect(Array.isArray(updatedMany)).toBe(true); // updateManyAndReturnByUserType: must return array

    const updateWhere = await userRepository.updateManyWhere(
        { userType: UserType.COMMON },
        { likesVSRepo: true },
    );
    expect(typeof updateWhere.count === "number").toBe(true); // updateManyWhere: must return { count }

    const updatedById = await userRepository.updateById(user.id, { name: "Updated By Id" });
    expect(updatedById.name === "Updated By Id").toBe(true); // updateById: must update name

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
    expect(upserted.id === user.id).toBe(true); // upsertByEmail: must upsert existing user

    const toDelete = await createTestUser({ email: "del@ex.com" });
    const deleteResult = await userRepository.deleteManyByIdIn([toDelete.id]);
    expect(typeof deleteResult.count === "number").toBe(true); // deleteManyByIdIn: must return { count }

    const toDeleteOne = await createTestUser({ email: "delone@ex.com" });
    const deletedOne = await userRepository.deleteById(toDeleteOne.id);
    expect(deletedOne.id === toDeleteOne.id).toBe(true); // deleteById: must return removed id

    const aggregated = await userRepository.aggregate({
        _count: { _all: true },
        _min: { createdAt: true },
    });
    expect(typeof aggregated._count._all === "number").toBe(true); // aggregate: must return _count._all as number

    const grouped: any[] = await userRepository.groupBy({
        by: ["userType"],
        _count: { userType: true },
    });
    expect(Array.isArray(grouped)).toBe(true); // groupBy: must return array
    expect(grouped.every(g => g._count.userType >= 0)).toBe(true); // groupBy: each group must have _count.userType

    return { user, admin };
}

async function testProductBaseMethods(userId: string) {
    const product = await createTestProduct(userId, { name: "Base Product", price: 50 });
    expect(!!product.id).toBe(true); // save (create): must create product with id

    const found = await productRepository.get(product.id);
    expect(found?.id === product.id).toBe(true); // get: must find product

    const foundOrThrow = await productRepository.getOrThrow(product.id);
    expect(foundOrThrow.id === product.id).toBe(true); // getOrThrow: must return without error

    product.name = "Base Product Updated";
    const { user, ...prod } = product;
    const prodResolved = { ...prod, userId: user.id };
    const updated = await productRepository.save(prodResolved);
    expect(updated.name === "Base Product Updated").toBe(true); // save (update): must update name

    const patched = await productRepository.patch(product.id, { price: 200 });
    expect(patched.price.toNumber() === 200).toBe(true); // patch: must update price

    const has = await productRepository.has(product.id);
    expect(has === true).toBe(true); // has: must return true

    const total = await productRepository.total();
    expect(total >= 1).toBe(true); // total: must be >= 1

    const all = await productRepository.getAll();
    expect(all.length >= 1).toBe(true); // getAll: must have at least 1 product

    const p1 = await createTestProduct(userId, { name: "RL1", price: 10 });
    const p2 = await createTestProduct(userId, { name: "RL2", price: 20 });
    const { count } = await productRepository.removeList([p1.id, p2.id]);
    expect(count === 2).toBe(true); // removeList: must return count=2

    return product;
}

async function testProductDynamicMethods(userId: string) {
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
    expect(byName.some(p => p.id === product.id)).toBe(true); // findByNameStartsWithInsensitive: must find Dynamic Widget

    const cheap = await productRepository.findByPriceLessThan(50);
    expect(cheap.some(p => p.id === cheapProduct.id)).toBe(true); // findByPriceLessThan: must contain cheap product

    const inRange = await productRepository.findByPriceBetween([100, 200]);
    expect(inRange.some(p => p.id === product.id)).toBe(true); // findByPriceBetween: must contain Dynamic Widget

    const noDescription = await productRepository.findByDescriptionIsNull();
    expect(noDescription.some(p => p.id === cheapProduct.id)).toBe(true); // findByDescriptionIsNull: must contain product without description

    const byTag = await productRepository.findByTagsSomeName("electronics");
    expect(byTag.some(p => p.id === product.id)).toBe(true); // findByTagsSomeName: must find product with tag electronics

    const userEntity = await userRepository.getOrThrow(userId);
    const byUserEmail = await productRepository.findByUserWithEmail(userEntity.email);
    expect(byUserEmail.some(p => p.id === product.id)).toBe(true); // findByUserWithEmail: must find product of user

    const byUserId = await productRepository.findByUserId(userId);
    expect(byUserId.some(p => p.id === product.id)).toBe(true); // findByUserId: must find products of user

    const byIds = await productRepository.findByIdIn([product.id, cheapProduct.id]);
    expect(byIds.length === 2).toBe(true); // findByIdIn: must return exactly 2 products
}

async function testRelations() {
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
    expect(loaded.address !== undefined).toBe(true); // save with address (oto): must save address

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
    expect(Array.isArray(loadedWithProds.products)).toBe(true); // save with products (otm): must have products list

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
    expect(loadedProduct.user?.id === relUser.id).toBe(true); // save product with user (mto): must link user
    expect(Array.isArray(loadedProduct.tags) && loadedProduct.tags.length === 2).toBe(true); // save product with tags (mtm): must save 2 tags
}

async function testRawInclude() {
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
    expect(userWithAddress.address?.city === "Rio de Janeiro").toBe(true); // include literal (address): must return address
    expect(userWithAddress.products === undefined).toBe(true); // include literal (address): must not return products

    const userFull = await userRepository.getOrThrow(user.id, {
        include: { address: true, products: { include: { tags: true } } },
    });
    expect(userFull.address !== undefined).toBe(true); // include literal (full): must return address
    expect(Array.isArray(userFull.products) && userFull.products.length === 2).toBe(true); // include literal (full): must return 2 products
    expect(userFull.products.every(p => Array.isArray((p as any).tags))).toBe(true); // include literal (full): each product must have tags (array)

    const allWithProducts = await userRepository.getAll({ include: { products: true } });
    const foundInAll = allWithProducts.find(u => u.id === user.id);
    expect(Array.isArray(foundInAll?.products)).toBe(true); // include literal in getAll: must return products for all items
}

async function testRawSelect() {

    const user = await userRepository.save({
        name: "Raw Select User",
        email: `rawselect-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: { city: "Rio de Janeiro", state: "RJ", country: "BR" },
        products: [{ name: "Raw Selected Product 1", price: 150 }],
    });

    const userIdAndName = await userRepository.getOrThrow(user.id, {
        select: { id: true, name: true },
    });
    expect(userIdAndName.id === user.id).toBe(true); // select cru (id, name): must return id
    expect(userIdAndName.name === "Raw Select User").toBe(true); // select cru (id, name): must return name
    // Diferente do setupVSRepo, o DynamicRepository não estreita o tipo de retorno a
    // partir de `select`, mas em runtime o Prisma respeita o select — só os campos
    // pedidos vêm preenchidos.
    expect((userIdAndName as any).email === undefined).toBe(true); // select cru (id, name): must not return email

    const userWithAddressSelected = await userRepository.getOrThrow(user.id, {
        select: { id: true, address: { select: { city: true } } },
    });
    expect(userWithAddressSelected.address?.city === "Rio de Janeiro").toBe(true); // select cru com relação: must return only the requested relation field
    expect((userWithAddressSelected.address as any)?.state === undefined).toBe(true); // select cru com relação: must not return unrequested relation fields

    const allSelected = await userRepository.getAll({
        select: { id: true, email: true },
    });
    const foundInAll = allSelected.find(u => u.id === user.id);
    expect((foundInAll as any)?.email === user.email).toBe(true); // select cru em getAll: must apply select to every item
    expect((foundInAll as any)?.name === undefined).toBe(true); // select cru em getAll: must not return fields outside the select
}

async function testTransactions() {
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
        expect(shouldNotExist === null).toBe(true); // transaction (rollback): user must not persist after rollback
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
    expect(txUser?.id === txUserId).toBe(true); // transaction (commit): user must persist after commit
}

async function testQueryMethods() {
    // findByEmail — raw SELECT com parâmetro posicional
    const user = await userRepository.save({
        name: "Query Test User",
        email: "querytest@ex.com",
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
    });

    const foundByEmail = await userRepository.findByEmail({
        args: ["querytest@ex.com"],
    });
    expect(Array.isArray(foundByEmail)).toBe(true); // findByEmail: must return array
    expect(foundByEmail.some(u => u.id === user.id)).toBe(true); // findByEmail: must contain the user with matching email

    // findByEmail com email inexistente
    const noEmail = await userRepository.findByEmail({
        args: ["nonexistent@ex.com"],
    });
    expect(Array.isArray(noEmail) && noEmail.length === 0).toBe(true); // findByEmail (nonexistent): must return empty array

    // activateUser — raw UPDATE (modifying query)
    // Primeiro desativar o usuário
    await userRepository.patch(user.id, { active: false });

    const activateCount = await userRepository.activateUser({
        args: [user.id],
    });
    expect(typeof activateCount === "number").toBe(true); // activateUser: must return number (affected rows)
    expect(activateCount === 1).toBe(true); // activateUser: must affect 1 row

    // Verificar que o usuário foi reativado
    const reactivated = await userRepository.findInternalByEmail("querytest@ex.com");
    expect(reactivated !== null).toBe(true); // activateUser: user must be findable after reactivation

    // activateUser com id inexistente
    const zeroActivate = await userRepository.activateUser({
        args: [crypto.randomUUID()],
    });
    expect(zeroActivate === 0).toBe(true); // activateUser (fake id): must affect 0 rows

    // Query method com db (transaction) — rollback
    await userRepository.prisma
        .$transaction(async tx => {
            const txFound = await userRepository.findByEmail({
                args: ["querytest@ex.com"],
                db: tx,
            });
            expect(Array.isArray(txFound)).toBe(true); // findByEmail (tx): must return array inside transaction

            const txActivate = await userRepository.activateUser({
                args: [user.id],
                db: tx,
            });
            expect(typeof txActivate === "number").toBe(true); // activateUser (tx): must return number inside transaction

            throw new Error("forced rollback for query method test");
        })
        .catch(() => {});
}

describe("VSRepository — API baseada em classes (DynamicRepository)", () => {
    let baseUser: Awaited<ReturnType<typeof testUserBaseMethods>>;

    beforeAll(async () => {
        await cleanDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("user — métodos base", async () => {
        baseUser = await testUserBaseMethods();
    });

    it("user — métodos dinâmicos", async () => {
        await testUserDynamicMethods();
    });

    it("product — métodos base", async () => {
        await testProductBaseMethods(baseUser.id);
    });

    it("product — métodos dinâmicos", async () => {
        await testProductDynamicMethods(baseUser.id);
    });

    it("relations", async () => {
        await testRelations();
    });

    it("raw include (options.include)", async () => {
        await testRawInclude();
    });

    it("raw select (options.select)", async () => {
        await testRawSelect();
    });

    it("transactions", async () => {
        await testTransactions();
    });

    it("query methods", async () => {
        await testQueryMethods();
    });
});
