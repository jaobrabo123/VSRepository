// Comando para testar todos os examples de uma vez:
// pnpm tsx .\examples\tests\base-methods.test.ts && pnpm tsx examples/tests/batch-methods.test.ts && pnpm tsx .\examples\tests\dynamic-methods.test.ts && pnpm tsx .\examples\tests\relations.test.ts && pnpm tsx .\examples\tests\required-where.test.ts && pnpm tsx examples/tests/soft-delete.test.ts && pnpm tsx .\examples\tests\transactions.test.ts

import { UserType } from "@vsrepo/prisma/types";
import { ProductGetPayload, UserCreateInput, UserGetPayload } from "./generated/prisma/models";
import { SaveObject, setupVSRepo } from "./generated/vsrepo";
import prisma from "./examples/prisma";

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

    defaultOrdenation: [{ createdAt: "desc" }],

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

            injectOrdenation: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
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
    console.log("\n=== USER — MÉTODOS BASE ===");

    // save (create)
    const created = await createTestUser({ email: "base-save@example.com" });
    console.assert(!!created.id, "save (create): deve retornar o usuário criado com id");
    console.log("✅ save (create):", created.id);

    // get
    const found = await userRepository.get(created.id);
    console.assert(found?.id === created.id, "get: deve encontrar o usuário pelo id");
    console.log("✅ get:", found?.id);

    // getOrThrow
    const foundOrThrow = await userRepository.getOrThrow(created.id);
    console.assert(
        foundOrThrow.id === created.id,
        "getOrThrow: deve retornar o usuário sem lançar erro",
    );
    console.log("✅ getOrThrow:", foundOrThrow.id);

    // save (update via upsert com pk)
    created.name = "Updated Name";
    const updated = await userRepository.save(created);
    console.assert(updated.name === "Updated Name", "save (update): deve atualizar o nome");
    console.log("✅ save (update):", updated.name);

    // patch
    const patched = await userRepository.patch(created.id, { name: "Patched Name" });
    console.assert(patched.name === "Patched Name", "patch: deve aplicar atualização parcial");
    console.log("✅ patch:", patched.name);

    // has
    const exists = await userRepository.has(created.id);
    console.assert(exists === true, "has: deve retornar true para id existente");
    console.log("✅ has (true):", exists);

    const notExists = await userRepository.has(crypto.randomUUID());
    console.assert(notExists === false, "has: deve retornar false para id inexistente");
    console.log("✅ has (false):", notExists);

    // total
    const count = await userRepository.total();
    console.assert(typeof count === "number" && count >= 1, "total: deve retornar número >= 1");
    console.log("✅ total:", count);

    // getAll
    const all = await userRepository.getAll();
    console.assert(
        Array.isArray(all) && all.length >= 1,
        "getAll: deve retornar array com ao menos 1 item",
    );
    console.log("✅ getAll:", all.length, "usuários");

    // getAll com paginação
    const paginated = await userRepository.getAll({ pagination: { skip: 0, take: 1 } });
    console.assert(paginated.length === 1, "getAll (paginado): deve retornar exatamente 1 item");
    console.log("✅ getAll (paginado):", paginated.length);

    // getAll com selectModel específico
    const minimal = await userRepository.getAll({ selectModel: "minimal" });
    console.assert(
        minimal.every(u => Object.keys(u).join(",") === "id"),
        "getAll (selectModel minimal): deve retornar só o id",
    );
    console.log("✅ getAll (selectModel minimal):", minimal[0]);

    // remove
    const toRemove = await createTestUser({ email: "remove@example.com" });
    const removed = await userRepository.remove(toRemove.id);
    console.assert(removed.id === toRemove.id, "remove: deve retornar o usuário removido");
    const afterRemove = await userRepository.get(toRemove.id);
    console.assert(
        afterRemove === null,
        "remove: usuário não deve mais existir (ou active=false bloqueia requiredWhere)",
    );
    console.log("✅ remove:", removed.id);

    // removeList
    const u1 = await createTestUser({ email: "removelist1@example.com" });
    const u2 = await createTestUser({ email: "removelist2@example.com" });
    const { count: removedCount } = await userRepository.removeList([u1.id, u2.id]);
    console.assert(removedCount === 2, "removeList: deve remover 2 usuários");
    console.log("✅ removeList count:", removedCount);

    return created;
}

