// * Nesse arquivo vamos testar como as "relations" funcionam na prática, tanto na hora de salvar/atualizar (save/patch)
// * quanto na hora de buscar dados relacionados (select e filtros de relação)

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * Essa será a função que utilizaremos para testar as relações
async function relationsTest() {
    // * Lembrando a configuração de relations do "userRepository" (declarada em "examples/repositories.ts"):
    // * - address: one-to-one (oto), restriction "set"  -> sempre que enviado, substitui o endereço atual
    // * - products: one-to-many (otm), restriction "add" -> adiciona/atualiza produtos sem apagar os que já existem

    // * Vamos começar criando um usuário já com endereço e produtos no mesmo "save", o VSRepository cuida de criar
    // * tudo isso de forma relacionada para a gente, sem precisarmos configurar manualmente na chamada ao Prisma
    // TODO Passe o cursor do mouse em cima de "user1" para ver que o autocomplete sugere "address" e "products" no payload, isso só
    // TODO é possível pois usamos o "UserGetPayload" com "include" lá no repositories.ts
    const user1 = await userRepository.save({
        name: "Maria",
        email: "maria@email.com",
        password: "senhaForte123",
        likesVSRepo: true,
        userType: UserType.COMMON,
        address: {
            city: "São Paulo",
            state: "SP",
            country: "Brasil",
        },
        products: [
            { name: "Camiseta VSRepo", price: 59.9, description: "Camiseta oficial" },
            { name: "Caneca VSRepo", price: 29.9 },
        ],
    });

    console.log("\nUsuário criado com endereço e produtos:", user1);

    // * Repare que o "save" já devolve o endereço e os produtos criados dentro do objeto retornado, pois o selectModel
    // * "public" desse repository inclui "address" e "products" (veja em examples/repositories.ts)

    // * Agora vamos testar a restriction "set" no "address": ao enviar um novo endereço no "patch", o anterior é
    // * completamente substituído (não fica endereço "órfão" no banco, pois é uma relação one-to-one)
    const userWithNewAddress = await userRepository.patch(user1.id, {
        address: {
            city: "Rio de Janeiro",
            state: "RJ",
            country: "Brasil",
        },
    });

    console.log("\nUsuário com endereço substituído (restriction 'set'):", userWithNewAddress);

    // * Já a restriction "add" no "products" funciona diferente: ao enviar um novo produto no "patch", ele é
    // * adicionado à lista, os produtos que já existiam continuam lá (não são removidos)
    const userWithNewProduct = await userRepository.patch(user1.id, {
        products: [{ name: "Boné VSRepo", price: 39.9 }],
    });

    // TODO Note no log abaixo que agora o usuário tem 3 produtos (os 2 criados no save + esse novo), pois a
    // TODO restriction "add" nunca remove os relacionamentos existentes
    console.log("\nUsuário com produto adicionado (restriction 'add'):", userWithNewProduct);

    // * Também podemos atualizar um produto específico de uma relação "otm" enviando o "id" dele dentro do array,
    // * nesse caso o VSRepository entende que é para atualizar e não criar um novo
    // ! Buscamos pelo "name" ao invés de usar uma posição fixa do array, pois o Prisma não garante a ordem de
    // ! retorno de uma relação sem um "orderBy" explícito
    const firstProductId = userWithNewProduct.products.find(p => p.name === "Camiseta VSRepo")!.id;

    const userWithUpdatedProduct = await userRepository.patch(user1.id, {
        products: [{ id: firstProductId, name: "Camiseta VSRepo (Promoção)", price: 39.9 }],
    });

    console.log("\nUsuário com produto atualizado pelo id:", userWithUpdatedProduct);

    // * Agora vamos ver os filtros de relação na prática, eles permitem filtrar uma entidade com base em campos
    // * de uma relação dela. Esses métodos já estão configurados em "examples/repositories.ts"

    // * "findByProductsSome" busca usuários que tenham AO MENOS um produto cadastrado
    const usersWithProducts = await userRepository.findByProductsSome();
    console.log("\nUsuários com pelo menos 1 produto:", usersWithProducts);

    // * "findByProductsNone" faz o oposto: busca usuários que NÃO tenham nenhum produto
    const usersWithoutProducts = await userRepository.findByProductsNone();
    console.log("\nUsuários sem nenhum produto:", usersWithoutProducts);

    // * "findByAddressWithout" busca usuários que NÃO tenham endereço cadastrado (relação "to-one" nula)
    const usersWithoutAddress = await userRepository.findByAddressWithout();
    console.log("\nUsuários sem endereço:", usersWithoutAddress);

    // * Também é possível filtrar por um campo específico dentro da relação, como o país do endereço
    const usersFromBrazil = await userRepository.findByAddressWithCountry("Brasil");
    console.log(
        "\nUsuários com endereço no Brasil (ordenados por estado/cidade):",
        usersFromBrazil,
    );

    // * Do lado do "productRepository" também temos filtros de relação, como o "findByTagsSomeName", que busca
    // * produtos que tenham uma tag com um nome específico (relação many-to-many)
    // * Vamos criar um produto com tags para testar
    const productWithTags = await productRepository.save({
        name: "Mochila VSRepo",
        price: 149.9,
        userId: user1.id,
        tags: [{ name: "promocao" }, { name: "novidade" }],
    });

    console.log("\nProduto criado com tags (relação many-to-many):", productWithTags);

    // * Repare que a relação "tags" usa "pk: 'name'" no repositories.ts, isso significa que se já existir uma
    // * tag chamada "promocao" ela será conectada ao produto ao invés de criar uma nova (evita duplicatas)
    const productsTaggedAsPromocao = await productRepository.findByTagsSomeName("promocao");
    console.log("\nProdutos com a tag 'promocao':", productsTaggedAsPromocao);

    // * Também podemos buscar produtos pelo email do usuário dono (relação many-to-one, "findByUserWithEmail")
    const productsFromMaria = await productRepository.findByUserWithEmail("maria@email.com");
    console.log("\nProdutos cujo dono tem o email 'maria@email.com':", productsFromMaria);

    // * Por fim, vamos limpar tudo que criamos nesse teste
    // ! Como a relação "user -> address" e "user -> product" têm "onDelete: Cascade" no schema.prisma, ao remover
    // ! o usuário o endereço e os produtos dele também são removidos automaticamente pelo banco
    await userRepository.deleteManyByIdIn([user1.id]);
}

// * Agora para testar as relações a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx .\examples\tests\relations.test.ts ou npx tsx .\examples\tests\relations.test.ts para executar o código
void relationsTest();
