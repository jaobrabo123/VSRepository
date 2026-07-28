// Testes de implementação (comportamento em runtime) da API funcional (setupVSRepo).
// Requer uma instância Postgres acessível via DATABASE_URL. Rode com `npm test` ou `npm run test:implementation`.

import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { UserType } from "@vsrepo/prisma/types";
import { ProductGetPayload, UserCreateInput, UserGetPayload } from "../../generated/prisma/models";
import { SaveObject, setupVSRepo } from "../../generated/vsrepo";
import prisma from "../../examples/prisma";

type User = UserGetPayload<{
    include: {
        address: true;
        products: true;
    };
}>;

const userVSRepo = setupVSRepo<User, "User">()({
    tableName: "user",
    pkName: "id",
    requiredWhere: {
        active: true,
    },

    includeModels: {
        withAddress: {
            address: true,
        },
        withProducts: {
            products: true,
        },
        full: {
            address: true,
            products: {
                include: { tags: true },
            },
        },
    },

    selectModels: {
        public: {
            id: true,
            name: true,
            email: true,
            userType: true,
            likesVSRepo: true,
            createdAt: true,
            updatedAt: true,
            address: true,
            products: {
                include: { tags: true },
            },
        },

        internal: {
            id: true,
            name: true,
            email: true,
            userType: true,
            likesVSRepo: true,
            createdAt: true,
            updatedAt: true,
            active: true,
            password: true,
        },

        minimal: {
            id: true,
        },
    },
    defaultSelectModel: "public",

    relations: {
        address: {
            mode: "oto",

            pk: "id",

            restriction: "set",
        },

        products: {
            mode: "otm",
            pk: "id",

            restriction: "add",
        },
    },

    defaultOrdering: [{ createdAt: "desc" }],

    methods: {
        findByUserType: { map: true },

        findOneByEmailAndUserType: { map: true },

        findByUserTypeOrEmailEndsWith: { map: true },

        findByLikesVSRepoIsTruePaginated: { map: true },

        // --- Distinct ---
        findManyDistinctUserTypeAndLikesVSRepo: { map: true },
        findManyDistinctUserTypePaginated: { map: true },
        findManyByLikesVSRepoDistinctUserType: { map: true },

        buscarUsuariosPaias: { map: true, proxyTo: "findByLikesVSRepoIsFalse" },

        findInternalByEmail: {
            map: true,
            proxyTo: "findOneByEmail",
            whereType: "overwrite",
            selectModel: "internal",
        },

        existsByEmail: { map: true },

        findAdmins: {
            map: true,
            proxyTo: "findBy",
            pushWhere: {
                userType: UserType.ADMIN,
            },
        },

        findByAddressWithCountry: {
            map: true,

            injectOrdering: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
        },

        findByAddressWithout: { map: true },
        findByNameContainsInsensitiveOrderedAndPaginated: { map: true },
        findByProductsSome: { map: true },
        findByProductsNone: { map: true },
        findUniqueByEmail: { map: true },
        findUniqueOrThrowById: { map: true },
        findFirstByNameStartsWith: { map: true },
        findFirstOrThrowByIdOrEmail: { map: true },
        countByUserType: { map: true },
        findManyByNameOptional: { map: true },
        createManyAndReturn: { map: true },
        createManySkipDuplicates: { map: true },
        create: { map: true },
        updateManyAndReturnByUserType: { map: true },
        updateManyWhere: { map: true },
        updateById: { map: true },
        upsertByEmail: { map: true },
        deleteManyByIdIn: { map: true, whereType: "overwrite", selectModel: "minimal" },
        deleteManyWhere: { map: true, whereType: "overwrite" },
        deleteById: { map: true, selectModel: "minimal" },
        aggregate: { map: true },
        groupBy: { map: true },

        findActiveUsersByCountryRaw: {
            map: true,
            query: {
                value: 'SELECT u.* FROM "user" u JOIN "address" a ON a."user_id" = u.id WHERE u.active = $1 AND a.country = $2',
            },
        },

        deactivateUsersWithoutProductsRaw: {
            map: true,
            query: {
                value: 'UPDATE "user" SET active = false WHERE id NOT IN (SELECT DISTINCT "user_id" FROM "product")',
                modifying: true,
            },
        },
    },
});

type UserSaveObj = SaveObject<UserCreateInput, typeof userVSRepo>;

export const userRepository = userVSRepo.build(prisma, {
    showWorking: false,
    baseMethods: {
        remove: {
            defaultSelect: "minimal",
        },
        getOrThrow: {
            ignoreRequiredWhere: true,
        },
        save: {
            ignoreRequiredWhere: true,
        },
    },
});

type Product = ProductGetPayload<{
    include: {
        tags: true;
        user: true;
    };
}>;