// =============================================================================
// USER REPOSITORY — MÉTODOS DINÂMICOS
// =============================================================================

async function testUserDynamicMethods() {
    console.log("\n=== USER — MÉTODOS DINÂMICOS ===");

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
    console.assert(
        Array.isArray(byType) && byType.length >= 1,
        "findByUserType: deve retornar lista",
    );
    console.log("✅ findByUserType:", byType.length);

    // findOneByEmailAndUserType
    const byEmailAndType = await userRepository.findOneByEmailAndUserType(email, UserType.COMMON);
    console.assert(
        byEmailAndType?.id === user.id,
        "findOneByEmailAndUserType: deve encontrar o usuário certo",
    );
    console.log("✅ findOneByEmailAndUserType:", byEmailAndType?.id);

    // findByUserTypeOrEmailEndsWith
    const byTypeOrEmail = await userRepository.findByUserTypeOrEmailEndsWith(
        UserType.ADMIN,
        "@corp.com",
    );
    console.assert(
        byTypeOrEmail.some(u => u.id === admin.id),
        "findByUserTypeOrEmailEndsWith: deve conter o admin",
    );
    console.log("✅ findByUserTypeOrEmailEndsWith:", byTypeOrEmail.length);

    // findByLikesVSRepoIsTruePaginated
    const likers = await userRepository.findByLikesVSRepoIsTruePaginated({ skip: 0, take: 10 });
    console.assert(Array.isArray(likers), "findByLikesVSRepoIsTruePaginated: deve retornar array");
    console.assert(
        likers.every(u => u.likesVSRepo === true),
        "findByLikesVSRepoIsTruePaginated: todos devem ter likesVSRepo=true",
    );
    console.log("✅ findByLikesVSRepoIsTruePaginated:", likers.length);

    // --- Distinct ---
    // Neste ponto existem pelo menos 2 combinações distintas de (userType, likesVSRepo):
    // (COMMON, true) — vindo de "created" (testUserBaseMethods) e "user" (COMMON, true)
    // (ADMIN, false) — vindo de "admin" (ADMIN, false)

    // findManyDistinctUserTypeAndLikesVSRepo — sem filtro de campo, só distinct em 2 colunas
    const distinctTypeAndLikes = await userRepository.findManyDistinctUserTypeAndLikesVSRepo();
    console.assert(
        Array.isArray(distinctTypeAndLikes),
        "findManyDistinctUserTypeAndLikesVSRepo: deve retornar array",
    );
    const uniqueCombos = new Set(distinctTypeAndLikes.map(u => `${u.userType}-${u.likesVSRepo}`));
    console.assert(
        uniqueCombos.size === distinctTypeAndLikes.length,
        "findManyDistinctUserTypeAndLikesVSRepo: não deve haver combinações (userType, likesVSRepo) repetidas",
    );
    console.assert(
        distinctTypeAndLikes.some(u => u.userType === UserType.COMMON && u.likesVSRepo === true) &&
            distinctTypeAndLikes.some(
                u => u.userType === UserType.ADMIN && u.likesVSRepo === false,
            ),
        "findManyDistinctUserTypeAndLikesVSRepo: deve conter as combinações (COMMON,true) e (ADMIN,false)",
    );
    console.log(
        "✅ findManyDistinctUserTypeAndLikesVSRepo:",
        distinctTypeAndLikes.map(u => `${u.userType}/${u.likesVSRepo}`).join(", "),
    );

    // findManyDistinctUserTypePaginated — distinct combinado com o sufixo Paginated
    const distinctTypePaginated = await userRepository.findManyDistinctUserTypePaginated({
        skip: 0,
        take: 10,
    });
    console.assert(
        Array.isArray(distinctTypePaginated),
        "findManyDistinctUserTypePaginated: deve retornar array",
    );
    const uniqueTypes = new Set(distinctTypePaginated.map(u => u.userType));
    console.assert(
        uniqueTypes.size === distinctTypePaginated.length,
        "findManyDistinctUserTypePaginated: não deve haver userType repetido",
    );
    console.assert(
        uniqueTypes.has(UserType.COMMON) && uniqueTypes.has(UserType.ADMIN),
        "findManyDistinctUserTypePaginated: deve conter COMMON e ADMIN",
    );
    console.log(
        "✅ findManyDistinctUserTypePaginated:",
        distinctTypePaginated.map(u => u.userType).join(", "),
    );

    // findManyByLikesVSRepoDistinctUserType — filtro de campo (likesVSRepo) combinado com Distinct (userType)
    const distinctByLikes = await userRepository.findManyByLikesVSRepoDistinctUserType(true);
    console.assert(
        Array.isArray(distinctByLikes),
        "findManyByLikesVSRepoDistinctUserType: deve retornar array",
    );
    console.assert(
        distinctByLikes.every(u => u.likesVSRepo === true),
        "findManyByLikesVSRepoDistinctUserType: todos devem ter likesVSRepo=true",
    );
    const uniqueTypesFiltered = new Set(distinctByLikes.map(u => u.userType));
    console.assert(
        uniqueTypesFiltered.size === distinctByLikes.length,
        "findManyByLikesVSRepoDistinctUserType: não deve haver userType repetido",
    );
    console.log(
        "✅ findManyByLikesVSRepoDistinctUserType:",
        distinctByLikes.map(u => u.userType).join(", "),
    );

    // buscarUsuariosPaias (proxy de findByLikesVSRepoIsFalse)
    const paias = await userRepository.buscarUsuariosPaias();
    console.assert(Array.isArray(paias), "buscarUsuariosPaias: deve retornar array");
    console.assert(
        paias.every(u => u.likesVSRepo === false),
        "buscarUsuariosPaias: todos devem ter likesVSRepo=false",
    );
    console.log("✅ buscarUsuariosPaias:", paias.length);

    // findInternalByEmail (selectModel internal, whereType overwrite)
    const internal = await userRepository.findInternalByEmail(email);
    console.assert(
        internal?.password !== undefined,
        "findInternalByEmail: deve retornar campo password (select internal)",
    );
    console.log("✅ findInternalByEmail:", internal?.id);

    // existsByEmail
    const emailExists = await userRepository.existsByEmail(email);
    console.assert(emailExists === true, "existsByEmail: deve retornar true para email existente");
    const emailNotExists = await userRepository.existsByEmail("naoexiste@nada.com");
    console.assert(
        emailNotExists === false,
        "existsByEmail: deve retornar false para email inexistente",
    );
    console.log("✅ existsByEmail (true/false):", emailExists, emailNotExists);

    // findAdmins (pushWhere userType=ADMIN)
    const admins = await userRepository.findAdmins();
    console.assert(
        admins.every(u => u.userType === UserType.ADMIN),
        "findAdmins: todos devem ser ADMIN",
    );
    console.log("✅ findAdmins:", admins.length);

    // findByAddressWithCountry (sem address relacionado, retorno pode ser vazio — só validar que roda)
    const withCountry = await userRepository.findByAddressWithCountry("BR");
    console.assert(Array.isArray(withCountry), "findByAddressWithCountry: deve retornar array");
    console.log("✅ findByAddressWithCountry:", withCountry.length);

    // findByNameContainsInsensitiveOrderedAndPaginated
    const byName = await userRepository.findByNameContainsInsensitiveOrderedAndPaginated(
        "test",
        { name: "asc" },
        { skip: 0, take: 5 },
    );
    console.assert(
        Array.isArray(byName),
        "findByNameContainsInsensitiveOrderedAndPaginated: deve retornar array",
    );
    console.log("✅ findByNameContainsInsensitiveOrderedAndPaginated:", byName.length);

    // findByProductsSome — usuários com ao menos 1 produto
    const withProducts = await userRepository.findByProductsSome();
    console.assert(Array.isArray(withProducts), "findByProductsSome: deve retornar array");
    console.log("✅ findByProductsSome:", withProducts.length);

    // findByProductsNone — usuários sem produtos
    const withoutProducts = await userRepository.findByProductsNone();
    console.assert(Array.isArray(withoutProducts), "findByProductsNone: deve retornar array");
    console.assert(
        withoutProducts.some(u => u.id === user.id),
        "findByProductsNone: usuário sem produto deve aparecer",
    );
    console.log("✅ findByProductsNone:", withoutProducts.length);

    // findUniqueByEmail
    const unique = await userRepository.findUniqueByEmail(email);
    console.assert(unique?.id === user.id, "findUniqueByEmail: deve retornar o usuário correto");
    console.log("✅ findUniqueByEmail:", unique?.id);

    // findUniqueOrThrowById
    const uniqueOrThrow = await userRepository.findUniqueOrThrowById(user.id);
    console.assert(
        uniqueOrThrow.id === user.id,
        "findUniqueOrThrowById: deve retornar sem lançar erro",
    );
    console.log("✅ findUniqueOrThrowById:", uniqueOrThrow.id);

    // findFirstByNameStartsWith
    const firstByName = await userRepository.findFirstByNameStartsWith("Test");
    console.assert(
        firstByName !== null,
        "findFirstByNameStartsWith: deve encontrar ao menos 1 usuário",
    );
    console.log("✅ findFirstByNameStartsWith:", firstByName?.id);

    // findFirstOrThrowByIdOrEmail
    const firstOrThrow = await userRepository.findFirstOrThrowByIdOrEmail(user.id, email);
    console.assert(
        firstOrThrow.id === user.id,
        "findFirstOrThrowByIdOrEmail: deve retornar o usuário correto",
    );
    console.log("✅ findFirstOrThrowByIdOrEmail:", firstOrThrow.id);

    // countByUserType
    const countUsers = await userRepository.countByUserType(UserType.COMMON);
    console.assert(
        typeof countUsers === "number" && countUsers >= 1,
        "countByUserType: deve retornar número >= 1",
    );
    console.log("✅ countByUserType:", countUsers);

    // findManyByNameOptional (nome é opcional)
    const withName = await userRepository.findManyByNameOptional("Test User");
    const withoutName = await userRepository.findManyByNameOptional(undefined);
    console.assert(
        Array.isArray(withName),
        "findManyByNameOptional (com nome): deve retornar array",
    );
    console.assert(
        Array.isArray(withoutName),
        "findManyByNameOptional (sem nome): deve retornar array",
    );
    console.log("✅ findManyByNameOptional (com/sem nome):", withName.length, withoutName.length);

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
    console.assert(
        Array.isArray(manyCreated) && manyCreated.length === 2,
        "createManyAndReturn: deve retornar 2 usuários",
    );
    console.log("✅ createManyAndReturn:", manyCreated.length);

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
    console.assert(
        typeof skipResult.count === "number",
        "createManySkipDuplicates: deve retornar { count }",
    );
    console.log("✅ createManySkipDuplicates count:", skipResult.count);

    // create
    const directCreated = await userRepository.create({
        name: "Direct Create",
        email: `direct-${Date.now()}@ex.com`,
        password: "x",
        userType: UserType.COMMON,
        likesVSRepo: true,
        active: true,
    });
    console.assert(!!directCreated.id, "create: deve retornar usuário com id");
    console.log("✅ create:", directCreated.id);

    // updateManyAndReturnByUserType
    const updatedMany = await userRepository.updateManyAndReturnByUserType(
        UserType.COMMON,
        { likesVSRepo: true },
        { selectModel: "internal" },
    );
    console.assert(
        Array.isArray(updatedMany),
        "updateManyAndReturnByUserType: deve retornar array",
    );
    console.log("✅ updateManyAndReturnByUserType:", updatedMany.length);

    // updateManyWhere
    const updateWhere = await userRepository.updateManyWhere(
        { userType: UserType.COMMON },
        { likesVSRepo: true },
    );
    console.assert(
        typeof updateWhere.count === "number",
        "updateManyWhere: deve retornar { count }",
    );
    console.log("✅ updateManyWhere count:", updateWhere.count);

    // updateById
    const updatedById = await userRepository.updateById(user.id, { name: "Updated By Id" });
    console.assert(updatedById.name === "Updated By Id", "updateById: deve atualizar o nome");
    console.log("✅ updateById:", updatedById.name);

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
    console.assert(
        upserted.id === user.id,
        "upsertByEmail: deve fazer upsert no usuário existente",
    );
    console.log("✅ upsertByEmail:", upserted.id);

    // deleteManyByIdIn (whereType overwrite)
    const toDelete = await createTestUser({ email: `del-${Date.now()}@ex.com` });
    const deleteResult = await userRepository.deleteManyByIdIn([toDelete.id]);
    console.assert(
        typeof deleteResult.count === "number",
        "deleteManyByIdIn: deve retornar { count }",
    );
    console.log("✅ deleteManyByIdIn count:", deleteResult.count);

    // deleteById
    const toDeleteOne = await createTestUser({ email: `delone-${Date.now()}@ex.com` });
    const deletedOne = await userRepository.deleteById(toDeleteOne.id);
    console.assert(deletedOne.id === toDeleteOne.id, "deleteById: deve retornar o id removido");
    console.log("✅ deleteById:", deletedOne.id);

    // aggregate
    const aggregated = await userRepository.aggregate({
        _count: { _all: true },
        _min: { createdAt: true },
    });
    console.assert(
        typeof aggregated._count._all === "number",
        "aggregate: deve retornar _count._all como número",
    );
    console.log("✅ aggregate _count._all:", aggregated._count._all);

    // groupBy
    const grouped = await userRepository.groupBy({
        by: ["userType"],
        _count: { userType: true },
    });
    console.assert(Array.isArray(grouped), "groupBy: deve retornar array");
    console.assert(
        grouped.every(g => g._count.userType >= 0),
        "groupBy: cada grupo deve ter _count.userType",
    );
    console.log("✅ groupBy:", grouped.map(g => `${g.userType}=${g._count.userType}`).join(", "));

    // findByAddressWithout (usuários sem address)
    const withoutAddress = await userRepository.findByAddressWithout();
    console.assert(Array.isArray(withoutAddress), "findByAddressWithout: deve retornar array");
    console.log("✅ findByAddressWithout:", withoutAddress.length);

    return { user, admin };
}

