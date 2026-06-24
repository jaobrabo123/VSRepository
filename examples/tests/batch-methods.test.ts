// * Nesse arquivo vamos testar os novos métodos base de operações em lote e o "merge":
// *
// *   getList    — busca múltiplos registros por uma lista de PKs (em uma única query)
// *   saveList   — salva um array de objetos em uma única transação automática (suporta relations)
// *   patchList  — atualiza parcialmente múltiplos registros via tuplas [pk, obj] em transação automática (suporta relations)
// *   merge      — busca um registro pela PK, faz deep merge em MEMÓRIA e retorna o resultado sem persistir

import { UserType } from "../../generated/prisma/enums";
import { userRepository, productRepository } from "../repositories";

// * Essa será a função que utilizaremos para testar os métodos em lote
async function batchMethodsTest() {
    // * -----------------------------------------------------------------------------------------
    // * 1) saveList — criando múltiplos registros em uma única transação, com suporte a relations
    // * -----------------------------------------------------------------------------------------

    // * "saveList" salva um array de objetos em uma única transação automática gerenciada pelo VSRepository.
    // * Cada objeto segue as mesmas regras do "save": se tiver a PK faz upsert, se não tiver faz create.
    // * Assim como o "save", o "saveList" gerencia relations automaticamente — basta incluí-las no payload.
    // TODO Passe o mouse em cima de "createdUsers" para ver a tipagem: é um array do selectModel "public"
    const createdUsers = await userRepository.saveList([
        {
            name: "Fernanda Costa",
            email: "fernanda@email.com",
            password: "senha123",
            likesVSRepo: true,
            userType: UserType.COMMON,
            // * Passando a relação "address" diretamente no payload — o VSRepository cria o endereço
            // * vinculado junto com o usuário, dentro da mesma transação
            address: {
                city: "Fortaleza",
                state: "CE",
                country: "Brasil",
            },
        },
        {
            name: "Gabriel Souza",
            email: "gabriel@email.com",
            password: "senha123",
            likesVSRepo: true,
            userType: UserType.ADMIN,
        },
        {
            name: "Helena Lima",
            email: "helena@email.com",
            password: "senha123",
            likesVSRepo: false,
            userType: UserType.COMMON,
        },
    ]);

    console.log(
        "\nUsuários criados com saveList:",
        createdUsers.map(u => ({ name: u.name, address: u.address })),
    );

    const [fernanda, gabriel, helena] = createdUsers;

    // * -----------------------------------------------------------------------
    // * 2) getList — buscando múltiplos registros por lista de PKs
    // * -----------------------------------------------------------------------

    // * "getList" faz uma única query ao banco para buscar vários registros de uma vez por uma lista de PKs.
    // ! Importante: a ORDER dos resultados pode não respeitar a ordem da lista de PKs que você passou.
    // * O seletor padrão (defaultSelectModel) é aplicado normalmente, assim como o requiredWhere.
    const foundUsers = await userRepository.getList([fernanda!.id, gabriel!.id, helena!.id]);

    console.log(
        "\nUsuários encontrados com getList:",
        foundUsers.map(u => u.name),
    );

    // * Assim como os outros métodos base, o "getList" aceita opções — inclusive um selectModel diferente
    const minimalUsers = await userRepository.getList([fernanda!.id, gabriel!.id], {
        selectModel: "minimal",
    });
    // TODO Passe o mouse em cima de "minimalUsers" para ver que só o "id" está disponível
    console.log("\ngetList com selectModel 'minimal' (apenas IDs):", minimalUsers);

    // * -----------------------------------------------------------------------------------------------
    // * 3) patchList — atualizando múltiplos registros em transação automática, com suporte a relations
    // * -----------------------------------------------------------------------------------------------

    // * "patchList" recebe um array de tuplas [pk, payload] e aplica o patch de cada uma dentro de uma
    // * única transação automática. Igual ao "patch", o "patchList" também gerencia relations automaticamente.
    // TODO Passe o mouse em cima de "updatedUsers" para ver que é um array do selectModel "public"
    const updatedUsers = await userRepository.patchList([
        [
            fernanda!.id,
            {
                name: "Fernanda Costa Silva",
                // * Atualizando o endereço da Fernanda via patchList — o VSRepository gerencia o "set"
                // * da relação "address" (configurada com restriction: "set" em repositories.ts)
                address: {
                    city: "Recife",
                    state: "PE",
                    country: "Brasil",
                },
            },
        ],
        [gabriel!.id, { userType: UserType.COMMON }],
        [helena!.id, { likesVSRepo: true, name: "Helena Lima Carvalho" }],
    ]);

    console.log(
        "\nUsuários após patchList:",
        updatedUsers.map(u => ({
            name: u.name,
            userType: u.userType,
            likesVSRepo: u.likesVSRepo,
            address: u.address,
        })),
    );

    // * -----------------------------------------------------------------------
    // * 4) merge — deep merge em MEMÓRIA (sem persistir no banco)
    // * -----------------------------------------------------------------------

    // * "merge" é análogo ao "preload" do TypeORM: ele busca o registro pela PK, faz um deep merge
    // * em memória com o objeto que você forneceu e devolve o resultado fundido — mas NÃO salva nada
    // * no banco. É responsabilidade de quem chama decidir o que fazer com o objeto retornado.
    // *
    // ? Quando usar merge vs patch?
    // *   patch  — modifica diretamente no banco sem carregar o objeto antes; retorna o estado atualizado
    // *   merge  — útil quando você precisa do estado fundido em memória antes de decidir se vai salvar,
    // *            aplicar validações adicionais, exibir preview de mudanças, ou montar um payload mais
    // *            complexo antes de chamar o save manualmente

    const productForMerge = await productRepository.save({
        name: "Mochila VSRepo",
        price: 149.9,
        description: "Mochila original",
        userId: fernanda!.id,
    });

    console.log("\nProduto antes do merge:", {
        name: productForMerge.name,
        price: Number(productForMerge.price),
        description: productForMerge.description,
    });

    // * O "merge" funde os campos em memória: os campos fornecidos sobrescrevem os existentes,
    // * os campos não fornecidos permanecem com o valor original do banco
    const mergedProduct = await productRepository.merge(
        productForMerge.id,
        {
            price: 129.9,
            description: "Edição limitada",
        },
        { selectModel: "publicWithoutUser" },
    );

    // TODO Passe o mouse em cima de "mergedProduct" para ver que o retorno é o tipo do selectModel "public" | null
    // * O merge retorna null se o registro não for encontrado (igual ao "get"), pois faz um "get" interno antes
    console.log(
        "\nProduto após merge em memória (preço e descrição fundidos, nada persistido ainda):",
        {
            name: mergedProduct?.name,
            price: Number(mergedProduct?.price),
            description: mergedProduct?.description,
        },
    );

    // * Se quiser persistir o resultado fundido, basta chamar o save com o objeto retornado pelo merge
    if (mergedProduct) {
        const savedAfterMerge = await productRepository.save(mergedProduct);
        console.log("\nProduto persistido após merge + save:", {
            name: savedAfterMerge.name,
            price: Number(savedAfterMerge.price),
            description: savedAfterMerge.description,
        });
    }

    // * -----------------------------------------------------------------------
    // * 5) Limpeza final
    // * -----------------------------------------------------------------------

    // ! Como "Product" e "Address" têm "onDelete: Cascade" ligado ao usuário, remover o usuário já
    // ! remove os produtos e o endereço dele permanentemente
    await userRepository.deleteManyByIdIn([fernanda!.id, gabriel!.id, helena!.id]);
}

// * Agora para testar os métodos em lote a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx examples/tests/batch-methods.test.ts ou npx tsx examples/tests/batch-methods.test.ts para executar o código
void batchMethodsTest();