const productVSRepo = setupVSRepo<Product, "Product">()({
    tableName: "product",
    pkName: "id",
    softRemovekName: "deletedAt",

    selectModels: {
        public: {
            id: true,
            description: true,
            name: true,
            price: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            tags: true,
            user: {
                select: {
                    id: true,
                    name: true,
                    userType: true,
                    likesVSRepo: true,
                },
            },
        },
        publicWithoutUser: {
            id: true,
            description: true,
            name: true,
            price: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
            tags: true,
            userId: true,
        },
    },
    defaultSelectModel: "public",

    requiredWhere: { user: { is: { active: true } } },

    relations: {
        user: {
            mode: "mto",
            pk: "id",
            restriction: "add",
            nullable: false,
        },
        tags: {
            mode: "mtm",
            pk: "name",
            restriction: "set",
        },
    },

    methods: {
        findByNameStartsWithInsensitive: { map: true },

        findByPriceLessThan: { map: true },

        findByPriceBetween: { map: true },

        findByDescriptionIsNull: { map: true },

        findByTagsSomeName: { map: true },

        findByUserWithEmail: { map: true },

        findByUserId: { map: true },

        findByIdIn: { map: true },

        deleteManyWhere: { map: true },

        findExpensiveProductsRaw: {
            map: true,
            query: {
                value: 'SELECT * FROM "product" WHERE price > $1 AND "deleted_at" IS NULL',
            },
        },

        countProductsByUserRaw: {
            map: true,
            query: {
                value: 'SELECT COUNT(*)::int as count FROM "product" WHERE "user_id" = $1 AND "deleted_at" IS NULL',
            },
        },
    },
});

export const productRepository = productVSRepo.build(prisma, {
    baseMethods: { removeList: { ignoreRequiredWhere: true } },
});

// =============================================================================
// HELPERS
// =============================================================================

async function cleanDatabase() {
    await productRepository.deleteManyWhere({}).catch(console.error);
    await userRepository.deleteManyWhere({}).catch(console.error);
}

async function createTestUser(overrides: Record<string, unknown> = {}) {
    return userRepository.save(
        {
            name: "Test User",
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password: "secret123",
            userType: UserType.COMMON,
            likesVSRepo: true,
            active: true,
            ...overrides,
        },
        { selectModel: "internal" },
    );
}

async function createTestProduct(userId: string, overrides: Record<string, unknown> = {}) {
    return productRepository.save({
        name: "Test Product",
        description: "A test product",
        price: 99.9,
        userId,
        ...overrides,
    });
}

// =============================================================================
// USER REPOSITORY — MÉTODOS BASE
// =============================================================================

async function testUserBaseMethods() {
    // save (create)
    const created = await createTestUser({ email: "base-save@example.com" });
    expect(!!created.id).toBe(true); // save (create): deve retornar o usuário criado com id

    // get
    const found = await userRepository.get(created.id);
    expect(found?.id === created.id).toBe(true); // get: deve encontrar o usuário pelo id

    // getOrThrow
    const foundOrThrow = await userRepository.getOrThrow(created.id);
    expect(foundOrThrow.id === created.id).toBe(true); // getOrThrow: deve retornar o usuário sem lançar erro

    // save (update via upsert com pk)
    created.name = "Updated Name";
    const updated = await userRepository.save(created);
    expect(updated.name === "Updated Name").toBe(true); // save (update): deve atualizar o nome

    // patch
    const patched = await userRepository.patch(created.id, { name: "Patched Name" });
    expect(patched.name === "Patched Name").toBe(true); // patch: deve aplicar atualização parcial

    // has
    const exists = await userRepository.has(created.id);
    expect(exists === true).toBe(true); // has: deve retornar true para id existente

    const notExists = await userRepository.has(crypto.randomUUID());
    expect(notExists === false).toBe(true); // has: deve retornar false para id inexistente

    // total
    const count = await userRepository.total();
    expect(typeof count === "number" && count >= 1).toBe(true); // total: deve retornar número >= 1

    // getAll
    const all = await userRepository.getAll();
    expect(Array.isArray(all) && all.length >= 1).toBe(true); // getAll: deve retornar array com ao menos 1 item

    // getAll com paginação
    const paginated = await userRepository.getAll({ pagination: { skip: 0, take: 1 } });
    expect(paginated.length === 1).toBe(true); // getAll (paginado): deve retornar exatamente 1 item

    // getAll com selectModel específico
    const minimal = await userRepository.getAll({ selectModel: "minimal" });
    expect(minimal.every(u => Object.keys(u).join(",") === "id")).toBe(true); // getAll (selectModel minimal): deve retornar só o id

    // remove
    const toRemove = await createTestUser({ email: "remove@example.com" });
    const removed = await userRepository.remove(toRemove.id);
    expect(removed.id === toRemove.id).toBe(true); // remove: deve retornar o usuário removido
    const afterRemove = await userRepository.get(toRemove.id);
    expect(afterRemove === null).toBe(true); // remove: usuário não deve mais existir (ou active=false bloqueia requiredWhere)

    // removeList
    const u1 = await createTestUser({ email: "removelist1@example.com" });
    const u2 = await createTestUser({ email: "removelist2@example.com" });
    const { count: removedCount } = await userRepository.removeList([u1.id, u2.id]);
    expect(removedCount === 2).toBe(true); // removeList: deve remover 2 usuários

    return created;
}

// =============================================================================
// USER REPOSITORY — MÉTODOS DINÂMICOS
// =============================================================================