// =============================================================================
// PRODUCT REPOSITORY — MÉTODOS BASE
// =============================================================================

async function testProductBaseMethods(userId: string) {
    console.log("\n=== PRODUCT — MÉTODOS BASE ===");

    // save (create)
    const product = await createTestProduct(userId, { name: "Base Product", price: 50 });
    console.assert(!!product.id, "save (create): deve criar produto com id");
    console.log("✅ save (create):", product.id);

    // get
    const found = await productRepository.get(product.id);
    console.assert(found?.id === product.id, "get: deve encontrar o produto");
    console.log("✅ get:", found?.id);

    // getOrThrow
    const foundOrThrow = await productRepository.getOrThrow(product.id);
    console.assert(foundOrThrow.id === product.id, "getOrThrow: deve retornar sem erro");
    console.log("✅ getOrThrow:", foundOrThrow.id);

    // save (update)
    product.name = "Base Product Updated";

    const { user, ...prod } = product;
    const prodResolved = { ...prod, userId: user.id };

    const updated = await productRepository.save(prodResolved);
    console.assert(updated.name === "Base Product Updated", "save (update): deve atualizar o nome");
    console.log("✅ save (update):", updated.name);

    // patch
    const patched = await productRepository.patch(product.id, { price: 200 });
    console.assert(patched.price.toNumber() === 200, "patch: deve atualizar o preço");
    console.log("✅ patch price:", patched.price);

    // has
    const has = await productRepository.has(product.id);
    console.assert(has === true, "has: deve retornar true");
    console.log("✅ has:", has);

    // total
    const total = await productRepository.total();
    console.assert(total >= 1, "total: deve ser >= 1");
    console.log("✅ total:", total);

    // getAll
    const all = await productRepository.getAll();
    console.assert(all.length >= 1, "getAll: deve ter ao menos 1 produto");
    console.log("✅ getAll:", all.length);

    // getAll com selectModel publicWithoutUser
    const withoutUser = await productRepository.getAll({ selectModel: "publicWithoutUser" });
    console.assert(
        withoutUser.every(p => !("user" in p) || p.userId !== undefined),
        "getAll publicWithoutUser: não deve trazer user expandido",
    );
    console.log("✅ getAll (publicWithoutUser):", withoutUser.length);

    // removeList — soft delete via deletedAt
    const p1 = await createTestProduct(userId, { name: "RL1", price: 10 });
    const p2 = await createTestProduct(userId, { name: "RL2", price: 20 });
    const { count } = await productRepository.removeList([p1.id, p2.id]);
    console.assert(count === 2, "removeList: deve retornar count=2");
    console.log("✅ removeList count:", count);

    return product;
}

