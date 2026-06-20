// * Nesse arquivo vamos testar como o "requiredWhere" funciona na prática. Ele é um filtro que fica "preso" ao
// * repository e é injetado automaticamente em (quase) toda operação, muito útil para soft-delete, multi-tenancy
// * ou qualquer regra de negócio que precise valer pra tudo

import { UserType } from "../../generated/prisma/enums";
import { userRepository } from "../repositories";

// * Essa será a função que utilizaremos para testar o requiredWhere
async function requiredWhereTest() {
    // * Lembrando a configuração do "userRepository" (declarada em "examples/repositories.ts"):
    // * requiredWhere: { active: true }
    // * Ou seja, por padrão, TODA operação desse repository só enxerga usuários com "active: true"

    // * Vamos criar um usuário ativo e depois torná-lo inativo para ver o comportamento
    const activeUser = await userRepository.save(
        {
            name: "Usuário Ativo",
            email: "ativo@email.com",
            password: "senha123",
            likesVSRepo: true,
            userType: UserType.COMMON,
            active: true,
        },
        { selectModel: "internal" },
    );

    console.log("\nUsuário ativo criado:", activeUser);

    activeUser.active = false;
    activeUser.email = "inativo@email.com";
    activeUser.name = "Usuário Inativo";
    const inactiveUser = await userRepository.save(activeUser, { selectModel: "internal" });

    console.log("\nUsuário desativado:", inactiveUser);

    // ! Repare que o "save" conseguiu desativar o usuário normalmente. Isso acontece porque, lá no repositories.ts,
    // ! configuramos "baseMethods.save.ignoreRequiredWhere: true", ou seja, o "save" ignora o requiredWhere no upsert
    // ! (do contrário, o Prisma tentaria localizar o registro já aplicando "active: true" e como o usuário que passamos
    // ! já tinha id o upsert não iria encontrar ele e daria erro)

    // * Agora vamos tentar buscar o usuário inativo usando o "get" comum
    const foundInactiveUser = await userRepository.get(inactiveUser.id);

    // * Esse log vai mostrar "null", pois o requiredWhere "active: true" foi injetado automaticamente na
    // * busca e o usuário inativo não passa nesse filtro
    console.log("\nTentando buscar usuário inativo com 'get' (esperado: null):", foundInactiveUser);

    // * O mesmo vale pros métodos dinâmicos baseados em "By": como "findOneByEmailAndUserType"
    const foundByEmail = await userRepository.findOneByEmailAndUserType(
        "inativo@email.com",
        UserType.COMMON,
    );

    // * Esse também retorna "null" pelo mesmo motivo: o requiredWhere é combinado (AND) com o filtro do método
    console.log("\nBuscando usuário inativo por email e tipo (esperado: null):", foundByEmail);

    // * Criando um usuário ativo
    const otherUser = await userRepository.save({
        name: "Outro Usuário Ativo",
        email: "other@email.com",
        password: "senha321",
        likesVSRepo: true,
        userType: UserType.COMMON,
        active: true,
    });

    // * Já um usuário ativo é encontrado normalmente, pois ele passa no requiredWhere
    const foundOtherUser = await userRepository.get(otherUser.id);
    console.log("\nBuscando usuário ativo com 'get' (esperado: encontrar):", foundOtherUser);

    // * Existem 2 formas de "burlar" o requiredWhere quando for necessário: configurando "ignoreRequiredWhere" no
    // * "baseMethods" (já vimos no save) ou usando "whereType: 'overwrite'" em métodos dinâmicos

    // * O método "findInternalByEmail" foi configurado assim em repositories.ts:
    // * proxyTo: "findOneByEmail", whereType: "overwrite", selectModel: "internal"
    // * Isso significa que ele ignora completamente o requiredWhere e ainda retorna os dados internos (com senha)
    const internalInactiveUser = await userRepository.findInternalByEmail("inativo@email.com");

    // * Agora sim o usuário inativo é encontrado, pois esse método específico está marcado como "overwrite"
    console.log(
        "\nBuscando usuário inativo com 'findInternalByEmail' (ignora requiredWhere):",
        internalInactiveUser,
    );

    // * Também é possível ignorar o requiredWhere de um método base pontualmente, lembrando que no repositories.ts
    // * configuramos "baseMethods.getOrThrow.ignoreRequiredWhere: true"
    const inactiveUserViaGetOrThrow = await userRepository.getOrThrow(inactiveUser.id);
    console.log(
        "\nBuscando usuário inativo com 'getOrThrow' (ignoreRequiredWhere ativado):",
        inactiveUserViaGetOrThrow,
    );

    // * Importante: o requiredWhere também é combinado em operações de contagem e checagem de existência
    const totalUsers = await userRepository.total();
    console.log(
        "\nTotal de usuários (considerando só os ativos por causa do requiredWhere):",
        totalUsers,
    );

    const existsInactive = await userRepository.has(inactiveUser.id);

    // * "has" usa o pkName internamente em um select mínimo, mas o requiredWhere ainda é aplicado, então o
    // * usuário inativo não "existe" do ponto de vista desse repository
    console.log("\nUsuário inativo existe (via 'has', esperado: false):", existsInactive);

    // * E por fim, o "remove" aplica o requiredWhere por padrão (o padrão de "ignoreRequiredWhere" no remove é
    // * "false"), e como não sobrescrevemos essa config em repositories.ts, vamos confirmar o comportamento padrão
    // * removendo o usuário ativo, que sabemos que passa no filtro
    await userRepository.remove(otherUser.id);
    console.log("\nUsuário ativo removido com sucesso");

    // * Para limpar o usuário inativo do banco, como o "remove" comum aplicaria o requiredWhere (e ele não passaria),
    // * vamos usar o "deleteManyByIdIn", que está configurado com "whereType: 'overwrite'" em repositories.ts
    await userRepository.deleteManyByIdIn([inactiveUser.id]);
    console.log(
        "\nUsuário inativo removido com sucesso (via deleteManyByIdIn, que ignora o requiredWhere)",
    );
}

// * Agora para testar o requiredWhere a gente chama a função para executar todas as operações
// TODO Rode pnpm tsx .\examples\tests\required-where.test.ts ou npx tsx .\examples\tests\required-where.test.ts para executar o código
void requiredWhereTest();