async function testUserDynamicMethods() {
    const email = `dynamic-${Date.now()}@example.com`;
    const adminEmail = `admin-${Date.now()}@corp.com`;

    const user = await createTestUser({ email, userType: UserType.COMMON, likesVSRepo: true });
    const admin = await createTestUser({
        email: adminEmail,
        userType: UserType.ADMIN,
        likesVSRepo: false,
    });

    // findByUserType
    const byType = await userRepository.findByUserType(UserType.COMMON);
    expect(Array.isArray(byType) && byType.length >= 1).toBe(true); // findByUserType: deve retornar lista

    // findOneByEmailAndUserType
    const byEmailAndType = await userRepository.findOneByEmailAndUserType(email, UserType.COMMON);
    expect(byEmailAndType?.id === user.id).toBe(true); // findOneByEmailAndUserType: deve encontrar o usuário certo

    // findByUserTypeOrEmailEndsWith
    const byTypeOrEmail = await userRepository.findByUserTypeOrEmailEndsWith(
        UserType.ADMIN,
        "@corp.com",
    );
    expect(byTypeOrEmail.some(u => u.id === admin.id)).toBe(true); // findByUserTypeOrEmailEndsWith: deve conter o admin

    // findByLikesVSRepoIsTruePaginated
    const likers = await userRepository.findByLikesVSRepoIsTruePaginated({ skip: 0, take: 10 });
    expect(Array.isArray(likers)).toBe(true); // findByLikesVSRepoIsTruePaginated: deve retornar array
    expect(likers.every(u => u.likesVSRepo === true)).toBe(true); // findByLikesVSRepoIsTruePaginated: todos devem ter likesVSRepo=true

    // --- Distinct ---
    // Neste ponto existem pelo menos 2 combinações distintas de (userType, likesVSRepo):
    // (COMMON, true) — vindo de "created" (testUserBaseMethods) e "user" (COMMON, true)
    // (ADMIN, false) — vindo de "admin" (ADMIN, false)

    // findManyDistinctUserTypeAndLikesVSRepo — sem filtro de campo, só distinct em 2 colunas
    const distinctTypeAndLikes = await userRepository.findManyDistinctUserTypeAndLikesVSRepo();
    expect(Array.isArray(distinctTypeAndLikes)).toBe(true); // findManyDistinctUserTypeAndLikesVSRepo: deve retornar array
    const uniqueCombos = new Set(distinctTypeAndLikes.map(u => `${u.userType}-${u.likesVSRepo}`));
    expect(uniqueCombos.size === distinctTypeAndLikes.length).toBe(true); // findManyDistinctUserTypeAndLikesVSRepo: não deve haver combinações (userType, likesVSRepo) repetidas
    expect(
        distinctTypeAndLikes.some(u => u.userType === UserType.COMMON && u.likesVSRepo === true) &&
            distinctTypeAndLikes.some(
                u => u.userType === UserType.ADMIN && u.likesVSRepo === false,
            ),
    ).toBe(true); // findManyDistinctUserTypeAndLikesVSRepo: deve conter as combinações (COMMON,true) e (ADMIN,false)

    // findManyDistinctUserTypePaginated — distinct combinado com o sufixo Paginated
    const distinctTypePaginated = await userRepository.findManyDistinctUserTypePaginated({
        skip: 0,
        take: 10,
    });
    expect(Array.isArray(distinctTypePaginated)).toBe(true); // findManyDistinctUserTypePaginated: deve retornar array
    const uniqueTypes = new Set(distinctTypePaginated.map(u => u.userType));
    expect(uniqueTypes.size === distinctTypePaginated.length).toBe(true); // findManyDistinctUserTypePaginated: não deve haver userType repetido
    expect(uniqueTypes.has(UserType.COMMON) && uniqueTypes.has(UserType.ADMIN)).toBe(true); // findManyDistinctUserTypePaginated: deve conter COMMON e ADMIN

    // findManyByLikesVSRepoDistinctUserType — filtro de campo (likesVSRepo) combinado com Distinct (userType)
    const distinctByLikes = await userRepository.findManyByLikesVSRepoDistinctUserType(true);
    expect(Array.isArray(distinctByLikes)).toBe(true); // findManyByLikesVSRepoDistinctUserType: deve retornar array
    expect(distinctByLikes.every(u => u.likesVSRepo === true)).toBe(true); // findManyByLikesVSRepoDistinctUserType: todos devem ter likesVSRepo=true
    const uniqueTypesFiltered = new Set(distinctByLikes.map(u => u.userType));
    expect(uniqueTypesFiltered.size === distinctByLikes.length).toBe(true); // findManyByLikesVSRepoDistinctUserType: não deve haver userType repetido

    // buscarUsuariosPaias (proxy de findByLikesVSRepoIsFalse)
    const paias = await userRepository.buscarUsuariosPaias();
    expect(Array.isArray(paias)).toBe(true); // buscarUsuariosPaias: deve retornar array
    expect(paias.every(u => u.likesVSRepo === false)).toBe(true); // buscarUsuariosPaias: todos devem ter likesVSRepo=false

    // findInternalByEmail (selectModel internal, whereType overwrite)
    const internal = await userRepository.findInternalByEmail(email);
    expect(internal?.password !== undefined).toBe(true); // findInternalByEmail: deve retornar campo password (select internal)

    // existsByEmail
    const emailExists = await userRepository.existsByEmail(email);
    expect(emailExists === true).toBe(true); // existsByEmail: deve retornar true para email existente
    const emailNotExists = await userRepository.existsByEmail("naoexiste@nada.com");
    expect(emailNotExists === false).toBe(true); // existsByEmail: deve retornar false para email inexistente

    // findAdmins (pushWhere userType=ADMIN)
    const admins = await userRepository.findAdmins();
    expect(admins.every(u => u.userType === UserType.ADMIN)).toBe(true); // findAdmins: todos devem ser ADMIN

    // findByAddressWithCountry (sem address relacionado, retorno pode ser vazio — só validar que roda)
    const withCountry = await userRepository.findByAddressWithCountry("BR");
    expect(Array.isArray(withCountry)).toBe(true); // findByAddressWithCountry: deve retornar array

    // findByNameContainsInsensitiveOrderedAndPaginated
    const byName = await userRepository.findByNameContainsInsensitiveOrderedAndPaginated(
        "test",
        { name: "asc" },
        { skip: 0, take: 5 },
    );
    expect(Array.isArray(byName)).toBe(true); // findByNameContainsInsensitiveOrderedAndPaginated: deve retornar array

    // findByProductsSome — usuários com ao menos 1 produto
    const withProducts = await userRepository.findByProductsSome();
    expect(Array.isArray(withProducts)).toBe(true); // findByProductsSome: deve retornar array

    // findByProductsNone — usuários sem produtos
    const withoutProducts = await userRepository.findByProductsNone();
    expect(Array.isArray(withoutProducts)).toBe(true); // findByProductsNone: deve retornar array
    expect(withoutProducts.some(u => u.id === user.id)).toBe(true); // findByProductsNone: usuário sem produto deve aparecer

    // findUniqueByEmail
    const unique = await userRepository.findUniqueByEmail(email);
    expect(unique?.id === user.id).toBe(true); // findUniqueByEmail: deve retornar o usuário correto

    // findUniqueOrThrowById
    const uniqueOrThrow = await userRepository.findUniqueOrThrowById(user.id);
    expect(uniqueOrThrow.id === user.id).toBe(true); // findUniqueOrThrowById: deve retornar sem lançar erro

    // findFirstByNameStartsWith
    const firstByName = await userRepository.findFirstByNameStartsWith("Test");
    expect(firstByName !== null).toBe(true); // findFirstByNameStartsWith: deve encontrar ao menos 1 usuário

    // findFirstOrThrowByIdOrEmail
    const firstOrThrow = await userRepository.findFirstOrThrowByIdOrEmail(user.id, email);
    expect(firstOrThrow.id === user.id).toBe(true); // findFirstOrThrowByIdOrEmail: deve retornar o usuário correto

    // countByUserType
    const countUsers = await userRepository.countByUserType(UserType.COMMON);
    expect(typeof countUsers === "number" && countUsers >= 1).toBe(true); // countByUserType: deve retornar número >= 1

    // findManyByNameOptional (nome é opcional)
    const withName = await userRepository.findManyByNameOptional("Test User");
    const withoutName = await userRepository.findManyByNameOptional(undefined);
    expect(Array.isArray(withName)).toBe(true); // findManyByNameOptional (com nome): deve retornar array
    expect(Array.isArray(withoutName)).toBe(true); // findManyByNameOptional (sem nome): deve retornar array

    const emailMock = "123@email.com";

    // createManyAndReturn
    const manyCreated = await userRepository.createManyAndReturn(
        [
            {
                name: "Batch 1",
                email: `batch1-${Date.now()}@ex.com`,
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
        ],
        { selectModel: "internal" },
    );
    expect(Array.isArray(manyCreated) && manyCreated.length === 2).toBe(true); // createManyAndReturn: deve retornar 2 usuários

    // createManySkipDuplicates
    const skipResult = await userRepository.createManySkipDuplicates([
        {
            name: "Skip 1",
            email: `skip-${Date.now()}@ex.com`,
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
    expect(typeof skipResult.count === "number").toBe(true); // createManySkipDuplicates: deve retornar { count }

    // create
    const directCreated = await userRepository.create({
        name: "Direct Create",
        email: `direct-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
    });
    expect(!!directCreated.id).toBe(true); // create: deve retornar usuário com id

    // updateManyAndReturnByUserType
    const updatedMany = await userRepository.updateManyAndReturnByUserType(
        UserType.COMMON,
        { likesVSRepo: true },
        { selectModel: "internal" },
    );
    expect(Array.isArray(updatedMany)).toBe(true); // updateManyAndReturnByUserType: deve retornar array

    // updateManyWhere
    const updateWhere = await userRepository.updateManyWhere(
        { userType: UserType.COMMON },
        { likesVSRepo: true },
    );
    expect(typeof updateWhere.count === "number").toBe(true); // updateManyWhere: deve retornar { count }

    // updateById
    const updatedById = await userRepository.updateById(user.id, { name: "Updated By Id" });
    expect(updatedById.name === "Updated By Id").toBe(true); // updateById: deve atualizar o nome

    // upsertByEmail
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
    expect(upserted.id === user.id).toBe(true); // upsertByEmail: deve fazer upsert no usuário existente

    // deleteManyByIdIn (whereType overwrite)
    const toDelete = await createTestUser({ email: `del-${Date.now()}@ex.com` });
    const deleteResult = await userRepository.deleteManyByIdIn([toDelete.id]);
    expect(typeof deleteResult.count === "number").toBe(true); // deleteManyByIdIn: deve retornar { count }

    // deleteById
    const toDeleteOne = await createTestUser({ email: `delone-${Date.now()}@ex.com` });
    const deletedOne = await userRepository.deleteById(toDeleteOne.id);
    expect(deletedOne.id === toDeleteOne.id).toBe(true); // deleteById: deve retornar o id removido

    // aggregate
    const aggregated = await userRepository.aggregate({
        _count: { _all: true },
        _min: { createdAt: true },
    });
    expect(typeof aggregated._count._all === "number").toBe(true); // aggregate: deve retornar _count._all como número

    // groupBy
    const grouped = await userRepository.groupBy({
        by: ["userType"],
        _count: { userType: true },
    });
    expect(Array.isArray(grouped)).toBe(true); // groupBy: deve retornar array
    expect(grouped.every(g => g._count.userType >= 0)).toBe(true); // groupBy: cada grupo deve ter _count.userType

    // findByAddressWithout (usuários sem address)
    const withoutAddress = await userRepository.findByAddressWithout();
    expect(Array.isArray(withoutAddress)).toBe(true); // findByAddressWithout: deve retornar array

    return { user, admin };
}

// =============================================================================
// PRODUCT REPOSITORY — MÉTODOS BASE
// =============================================================================

async function testProductBaseMethods(userId: string) {
    // save (create)
    const product = await createTestProduct(userId, { name: "Base Product", price: 50 });
    expect(!!product.id).toBe(true); // save (create): deve criar produto com id

    // get
    const found = await productRepository.get(product.id);
    expect(found?.id === product.id).toBe(true); // get: deve encontrar o produto

    // getOrThrow
    const foundOrThrow = await productRepository.getOrThrow(product.id);
    expect(foundOrThrow.id === product.id).toBe(true); // getOrThrow: deve retornar sem erro

    // save (update)
    product.name = "Base Product Updated";

    const { user, ...prod } = product;
    const prodResolved = { ...prod, userId: user.id };

    const updated = await productRepository.save(prodResolved);
    expect(updated.name === "Base Product Updated").toBe(true); // save (update): deve atualizar o nome

    // patch
    const patched = await productRepository.patch(product.id, { price: 200 });
    expect(patched.price.toNumber() === 200).toBe(true); // patch: deve atualizar o preço

    // has
    const has = await productRepository.has(product.id);
    expect(has === true).toBe(true); // has: deve retornar true

    // total
    const total = await productRepository.total();
    expect(total >= 1).toBe(true); // total: deve ser >= 1

    // getAll
    const all = await productRepository.getAll();
    expect(all.length >= 1).toBe(true); // getAll: deve ter ao menos 1 produto

    // getAll com selectModel publicWithoutUser
    const withoutUser = await productRepository.getAll({ selectModel: "publicWithoutUser" });
    expect(withoutUser.every(p => !("user" in p) || p.userId !== undefined)).toBe(true); // getAll publicWithoutUser: não deve trazer user expandido

    // removeList — soft delete via deletedAt
    const p1 = await createTestProduct(userId, { name: "RL1", price: 10 });
    const p2 = await createTestProduct(userId, { name: "RL2", price: 20 });
    const { count } = await productRepository.removeList([p1.id, p2.id]);
    expect(count === 2).toBe(true); // removeList: deve retornar count=2

    return product;
}

// =============================================================================
// PRODUCT REPOSITORY — MÉTODOS DINÂMICOS
// =============================================================================

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

    // findByNameStartsWithInsensitive
    const byName = await productRepository.findByNameStartsWithInsensitive("dynamic");
    expect(byName.some(p => p.id === product.id)).toBe(true); // findByNameStartsWithInsensitive: deve encontrar Dynamic Widget

    // findByPriceLessThan
    const cheap = await productRepository.findByPriceLessThan(50);
    expect(cheap.some(p => p.id === cheapProduct.id)).toBe(true); // findByPriceLessThan: deve conter produto barato

    // findByPriceBetween
    const inRange = await productRepository.findByPriceBetween([100, 200]);
    expect(inRange.some(p => p.id === product.id)).toBe(true); // findByPriceBetween: deve conter Dynamic Widget

    // findByDescriptionIsNull
    const noDescription = await productRepository.findByDescriptionIsNull();
    expect(noDescription.some(p => p.id === cheapProduct.id)).toBe(true); // findByDescriptionIsNull: deve conter produto sem descrição

    // findByTagsSomeName
    const byTag = await productRepository.findByTagsSomeName("electronics");
    expect(byTag.some(p => p.id === product.id)).toBe(true); // findByTagsSomeName: deve encontrar produto com tag electronics

    // findByUserWithEmail
    const byUserEmail = await productRepository.findByUserWithEmail(
        (await userRepository.getOrThrow(userId)).email,
    );
    expect(byUserEmail.some(p => p.id === product.id)).toBe(true); // findByUserWithEmail: deve encontrar produto do usuário

    // findByUserId
    const byUserId = await productRepository.findByUserId(userId);
    expect(byUserId.some(p => p.id === product.id)).toBe(true); // findByUserId: deve encontrar produtos do usuário

    // findByIdIn
    const byIds = await productRepository.findByIdIn([product.id, cheapProduct.id]);
    expect(byIds.length === 2).toBe(true); // findByIdIn: deve retornar exatamente 2 produtos
}

// =============================================================================
// TESTES DE RELAÇÃO (save com relações)
// =============================================================================

async function testRelations() {
    // save com address (oto, restriction: set)
    const userWithAddress = await userRepository.save({
        name: "User With Address",
        email: `addr-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: {
            city: "Aracaju",
            state: "SE",
            country: "BR",
        },
    });
    const loaded = await userRepository.getOrThrow(userWithAddress.id);
    expect(loaded.address !== undefined).toBe(true); // save com address (oto): deve salvar o address junto

    // save com produtos (otm, restriction: add)
    const userWithProducts = await userRepository.save({
        name: "User With Products",
        email: `prod-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        products: [
            { name: "Product A", price: 10 }, // user.id será injetado pelo VSRepo
        ],
    });
    const loadedWithProds = await userRepository.getOrThrow(userWithProducts.id);
    expect(Array.isArray(loadedWithProds.products)).toBe(true); // save com products (otm): deve ter lista de produtos

    // save product com user (mto, restriction: add)
    const user = await createTestUser({ email: `reluser-${Date.now()}@ex.com` });
    const productWithUser = await productRepository.save({
        name: "Product With User",
        price: 77,
        tags: [{ name: "tag-a" }, { name: "tag-b" }],
        userId: user.id,
    });
    const loadedProduct = await productRepository.getOrThrow(productWithUser.id);
    expect(loadedProduct.user?.id === user.id).toBe(true); // save product com user (mto): deve vincular o usuário
    expect(Array.isArray(loadedProduct.tags) && loadedProduct.tags.length === 2).toBe(true); // save product com tags (mtm): deve salvar 2 tags
}

// =============================================================================
// TESTES DO INCLUDE MODELS
// =============================================================================

async function testIncludeModels() {
    // 1. Preparar dados
    const user = await userRepository.save({
        name: "Include Model User",
        email: `include-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: {
            city: "São Paulo",
            state: "SP",
            country: "BR",
        },
        products: [
            { name: "Included Product 1", price: 100 },
            { name: "Included Product 2", price: 200 },
        ],
    });

    // 2. testar get com includeModel simples (apenas address)
    const userWithAddress = await userRepository.getOrThrow(user.id, {
        includeModel: "withAddress",
    });
    expect(userWithAddress.address?.city === "São Paulo").toBe(true); // includeModel (withAddress): deve retornar o endereço
    // O ts acusaria erro se tentássemos acessar products aqui direto sem (as any), mostrando que a tipagem funcionou
    expect((userWithAddress as any).products === undefined).toBe(true); // includeModel (withAddress): não deve retornar produtos

    // 3. testar get com includeModel aninhado (full)
    const userFull = await userRepository.getOrThrow(user.id, { includeModel: "full" });
    expect(userFull.address !== undefined).toBe(true); // includeModel (full): deve retornar o endereço
    expect(Array.isArray(userFull.products) && userFull.products.length === 2).toBe(true); // includeModel (full): deve retornar os produtos

    // 4. testar getAll com includeModel
    const allWithProducts = await userRepository.getAll({ includeModel: "withProducts" });
    const foundInAll = allWithProducts.find(u => u.id === user.id);
    expect(Array.isArray(foundInAll?.products)).toBe(true); // includeModel em getAll: deve retornar os produtos para todos os itens
}

// =============================================================================
// TESTES DO RAW INCLUDE (include literal do Prisma)
// =============================================================================

async function testRawInclude() {
    // 1. Preparar dados
    const user = await userRepository.save({
        name: "Raw Include User",
        email: `rawinclude-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: {
            city: "Rio de Janeiro",
            state: "RJ",
            country: "BR",
        },
        products: [
            { name: "Raw Included Product 1", price: 150 },
            { name: "Raw Included Product 2", price: 250 },
        ],
    });

    // 2. get com include literal simples (apenas address)
    const userWithAddress = await userRepository.getOrThrow(user.id, {
        include: { address: true },
    });
    expect(userWithAddress.address?.city === "Rio de Janeiro").toBe(true); // include literal (address): deve retornar o endereço
    // O ts acusaria erro se tentássemos acessar products aqui direto sem (as any),
    // provando que o retorno foi inferido só com o que foi incluído
    expect((userWithAddress as any).products === undefined).toBe(true); // include literal (address): não deve retornar produtos

    // 3. get com include literal aninhado (address + products.tags)
    const userFull = await userRepository.getOrThrow(user.id, {
        include: {
            address: true,
            products: {
                include: { tags: true },
            },
        },
    });
    expect(userFull.address !== undefined).toBe(true); // include literal (full): deve retornar o endereço
    expect(Array.isArray(userFull.products) && userFull.products.length === 2).toBe(true); // include literal (full): deve retornar os produtos
    expect(userFull.products.every(p => Array.isArray(p.tags))).toBe(true); // include literal (full): cada produto deve ter tags (array, mesmo que vazio)

    // 4. getAll com include literal
    const allWithProducts = await userRepository.getAll({
        include: { products: true },
    });
    const foundInAll = allWithProducts.find(u => u.id === user.id);
    expect(Array.isArray(foundInAll?.products)).toBe(true); // include literal em getAll: deve retornar os produtos para todos os itens
}

// =============================================================================
// TRANSAÇÕES
// =============================================================================

async function testRawSelect() {

    // 1. Preparar dados
    const user = await userRepository.save({
        name: "Raw Select User",
        email: `rawselect-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: {
            city: "Rio de Janeiro",
            state: "RJ",
            country: "BR",
        },
        products: [
            { name: "Raw Selected Product 1", price: 150 },
        ],
    });

    // 2. get com select cru simples (apenas id e name)
    const userIdAndName = await userRepository.getOrThrow(user.id, {
        select: { id: true, name: true },
    });
    expect(userIdAndName.id === user.id).toBe(true); // select cru (id, name): deve retornar o id
    expect(userIdAndName.name === "Raw Select User").toBe(true); // select cru (id, name): deve retornar o name
    // O ts acusaria erro se tentássemos acessar email aqui direto sem (as any),
    // provando que o retorno foi inferido só com o que foi selecionado
    expect((userIdAndName as any).email === undefined).toBe(true); // select cru (id, name): não deve retornar email

    // 3. select cru não deve aplicar o defaultSelectModel ("public") — campos do
    // selectModel "public" que não estão no select cru não devem vir na resposta
    expect((userIdAndName as any).createdAt === undefined).toBe(true); // select cru: não deve herdar campos do defaultSelectModel

    // 4. select cru pode incluir relações (equivalente a um "include" dentro do select)
    const userWithAddressSelected = await userRepository.getOrThrow(user.id, {
        select: { id: true, address: { select: { city: true } } },
    });
    expect(userWithAddressSelected.address?.city === "Rio de Janeiro").toBe(true); // select cru com relação: deve retornar apenas o campo pedido da relação
    expect((userWithAddressSelected.address as any)?.state === undefined).toBe(true); // select cru com relação: não deve retornar campos não pedidos da relação

    // 5. getAll com select cru
    const allSelected = await userRepository.getAll({
        select: { id: true, email: true },
    });
    const foundInAll = allSelected.find(u => u.id === user.id);
    expect(foundInAll?.email === user.email).toBe(true); // select cru em getAll: deve aplicar o select a todos os itens
    expect((foundInAll as any)?.name === undefined).toBe(true); // select cru em getAll: não deve retornar campos fora do select

    // 6. select cru continua respeitando "see"/soft-delete e demais opções em conjunto
    const selectedActiveOnly = await userRepository.get(user.id, {
        select: { id: true, active: true },
        see: "active",
    });
    expect(selectedActiveOnly?.active === true).toBe(true); // select cru combinado com "see": deve continuar funcionando normalmente
}

async function testTransactions() {
    let transactionUserId: string | null = null;

    try {
        await userRepository.prisma.$transaction(async tx => {
            const user = await userRepository.save(
                {
                    name: "Transaction User",
                    email: `tx-${Date.now()}@ex.com`,
                    password: "x",
                    userType: UserType.COMMON,
                    likesVSRepo: false,
                    active: true,
                },
                { db: tx },
            );
            transactionUserId = user.id;

            // Força rollback
            throw new Error("forced rollback");
        });
    } catch {
        // esperado
    }

    if (transactionUserId) {
        const shouldNotExist = await userRepository.get(transactionUserId, { selectModel: false });
        expect(shouldNotExist === null).toBe(true); // transação (rollback): usuário não deve existir após rollback
    }

    // Transação bem-sucedida
    let txUserId: string | null = null;
    await userRepository.prisma.$transaction(async tx => {
        const user = await userRepository.save(
            {
                name: "TX Success User",
                email: `txok-${Date.now()}@ex.com`,
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
    expect(txUser?.id === txUserId).toBe(true); // transação (commit): usuário deve persistir após commit
}

// =============================================================================
// TESTES DE QUERY METHODS
// =============================================================================

async function testQueryMethods(userId: string) {
    // --- User query methods ---

    // findActiveUsersByCountryRaw — select com join e parâmetros posicionais
    // Preparar: salvar um user com address no Brasil
    const userWithBRAddress = await userRepository.save({
        name: "BR User",
        email: `br-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
        address: {
            city: "São Paulo",
            state: "SP",
            country: "BR",
        },
    });

    const brUsers = await userRepository.findActiveUsersByCountryRaw<User[]>({
        args: [true, "BR"],
    });
    expect(Array.isArray(brUsers)).toBe(true); // findActiveUsersByCountryRaw: deve retornar array
    expect(brUsers.some(u => u.id === userWithBRAddress.id)).toBe(true); // findActiveUsersByCountryRaw: deve conter o usuário com address BR

    // findActiveUsersByCountryRaw com país inexistente
    const noUsers = await userRepository.findActiveUsersByCountryRaw<User[]>({
        args: [true, "ZZ"],
    });
    expect(Array.isArray(noUsers) && noUsers.length === 0).toBe(true); // findActiveUsersByCountryRaw (país inexistente): deve retornar array vazio

    // deactivateUsersWithoutProductsRaw — modifying query (UPDATE)
    // Criar usuário sem produtos
    const userNoProducts = await createTestUser({
        email: `noprod-${Date.now()}@ex.com`,
        likesVSRepo: true,
        active: true,
    });

    const deactivateCount = await userRepository.deactivateUsersWithoutProductsRaw({
        args: [],
    });
    expect(typeof deactivateCount === "number").toBe(true); // deactivateUsersWithoutProductsRaw: deve retornar number (affected rows)
    expect(deactivateCount >= 1).toBe(true); // deactivateUsersWithoutProductsRaw: deve desativar ao menos 1 usuário

    // Verificar que o usuário sem produtos foi desativado
    const deactivated = await userRepository.get(userNoProducts.id, { selectModel: "internal" });
    // Nota: get usa requiredWhere (active=true), então deve retornar null se desativado
    expect(deactivated === null).toBe(true); // deactivateUsersWithoutProductsRaw: usuário sem produto não deve mais ser encontrado (active=false)

    // --- Product query methods ---

    // findExpensiveProductsRaw — select com filtro de preço
    const expensiveProduct = await createTestProduct(userId, {
        name: "Expensive Widget",
        price: 999.99,
    });

    const expensive = await productRepository.findExpensiveProductsRaw<Product[]>({
        args: [500],
    });
    expect(Array.isArray(expensive)).toBe(true); // findExpensiveProductsRaw: deve retornar array
    expect(expensive.some(p => p.id === expensiveProduct.id)).toBe(true); // findExpensiveProductsRaw: deve conter o produto caro

    // findExpensiveProductsRaw com limite alto
    const noneExpensive = await productRepository.findExpensiveProductsRaw<Product[]>({
        args: [99999],
    });
    expect(Array.isArray(noneExpensive) && noneExpensive.length === 0).toBe(true); // findExpensiveProductsRaw (limite alto): deve retornar array vazio

    // countProductsByUserRaw — select com COUNT
    const countResult = await productRepository.countProductsByUserRaw({
        args: [userId],
    });
    expect(Array.isArray(countResult) && countResult.length === 1).toBe(true); // countProductsByUserRaw: deve retornar array com 1 elemento
    expect(typeof countResult[0]?.count === "number").toBe(true); // countProductsByUserRaw: count deve ser number
    expect(countResult[0].count >= 1).toBe(true); // countProductsByUserRaw: count deve ser >= 1

    // countProductsByUserRaw com userId inexistente
    const zeroCount = await productRepository.countProductsByUserRaw({
        args: [crypto.randomUUID()],
    });
    expect(zeroCount[0]?.count === 0).toBe(true); // countProductsByUserRaw (userId fake): count deve ser 0

    // --- Query method com db (transaction) ---
    await userRepository.prisma
        .$transaction(async tx => {
            const txUser = await userRepository.findActiveUsersByCountryRaw<User[]>({
                args: [true, "BR"],
                db: tx,
            });
            expect(Array.isArray(txUser)).toBe(true); // findActiveUsersByCountryRaw (com db: tx): deve retornar array dentro de transação

            // modifying query dentro de transaction
            const txDeactivateCount = await userRepository.deactivateUsersWithoutProductsRaw({
                args: [],
                db: tx,
            });
            expect(typeof txDeactivateCount === "number").toBe(true); // deactivateUsersWithoutProductsRaw (com db: tx): deve retornar number dentro de transação

            // Força rollback
            throw new Error("forced rollback for query method test");
        })
        .catch(() => {});

    // Verificar rollback: o deactivate foi feito fora da tx, então persistiu.
    // get usa requiredWhere (active=true), então retorna null para users inativos.
    const brUserAfterRollback = await userRepository.get(userWithBRAddress.id, {
        selectModel: "internal",
    });
    expect(brUserAfterRollback === null).toBe(true); // query method (rollback): BR user should be inactive (deactivate committed before tx, get returns null due to requiredWhere)
}

// =============================================================================
// RUNNER PRINCIPAL
// =============================================================================

describe("VSRepository — API funcional (setupVSRepo)", () => {
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

    it("include models", async () => {
        await testIncludeModels();
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
        await testQueryMethods(baseUser.id);
    });
});