// =============================================================================
// PRODUCT REPOSITORY — MÉTODOS DINÂMICOS
// =============================================================================

async function testProductDynamicMethods(userId: string) {
    console.log("\n=== PRODUCT — MÉTODOS DINÂMICOS ===");

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
    console.assert(
        byName.some(p => p.id === product.id),
        "findByNameStartsWithInsensitive: deve encontrar Dynamic Widget",
    );
    console.log("✅ findByNameStartsWithInsensitive:", byName.length);

    // findByPriceLessThan
    const cheap = await productRepository.findByPriceLessThan(50);
    console.assert(
        cheap.some(p => p.id === cheapProduct.id),
        "findByPriceLessThan: deve conter produto barato",
    );
    console.log("✅ findByPriceLessThan:", cheap.length);

    // findByPriceBetween
    const inRange = await productRepository.findByPriceBetween([100, 200]);
    console.assert(
        inRange.some(p => p.id === product.id),
        "findByPriceBetween: deve conter Dynamic Widget",
    );
    console.log("✅ findByPriceBetween:", inRange.length);

    // findByDescriptionIsNull
    const noDescription = await productRepository.findByDescriptionIsNull();
    console.assert(
        noDescription.some(p => p.id === cheapProduct.id),
        "findByDescriptionIsNull: deve conter produto sem descrição",
    );
    console.log("✅ findByDescriptionIsNull:", noDescription.length);

    // findByTagsSomeName
    const byTag = await productRepository.findByTagsSomeName("electronics");
    console.assert(
        byTag.some(p => p.id === product.id),
        "findByTagsSomeName: deve encontrar produto com tag electronics",
    );
    console.log("✅ findByTagsSomeName:", byTag.length);

    // findByUserWithEmail
    const byUserEmail = await productRepository.findByUserWithEmail(
        (await userRepository.getOrThrow(userId)).email,
    );
    console.assert(
        byUserEmail.some(p => p.id === product.id),
        "findByUserWithEmail: deve encontrar produto do usuário",
    );
    console.log("✅ findByUserWithEmail:", byUserEmail.length);

    // findByUserId
    const byUserId = await productRepository.findByUserId(userId);
    console.assert(
        byUserId.some(p => p.id === product.id),
        "findByUserId: deve encontrar produtos do usuário",
    );
    console.log("✅ findByUserId:", byUserId.length);

    // findByIdIn
    const byIds = await productRepository.findByIdIn([product.id, cheapProduct.id]);
    console.assert(byIds.length === 2, "findByIdIn: deve retornar exatamente 2 produtos");
    console.log("✅ findByIdIn:", byIds.length);
}

