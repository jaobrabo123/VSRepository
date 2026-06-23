// * Agora que já configuramos nos repositories vamos começar os teste, primeiro vamos começar a testar os métodos base que já vêm ao criar um repository

import { UserType } from "../../generated/prisma/enums";
import { userRepository } from "../repositories";

// * Essa será a função que utilizaremos para testar os métodos base
async function baseMethodsTest() {
    // * Bom, para começar vamos testar o getAll para buscar todos os usuários, ela pode receber uma configuração de paginação e ordenação como parâmetro,
    // * vamos começar tentando buscar 20 registros
    // TODO Passe o cursor do mouse em cima de "getAllResult" para ver a tipagem dele, ela está conforme o nosso modelo "public" que definimos como default no repository
    const getAllResult = await userRepository.getAll({ pagination: { take: 20 } });

    // * Como ainda não cadastramos nenhum usuário provavelmente não retornou nada, mas vamos dar um console.log para ver o resultado
    console.log("\nResultado do 'getAll':", getAllResult);

    // * Agora vamos popular nossa base de dados com alguns usuários, como o VSRepository *ainda* não tem suporte à um método como "saveMany" ou "saveList"
    // * para salvar vários registros de uma vez, vamos fazer um save de cada vez. No entanto, uma opção mais robusta seria usar o createMany que declaramos
    // * no nosso repository para usar o createMany nativo do Prisma (um createManyAndReturn também seria uma opção), mas nesse caso vamos usar o save
    // TODO Passe o cursor do mouse em cima de cada um deles para ver a tipagem, note que até então a senha nunca está sendo retornada
    const user1 = await userRepository.save({
        name: "João",
        email: "joao@email.com",
        likesVSRepo: true,
        password: "çenhaBeimSegura",
        userType: UserType.ADMIN,
    });
    const user2 = await userRepository.save({
        name: "Um cara paia",
        email: "cara@paia.com",
        likesVSRepo: false,
        password: "senha123",
        userType: UserType.COMMON,
    });
    const user3 = await userRepository.save({
        name: "Tony Stark",
        email: "tony@stark.com",
        password: "jarvi5123",
        likesVSRepo: true,
        userType: UserType.ADMIN,
    });

    // * Agora vamos ver no console cada um dos usuários
    console.log("\nUsuário 1:", user1);
    console.log("\nUsuário 2:", user2);
    console.log("\nUsuário 3:", user3);

    // * Podemos conferir o total de usuários com o método "total"
    const totalUsers = await userRepository.total();
    console.log("\nTotal de usuários:", totalUsers);

    // * Podemos validar rapidamente se um usuário existe usando o "has"
    const user1Exists = await userRepository.has(user1.id);
    console.log("\nUsuário 1 existe?", user1Exists);

    // * Podemos também alterar parcialmente os dados do usuário usando o "patch"
    const updatedUser2 = await userRepository.patch(user2.id, {
        likesVSRepo: true,
        name: "Um cara gente boa",
        email: "gente@boa.com",
    });
    console.log("\nUsuário 2 atualizado:", updatedUser2);

    // * Para buscar um usuário específico usamos o "get" passando o id dele
    // * Nesse caso vamos também escolher um selectModel específico (sem ser o default) para ver a diferença no resultado
    // TODO Passe o mouse em cima de "internalUser3" para ver que agora estamos retornando a senha
    const internalUser3 = await userRepository.get(user3.id, { selectModel: "internal" });
    console.log("\nDados internos do usuário 3:", internalUser3);

    // * Também podemos atualizar um usuário com o "save", desde que o objeto fornecido contenham o id do usuário para o save realizar o "upsert"
    // ? Aqui afirmamos que o usuário não é null como '!' pois o get retorna os dados do usuário se achar ou null se não encontrar
    // ? porém nesse caso a gente "tem certeza" que ele existe
    internalUser3!.password = "J4rv1s0987";
    internalUser3!.email = "jarvis@email.com";

    const updatedUser3 = await userRepository.save(internalUser3!);
    console.log("\nUsuário 3 atualizado:", updatedUser3);

    // * Para termos realmente certeza que um registro existe de tentar fazer alguma coisa, podemos usar o "getOrThrow", ele busca um usuário pelo id e lança
    // * um erro se não encontrar
    try {
        // * Para testar vamos tentar buscar um usuário que não existe
        const unknownUser = await userRepository.getOrThrow(crypto.randomUUID());
        console.log("\nEsse log não vai aparecer:", unknownUser);
    } catch (error: any) {
        console.log("\nErro esperado:", error.message);
    }

    // * Podemos também remover um usuário específico com o "remove"
    await userRepository.remove(user2.id);

    // * Agora buscamos todos os usuários com "getAlL" para conferir se o Usuário 2 realmente foi removido
    const allUsers = await userRepository.getAll();
    console.log("\nTodos os usuários:", allUsers);

    // * Bom, e para não deixar o nosso banco poluído vamos remover tudo que a gente criou nesse teste
    // * OBS: aqui estamos usando o "deleteManyByIdIn" pois lá na instância do nosso repository desativamos o "removeList"
    await userRepository.deleteManyByIdIn([user1.id, user2.id, user3.id]);
}

// * Agora para testar os métodos base a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx .\examples\tests\base-methods.test.ts ou npx tsx .\examples\tests\base-methods.test.ts para executar o código
void baseMethodsTest();
