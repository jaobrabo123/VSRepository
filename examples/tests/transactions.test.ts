// * Nesse arquivo vamos testar transactions com o VSRepository. A ideia central é: o `.build(prisma)` guarda a
// * instância do PrismaClient que você passou, e ela fica disponível em "repository.prisma". Isso é o que permite
// * abrir uma transaction nativa do Prisma e fazer múltiplos repositories participarem dela

import { userRepository, productRepository, addressRepository } from "../repositories";
import { UserType } from "../../generated/prisma/enums";
import { VSRepoError } from "../../generated/vsrepo";
import { User } from "../../generated/prisma/client";

// * Essa será a função que utilizaremos para testar as transactions
async function transactionsTest() {
    // * ---------------------------------------------------------------------
    // * 1) ACESSANDO A INSTÂNCIA DO PRISMA VIA "repository.prisma"
    // * ---------------------------------------------------------------------

    // * Todo repository construído com ".build(prisma)" guarda essa mesma instância em ".prisma". Isso é só o
    // * PrismaClient "puro" por trás, então qualquer método nativo dele (como "$transaction", "$queryRaw", etc.)
    // * está disponível normalmente
    // TODO Passe o mouse em cima de "userRepository.prisma" para ver que o tipo é exatamente "PrismaClient"
    console.log("\nuserRepository.prisma é a mesma instância passada no build:", userRepository.prisma === productRepository.prisma);

    // ! Repare que comparamos "userRepository.prisma" com "productRepository.prisma" e o resultado é "true": isso
    // ! acontece porque, em "examples/repositories.ts", todos os repositories foram construídos com a MESMA
    // ! instância de PrismaClient (importada de "examples/prisma.ts"). Não é obrigatório ser assim, mas é o cenário
    // ! mais comum e é justamente o que permite todos eles participarem da mesma transaction, além de ser a melhor prática

    // * ------------------------------------------------------------------------------------
    // * 2) TRANSACTION COM SUCESSO: múltiplos repositories participando da mesma transaction
    // * ------------------------------------------------------------------------------------

    // * Todo método do VSRepository aceita um último argumento de opções com um campo "db". 
    // * Quando você passa o "tx" recebido pelo "$transaction" nesse campo, a operação passa a
    // * rodar DENTRO daquela transaction ao invés de usar a conexão "solta" do PrismaClient
    const { user, address, product } = await userRepository.prisma.$transaction(async (tx) => {
        // * Criando o usuário dentro da transaction (repare no "{ db: tx }" no final)
        const createdUser = await userRepository.save(
            {
                name: "Beatriz Souza",
                email: "beatriz@email.com",
                password: "senha123",
                likesVSRepo: true,
                userType: UserType.COMMON,
            },
            { db: tx },
        );

        // * Criando o endereço desse usuário, também dentro da MESMA transaction, mas usando o "addressRepository"
        const createdAddress = await addressRepository.save(
            {
                userId: createdUser.id,
                city: "Aracaju",
                state: "SE",
                country: "Brasil",
            },
            { db: tx },
        );

        // * E criando um produto vinculado a esse usuário, também participando da transaction
        const createdProduct = await productRepository.save(
            {
                name: "Camiseta VSRepo",
                price: 59.9,
                userId: createdUser.id,
            },
            { db: tx },
        );

        // * Se chegarmos até aqui sem nenhum erro lançado, o Prisma faz o COMMIT automaticamente ao final do
        // * callback, persistindo as 3 operações de uma vez só
        return { user: createdUser, address: createdAddress, product: createdProduct };
    });

    console.log("\nTransaction concluída com sucesso, registros criados:", { user, address, product });

    // * ---------------------------------------------------------------------
    // * 3) TRANSACTION COM ROLLBACK: um erro no meio desfaz tudo
    // * ---------------------------------------------------------------------

    // * Agora vamos simular um cenário de falha: o campo "userId" do "Address" é "@unique" no schema.prisma
    // * (relação one-to-one de verdade), ou seja, não é possível ter 2 endereços para o mesmo usuário. Vamos
    // * tentar criar um segundo usuário válido, mas um endereço com um "userId" que já está em uso, dentro da
    // * MESMA transaction, pra ver o rollback acontecendo

    let usuarioDaFalha: User | null = null;

    try {
        await userRepository.prisma.$transaction(async (tx) => {
            // * Esse usuário é criado normalmente dentro da transaction...
            const novoUsuario = await userRepository.save(
                {
                    name: "Rafael Lima",
                    email: "rafael@email.com",
                    password: "senha123",
                    likesVSRepo: true,
                    userType: UserType.COMMON,
                },
                { db: tx, selectModel: "internal" },
            );

            usuarioDaFalha = novoUsuario;

            // * ...porém aqui forçamos um erro: tentamos criar um endereço usando o "userId" do "Beatriz Souza",
            // * que JÁ TEM um endereço (criado no passo anterior). Como "userId" é "@unique" em Address, o Prisma
            // * vai lançar um erro de violação de constraint
            await addressRepository.save(
                {
                    userId: user.id, // * userId que já possui endereço, isso vai gerar conflito
                    city: "Recife",
                    state: "PE",
                    country: "Brasil",
                },
                { db: tx },
            );

            // * Esse "console.log" nunca é executado, pois o erro acima interrompe a transaction antes de chegar
            // * aqui
            console.log("Essa linha nunca deveria aparecer no console");
        });
    } catch (error) {
        // ! Quando qualquer operação dentro do callback do "$transaction" lança um erro, o Prisma desfaz (rollback)
        // ! TUDO que foi feito dentro daquele callback, incluindo o "novoUsuario" que tínhamos acabado de criar
        // ! Nesse caso específico o erro vem do PRISMA (violação de constraint @unique), não do VSRepoError, por
        // ! isso checamos "VSRepoError" primeiro e caímos no "else" para o erro nativo do Prisma. O VSRepoError é
        // ! lançado em situações específicas do próprio VSRepository (ex: configuração inválida), não substitui os
        // ! erros que o Prisma já lança
        if (error instanceof VSRepoError) {
            console.log("\nErro tratado pelo VSRepository (VSRepoError):", error.message);
        } else {
            console.log("\nErro de constraint do banco, lançado pelo Prisma (violação do @unique em Address.userId):", (error as Error).message);
        }
    }

    // * Vamos confirmar que o rollback realmente aconteceu: o "Rafael Lima" NÃO deveria existir no banco, mesmo
    // * tendo sido criado com sucesso antes do erro, pois ele fazia parte da mesma transaction que falhou
    // ? Aquele 'as' serve para o TS não ficar acusando ele como 'never'
    const rafaelExiste = usuarioDaFalha ? await userRepository.has((usuarioDaFalha as User).id) : false;

    // * Esse log deve mostrar "false": é a prova de que o rollback desfez a criação do "Rafael Lima" também,
    // * mesmo o erro tendo ocorrido em uma operação posterior (a do Address)
    console.log("\nO usuário criado antes do erro ainda existe no banco? (esperado: false):", rafaelExiste);

    // * --------------------------------------------------------------------------
    // * 4) USANDO "options.db" FORA DE UM "$transaction" (com a instância "solta")
    // * --------------------------------------------------------------------------

    // * O campo "db" não serve só para transactions: ele aceita qualquer "ClientOrTransaction", então também é
    // * possível passar a própria instância "solta" do prisma (sem estar dentro de uma transaction). Na prática
    // * isso é o mesmo que não passar "db" nenhum, mas é útil em cenários onde você recebe o client por injeção
    // * de dependência e não sabe se é uma transaction ou não
    const userViaDbSolto = await userRepository.get(user.id, { db: userRepository.prisma });
    console.log("\nBuscando usuário passando a instância 'solta' do prisma em options.db:", userViaDbSolto);

    // * Por fim, vamos limpar tudo que criamos nesse teste
    // ! Como "Address" e "Product" têm "onDelete: Cascade" no schema.prisma, remover o usuário já remove o
    // ! endereço e os produtos dele automaticamente
    await userRepository.remove(user.id);
}

// * Agora para testar as transactions a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx .\examples\tests\transactions.test.ts ou npx tsx .\examples\tests\transactions.test.ts para executar o código
void transactionsTest();