// =============================================================================
// TESTES DE RELAÇÃO (save com relações)
// =============================================================================

async function testRelations() {
    console.log("\n=== RELAÇÕES ===");

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
    console.assert(
        loaded.address !== undefined,
        "save com address (oto): deve salvar o address junto",
    );
    console.log("✅ save com address:", loaded.address?.city);

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
    console.assert(
        Array.isArray(loadedWithProds.products),
        "save com products (otm): deve ter lista de produtos",
    );
    console.log("✅ save com products:", loadedWithProds.products.length);

    // save product com user (mto, restriction: add)
    const user = await createTestUser({ email: `reluser-${Date.now()}@ex.com` });
    const productWithUser = await productRepository.save({
        name: "Product With User",
        price: 77,
        tags: [{ name: "tag-a" }, { name: "tag-b" }],
        userId: user.id,
    });
    const loadedProduct = await productRepository.getOrThrow(productWithUser.id);
    console.assert(
        loadedProduct.user?.id === user.id,
        "save product com user (mto): deve vincular o usuário",
    );
    console.assert(
        Array.isArray(loadedProduct.tags) && loadedProduct.tags.length === 2,
        "save product com tags (mtm): deve salvar 2 tags",
    );
    console.log(
        "✅ save product com user + tags:",
        loadedProduct.user?.id,
        loadedProduct.tags.length,
    );
}

