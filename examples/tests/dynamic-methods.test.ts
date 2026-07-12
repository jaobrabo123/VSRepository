// * Nesse arquivo vamos testar os "métodos dinâmicos", que são os métodos que declaramos em "methods" no
// * repositories.ts e têm o comportamento inferido automaticamente a partir do próprio nome

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * Essa será a função que utilizaremos para testar os métodos dinâmicos
async function dynamicMethodsTest() {
    // * Antes de tudo vamos popular o banco com alguns usuários e produtos para termos dados pra brincar
    const user1 = await userRepository.save({
        name: "Ana Beatriz",
        email: "ana@email.com",
        password: "senha123",
        likesVSRepo: true,
        userType: UserType.ADMIN,
    });
    const user2 = await userRepository.save({
        name: "Carlos Eduardo",
        email: "carlos@email.com",
        password: "senha123",
        likesVSRepo: false,
        userType: UserType.COMMON,
    });
    const user3 = await userRepository.save({
        name: "Ana Clara",
        email: "anaclara@email.com",
        password: "senha123",
        likesVSRepo: true,
        userType: UserType.COMMON,
    });

    console.log("\nUsuários criados para o teste:", [user1.name, user2.name, user3.name]);

    // * -------------------------------------------------------------
    // * 1) PREFIXOS: cada prefixo decide qual operação será realizada
    // * -------------------------------------------------------------

    // * "findByUserType" usa o prefixo "findBy", que por padrão retorna uma LISTA (findMany)
    const admins = await userRepository.findByUserType(UserType.ADMIN);
    console.log("\nTodos os admins (findByUserType):", admins);

    // * "findUniqueByEmail" usa o prefixo "findUniqueBy", que chama o "findUnique" do Prisma e exige que o
    // * campo buscado seja único no banco (no caso, "email" é "@unique" no schema.prisma)
    const userByEmail = await userRepository.findUniqueByEmail("ana@email.com");
    console.log("\nUsuário único pelo email (findUniqueByEmail):", userByEmail);

    // * "findUniqueOrThrowById" funciona como o "findUniqueByEmail", mas lança um erro se não encontrar
    const userOrThrow = await userRepository.findUniqueOrThrowById(user1.id);
    console.log("\nUsuário buscado com findUniqueOrThrowById:", userOrThrow);

    // * "findFirstByNameStartsWith" usa o prefixo "findFirstBy", que aceita filtros de campo e chama "findFirst"
    const firstAna = await userRepository.findFirstByNameStartsWith("Ana");
    console.log("\nPrimeiro usuário cujo nome começa com 'Ana' (findFirstByNameStartsWith):", firstAna);

    // * "countByUserType" usa o prefixo "countBy", que retorna a contagem (number) ao invés dos registros
    const totalAdmins = await userRepository.countByUserType(UserType.ADMIN);
    console.log("\nTotal de admins (countByUserType):", totalAdmins);

    // * "existsByEmail" usa o prefixo "existsBy", que retorna um boolean
    const emailExists = await userRepository.existsByEmail("carlos@email.com");
    console.log("\nO email 'carlos@email.com' existe? (existsByEmail):", emailExists);

    // * ------------------------------------------------------------------------
    // * 2) FILTROS DE CAMPO: sufixos aplicados ao nome do campo dentro do método
    // * ------------------------------------------------------------------------

    // * "findByUserTypeOrEmailEndsWith" combina o operador lógico "Or" com o filtro "EndsWith"
    const adminsOrComEmailCom = await userRepository.findByUserTypeOrEmailEndsWith(UserType.ADMIN, "@email.com");
    console.log("\nAdmins OU emails terminados em '@email.com' (findByUserTypeOrEmailEndsWith):", adminsOrComEmailCom);

    // * "findByNameContainsInsensitiveOrderedAndPaginated" combina "Contains" + "Insensitive" (ignora maiúsculas/
    // * minúsculas) e ainda aceita ordenação e paginação manuais como parâmetros extras
    const anasPaginadas = await userRepository.findByNameContainsInsensitiveOrderedAndPaginated(
        "ana", // * filtro: nome contém "ana", ignorando case
        { name: "asc" }, // * ordenação manual
        { skip: 0, take: 5 }, // * paginação manual
    );
    console.log("\nUsuários com 'ana' no nome (case-insensitive), ordenados e paginados:", anasPaginadas);

    // * "findManyByNameOptional" tem o sufixo "Optional" no campo, ou seja, podemos passar "undefined" para
    // * não filtrar por nome e trazer todos os registros (ainda respeitando o requiredWhere, se houver)
    const todosSemFiltro = await userRepository.findManyByNameOptional(undefined);
    console.log("\nTodos os usuários, sem aplicar filtro de nome (findManyByNameOptional):", todosSemFiltro.length);

    // * Do lado do "productRepository" também temos filtros numéricos, como "findByPriceLessThan" e "findByPriceBetween"
    const product1 = await productRepository.save({ name: "Caneta VSRepo", price: 9.9, userId: user1.id });
    const product2 = await productRepository.save({ name: "Caderno VSRepo", price: 24.9, userId: user1.id });
    const product3 = await productRepository.save({ name: "Mochila VSRepo", price: 149.9, userId: user1.id });

    const cheapProducts = await productRepository.findByPriceLessThan(25);
    console.log("\nProdutos com preço menor que 25 (findByPriceLessThan):", cheapProducts);

    // * "Between" recebe uma tupla [min, max]
    const midRangeProducts = await productRepository.findByPriceBetween([10, 30]);
    console.log("\nProdutos com preço entre 10 e 30 (findByPriceBetween):", midRangeProducts);

    // * ---------------------------------------------------------------------
    // * 3) OPERADORES LÓGICOS: "And" entre campos e "Or" entre campos
    // * ---------------------------------------------------------------------

    // * "findOneByEmailAndUserType" exige que AMBOS os campos batam)
    const exactMatch = await userRepository.findOneByEmailAndUserType("ana@email.com", UserType.ADMIN);
    console.log("\nUsuário com email E userType específicos (findOneByEmailAndUserType):", exactMatch);

    // * ---------------------------------------------------------------------
    // * 4) MÉTODOS COM NOME PERSONALIZADO (proxyTo)
    // * ---------------------------------------------------------------------

    // * "buscarUsuariosPaias" é um nome totalmente fora do padrão da lib, por isso no repositories.ts ele foi
    // * configurado com "proxyTo: 'findByLikesVSRepoIsFalse'", delegando o comportamento pra esse padrão válido
    const usuariosPaias = await userRepository.buscarUsuariosPaias();
    console.log("\nUsuários que não curtem o VSRepository (buscarUsuariosPaias -> proxyTo):", usuariosPaias);

    // * ---------------------------------------------------------------------
    // * 5) SUFIXOS DE PAGINAÇÃO E ORDENAÇÃO
    // * ---------------------------------------------------------------------

    // * "findByLikesVSRepoIsTruePaginated" combina o modificador "IsTrue" (que NÃO recebe argumento, pois o valor
    // * "true" já está fixo no nome do método) com o sufixo "Paginated", que injeta o argumento de paginação
    // * como único parâmetro da função
    const usuariosQueCurtem = await userRepository.findByLikesVSRepoIsTruePaginated({ skip: 0, take: 10 });
    console.log("\nUsuários que curtem o VSRepository, paginados (findByLikesVSRepoIsTruePaginated):", usuariosQueCurtem);

    // * ---------------------------------------------------------------------
    // * 6) SUFIXO DISTINCT
    // * ---------------------------------------------------------------------

    // * "findManyDistinctUserTypeAndLikesVSRepo" não recebe nenhum filtro de campo, só o sufixo "Distinct" com 2
    // * campos separados por "And". Como user1=(ADMIN,true), user2=(COMMON,false) e user3=(COMMON,true) formam 3
    // * combinações diferentes, o retorno aqui terá 1 registro para cada uma delas
    const combinacoesUnicas = await userRepository.findManyDistinctUserTypeAndLikesVSRepo();
    console.log(
        "\nUma combinação de (userType, likesVSRepo) por registro (findManyDistinctUserTypeAndLikesVSRepo):",
        combinacoesUnicas,
    );

    // * "findManyDistinctUserTypePaginated" combina "Distinct" com o sufixo "Paginated" — aqui o distinct é só em
    // * "userType", então mesmo tendo 2 usuários "COMMON" (user2 e user3), o retorno traz só 1 registro de cada
    // * userType (ADMIN e COMMON)
    const tiposUnicos = await userRepository.findManyDistinctUserTypePaginated({ skip: 0, take: 10 });
    console.log("\nUm registro por userType (findManyDistinctUserTypePaginated):", tiposUnicos);

    // * "findManyByLikesVSRepoDistinctUserType" combina um filtro de campo comum ("likesVSRepo") com o "Distinct"
    // * em outro campo ("userType"). Filtrando só quem tem likesVSRepo=true (user1, ADMIN, e user3, COMMON) e
    // * aplicando distinct em "userType", o resultado traz 2 registros: um ADMIN e um COMMON, ambos com
    // * likesVSRepo=true
    const porTipoQuemCurte = await userRepository.findManyByLikesVSRepoDistinctUserType(true);
    console.log(
        "\nUm registro por userType, apenas entre quem curte o VSRepository (findManyByLikesVSRepoDistinctUserType):",
        porTipoQuemCurte,
    );

    // * ---------------------------------------------------------------------
    // * 7) OPERAÇÕES NATIVAS DO PRISMA EXPOSTAS COMO MÉTODOS DINÂMICOS
    // * ---------------------------------------------------------------------

    // * "updateById" usa o prefixo "updateBy" (operação "update" do Prisma) filtrando pelo "id"
    const updatedUser2 = await userRepository.updateById(user2.id, { name: "Carlos Eduardo Silva" });
    console.log("\nUsuário atualizado via updateById:", updatedUser2);

    // * "upsertByEmail" cria ou atualiza com base no email, recebendo os objetos de "update" e "create"
    const upsertedUser = await userRepository.upsertByEmail(
        "novo@email.com",
        { name: "Usuário Atualizado" }, // * update: usado se já existir um usuário com esse email
        {
            name: "Usuário Novo",
            email: "novo@email.com",
            password: "senha123",
            likesVSRepo: true,
            userType: UserType.COMMON,
        }, // * create: usado se não existir
    );
    console.log("\nResultado do upsertByEmail:", upsertedUser);

    // * Por fim, vamos limpar tudo que criamos nesse teste
    // ! Aqui usamos "removeList" para os produtos, pois diferente do userRepository, o productRepository não tem o
    // ! método dinâmico "deleteManyByIdIn" configurado em repositories.ts (cada repository expõe só os métodos que
    // ! você decidir mapear em "methods")
    await productRepository.removeList([product1.id, product2.id, product3.id]);
    await userRepository.deleteManyByIdIn([user1.id, user2.id, user3.id, upsertedUser.id]);

    process.exit(0);
}

// * Agora para testar os métodos dinâmicos a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx .\examples\tests\dynamic-methods.test.ts ou npx tsx .\examples\tests\dynamic-methods.test.ts para executar o código
void dynamicMethodsTest();
