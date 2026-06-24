// * Nesse arquivo vamos testar o "soft-delete" do VSRepository. Ao configurar o "softRemovekName" no
// * setupVSRepo, o repository ganha automaticamente 4 novos métodos base: softRemove, softRemoveList,
// * restore e restoreList. Além disso, o campo "see" em MethodOptions (e nos métodos "total" e "has")
// * permite controlar se a query enxerga registros ativos, removidos ou todos.

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * Essa será a função que utilizaremos para testar o soft-delete
async function softDeleteTest() {
    // * Antes de tudo, vamos criar um usuário e alguns produtos para servir de dados de teste
    const user = await userRepository.save({
        name: "Larissa Mendes",
        email: "larissa@email.com",
        password: "senha123",
        likesVSRepo: true,
        userType: UserType.COMMON,
    });

    const product1 = await productRepository.save({
        name: "Camiseta VSRepo",
        price: 59.9,
        userId: user.id,
    });
    const product2 = await productRepository.save({
        name: "Caneca VSRepo",
        price: 29.9,
        userId: user.id,
    });
    const product3 = await productRepository.save({
        name: "Adesivo VSRepo",
        price: 4.9,
        userId: user.id,
    });

    console.log("\nProdutos criados:", [product1.name, product2.name, product3.name]);

    // * -----------------------------------------------------------------------
    // * 1) softRemove — soft-delete de um único registro
    // * -----------------------------------------------------------------------

    // * "softRemove" marca o registro como removido preenchendo o campo "deletedAt" com o timestamp atual.
    // ! Importante: o registro NÃO é apagado do banco — ele continua lá, mas o VSRepository o trata como
    // ! "removido" por padrão em todas as operações
    const removedProduct1 = await productRepository.softRemove(product1.id);

    console.log("\nProduto 1 após softRemove (deletedAt preenchido):", removedProduct1.deletedAt);

    // * -----------------------------------------------------------------------
    // * 2) SeeMode — controlando quais registros a query enxerga
    // * -----------------------------------------------------------------------

    // * Por padrão, todas as operações do repository enxergam apenas registros "ativos" (sem deletedAt).
    // * Para mudar esse comportamento pontualmente, passamos "see" nas options da chamada.
    // *
    // * Os valores possíveis do SeeMode são:
    // *   "active"  → só registros não removidos (padrão)
    // *   "removed" → só registros removidos (deletedAt não nulo)
    // *   "all"     → todos os registros, independente do status

    // * Tentando buscar o produto removido com o comportamento padrão ("active")
    const notFound = await productRepository.get(product1.id);
    console.log("\nBuscando produto removido sem see (padrão 'active') → esperado null:", notFound);

    // * Agora buscando o mesmo produto removido com see: "removed"
    const foundRemoved = await productRepository.get(product1.id, { see: "removed" });
    console.log(
        "\nBuscando produto removido com see: 'removed' → esperado: encontrar:",
        foundRemoved?.name,
    );

    // * E com see: "all" a gente enxerga tanto ativos quanto removidos
    const allProducts = await productRepository.getAll({ see: "all" });
    console.log(
        "\ngetAll com see: 'all' (ativos + removidos):",
        allProducts.map(p => ({ name: p.name, deletedAt: p.deletedAt })),
    );

    // * -----------------------------------------------------------------------
    // * 3) softRemoveList — soft-delete em lote
    // * -----------------------------------------------------------------------

    // * "softRemoveList" funciona igual ao softRemove mas para múltiplos registros de uma vez,
    // * retornando um objeto { count } com a quantidade de registros afetados.
    const { count: softRemovedCount } = await productRepository.softRemoveList([
        product2.id,
        product3.id,
    ]);
    console.log(
        "\nProdutos 2 e 3 após softRemoveList (count de soft-removidos):",
        softRemovedCount,
    );

    // * Confirmar que o total de produtos "ativos" agora é 0 (todos foram soft-removidos)
    const totalAtivos = await productRepository.total();
    console.log("\nTotal de produtos ativos após soft-remover tudo (esperado: 0):", totalAtivos);

    // * E o total de produtos removidos é 3
    const totalRemovidos = await productRepository.total({ see: "removed" });
    console.log("\nTotal de produtos removidos (esperado: 3):", totalRemovidos);

    // * O "has" também respeita o SeeMode: com see: "removed" ele enxerga registros soft-deletados
    const product1ExistsAsRemoved = await productRepository.has(product1.id, { see: "removed" });
    console.log("\nProduto 1 existe como removido? (esperado: true):", product1ExistsAsRemoved);

    const product1ExistsAsActive = await productRepository.has(product1.id);
    console.log("\nProduto 1 existe como ativo? (esperado: false):", product1ExistsAsActive);

    // * -----------------------------------------------------------------------
    // * 4) restore — restaurando um registro soft-deletado
    // * -----------------------------------------------------------------------

    // * "restore" desfaz o soft-delete de um único registro: limpa o campo "deletedAt" (coloca null)
    // * e o registro volta a ser visível nas operações padrão ("active")
    const restoredProduct1 = await productRepository.restore(product1.id);

    console.log("\nProduto 1 após restore (deletedAt deve ser null):", restoredProduct1.deletedAt);

    // * Agora o produto 1 já pode ser encontrado normalmente de novo
    const foundAgain = await productRepository.get(product1.id);
    console.log("\nBuscando produto 1 após restore (esperado: encontrar):", foundAgain?.name);

    // * -----------------------------------------------------------------------
    // * 5) restoreList — restaurando múltiplos registros
    // * -----------------------------------------------------------------------

    // * "restoreList" funciona igual ao restore mas para uma lista de PKs, retornando um objeto
    // * { count } com a quantidade de registros restaurados
    const { count: restoredCount } = await productRepository.restoreList([
        product2.id,
        product3.id,
    ]);
    console.log("\nProdutos 2 e 3 após restoreList (count de restaurados):", restoredCount);

    // * Confirmar que todos os produtos ativos voltaram
    const totalAtivosAoFinal = await productRepository.total();
    console.log(
        "\nTotal de produtos ativos após restore de tudo (esperado: 3):",
        totalAtivosAoFinal,
    );

    // * -----------------------------------------------------------------------
    // * 6) Limpeza final
    // * -----------------------------------------------------------------------

    // ! Como "Product" tem "onDelete: Cascade" ligado ao usuário, remover o usuário já remove os
    // ! produtos permanentemente — então basta apagar o usuário
    await userRepository.deleteManyByIdIn([user.id]);
}

// * Agora para testar o soft-delete a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx examples/tests/soft-delete.test.ts ou npx tsx examples/tests/soft-delete.test.ts para executar o código
void softDeleteTest();