// =============================================================================
// TESTES DO INCLUDE MODELS
// =============================================================================

async function testIncludeModels() {
    console.log("\n=== INCLUDE MODELS ===");

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
    console.assert(
        userWithAddress.address?.city === "São Paulo",
        "includeModel (withAddress): deve retornar o endereço",
    );
    // O ts acusaria erro se tentássemos acessar products aqui direto sem (as any), mostrando que a tipagem funcionou
    console.assert(
        (userWithAddress as any).products === undefined,
        "includeModel (withAddress): não deve retornar produtos",
    );
    console.log("✅ get com includeModel (withAddress):", userWithAddress.address?.city);

    // 3. testar get com includeModel aninhado (full)
    const userFull = await userRepository.getOrThrow(user.id, { includeModel: "full" });
    console.assert(userFull.address !== undefined, "includeModel (full): deve retornar o endereço");
    console.assert(
        Array.isArray(userFull.products) && userFull.products.length === 2,
        "includeModel (full): deve retornar os produtos",
    );
    console.log(
        "✅ get com includeModel (full): endereço encontrado &",
        userFull.products.length,
        "produtos",
    );

    // 4. testar getAll com includeModel
    const allWithProducts = await userRepository.getAll({ includeModel: "withProducts" });
    const foundInAll = allWithProducts.find(u => u.id === user.id);
    console.assert(
        Array.isArray(foundInAll?.products),
        "includeModel em getAll: deve retornar os produtos para todos os itens",
    );
    console.log("✅ getAll com includeModel (withProducts): OK");
}

// =============================================================================
// TESTES DO RAW INCLUDE (include literal do Prisma)
// =============================================================================

async function testRawInclude() {
    console.log("\n=== RAW INCLUDE (literal do Prisma) ===");

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
    console.assert(
        userWithAddress.address?.city === "Rio de Janeiro",
        "include literal (address): deve retornar o endereço",
    );
    // O ts acusaria erro se tentássemos acessar products aqui direto sem (as any),
    // provando que o retorno foi inferido só com o que foi incluído
    console.assert(
        (userWithAddress as any).products === undefined,
        "include literal (address): não deve retornar produtos",
    );
    console.log("✅ getOrThrow com include literal (address):", userWithAddress.address?.city);

    // 3. get com include literal aninhado (address + products.tags)
    const userFull = await userRepository.getOrThrow(user.id, {
        include: {
            address: true,
            products: {
                include: { tags: true },
            },
        },
    });
    console.assert(
        userFull.address !== undefined,
        "include literal (full): deve retornar o endereço",
    );
    console.assert(
        Array.isArray(userFull.products) && userFull.products.length === 2,
        "include literal (full): deve retornar os produtos",
    );
    console.assert(
        userFull.products.every(p => Array.isArray(p.tags)),
        "include literal (full): cada produto deve ter tags (array, mesmo que vazio)",
    );
    console.log(
        "✅ getOrThrow com include literal (full): endereço encontrado &",
        userFull.products.length,
        "produtos",
    );

    // 4. getAll com include literal
    const allWithProducts = await userRepository.getAll({
        include: { products: true },
    });
    const foundInAll = allWithProducts.find(u => u.id === user.id);
    console.assert(
        Array.isArray(foundInAll?.products),
        "include literal em getAll: deve retornar os produtos para todos os itens",
    );
    console.log("✅ getAll com include literal (products): OK");
}

// =============================================================================
// TRANSAÇÕES
// =============================================================================

async function testTransactions() {
    console.log("\n=== TRANSAÇÕES ===");

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
        console.assert(
            shouldNotExist === null,
            "transação (rollback): usuário não deve existir após rollback",
        );
        console.log("✅ transação rollback: usuário não persiste");
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
    console.assert(
        txUser?.id === txUserId,
        "transação (commit): usuário deve persistir após commit",
    );
    console.log("✅ transação commit:", txUser?.id);
}

// =============================================================================
// RUNNER PRINCIPAL
// =============================================================================

async function runAllTests() {
    console.log("🚀 Iniciando testes dos repositories...\n");

    try {
        await cleanDatabase();

        const baseUser = await testUserBaseMethods();
        await testUserDynamicMethods();
        await testProductBaseMethods(baseUser.id);
        await testProductDynamicMethods(baseUser.id);
        await testRelations();
        await testIncludeModels();
        await testRawInclude();
        await testTransactions();

        console.log("\n✅✅✅ Todos os testes concluídos com sucesso!\n");
    } catch (err) {
        console.error("\n❌ Erro durante os testes:", err);
        process.exit(1);
    }
}

runAllTests();
