/*
 * Nesse arquivo vamos configurar todos os repostiories que vamos utilizar
 ! OBS: idealmente em um projeto real você criaria um arquivo para cada repository
*/

// * Importando o que vamos precisar
import { Address } from "../generated/prisma/client";
import { UserType } from "../generated/prisma/enums";
import { ProductGetPayload, UserGetPayload } from "../generated/prisma/models";
import { setupVSRepo } from "../generated/vsrepo";
import prisma from "./prisma";

// * Aqui usamos o "GetPayload" para o VSRepository reconhecer a tipagem das relações
// TODO Passe o cursor do mouse em cima de "User" para ver a tipagem dele
type User = UserGetPayload<{
    // * Usamos o "include" para incluir as relações na tipagem
    include: {
        address: true;
        products: true;
    };
}>;

// * Configurando repositório de Usuários
// ? Por que chamamos uma função logo depois da outra: ()({...})? Pois como o VSRepository precisa de 2 generics essa
// ? é a forma de o TypeScript conseguir tratar essas generics devidamente
// * A primeira generic é o modelo da nossa entidade
const userVSRepo = setupVSRepo<User, "User">()({
    // * Aqui definimos o nome da tabela, ela é o nome do "model" definido no schema.prisma com a primeira letra minúscula
    // ! OBS: Esse não é necessariamente o nome exato da tabela no banco de dados
    tableName: "user",

    // * "pkName" é o nome da chave primária da nossa entidade, ela é importante para os métodos base e para os métodos dinâmicos
    // * de prefixo "exists" (No "exists" ela é usada no select para o Prisma buscar o mínimo possível, pois só queremos saber se existe ou não)
    pkName: "id",

    // * Aqui estamos definindo o "requiredWhere", ele contém o filtro que será injetado por padrão em todas as operações (com exceção do aggregate e do groupBy)
    requiredWhere: {
        // * Por padrão só vamos buscar usuários ativos
        active: true,
    },

    // * Agora vamos definir os "selectModels", eles são modelos de select do Prisma que podemos utilizar nas nossas operações
    selectModels: {
        // * Definindo o modelo "public"
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
        // * Definindo o modelo "internal"
        internal: {
            id: true,
            name: true,
            email: true,
            userType: true,
            likesVSRepo: true,
            createdAt: true,
            updatedAt: true,
            active: true,
            password: true, // * Observe que só nesse modelo a senha está disponível
        },
        // * Definindo o modelo "minimal"
        minimal: {
            id: true,
        },
    },

    // * Agora definimos que por padrão o "selectModel" usado será o "public" nos métodos base e nos métodos dinâmicos
    defaultSelectModel: "public",

    // * Configurando as relações
    // ! Um detalhe importante: Você não é obrigado a configurar as relations, somente se você quiser que o VSRepository as gerencie no save/patch de forma
    // ! organizada, porém, caso prefira, você pode gerenciar as relações manualmente, só ficaria mais verboso
    relations: {
        // * Relação com endereço
        address: {
            // * Definimos como uma relação "one-to-one" (oto)
            mode: "oto",
            // * Chave primária do endereço (importante para o "save" e "patch" poder gerenciar essa relação devidamente)
            pk: "id",
            // * Marcamos a restrição como "set" para sempre que passarmos ela no "save" ou no "patch" ela ser sobrescrita caso
            restriction: "set",
        },

        // * Relação com produtos
        products: {
            // * Aqui é uma relação one-to-many (otm)
            mode: "otm",
            pk: "id",
            // * Definimos a restrição como "add", pois não queremos apagar os produtos que não foram passados no save/patch, apenas adicionar
            // * novos ou atualizar os já existentes
            restriction: "add",
        },
    },

    // * Agora vamos definir os métodos dinâmicos que terão o comportamento inferido pelo *nome*
    methods: {
        // * Esse método buscará usuários com o "userType" passado no parâmetro da função
        // * Observe que na entidade essa coluna começa com "u" minúsculo, porém aqui precisamos passar o nome capitalizado (com a primeira letra maiúscula)
        findByUserType: { map: true },

        // * Aqui criamos um método que busca um usuário específico pelo "email" e pelo "userType"
        findOneByEmailAndUserType: { map: true },

        // * Esse método busca usuários que tenham o "userType" passado ou que o "email" termine com o texto passado
        findByUserTypeOrEmailEndsWith: { map: true },

        // * Buscando todos os usuários que gostam do VSRepository (esses caras são gente boa) recebendo um parâmetro de paginação
        findByLikesVSRepoIsTruePaginated: { map: true },

        // * Também podemos criar métodos com nomes personalizados ("proxyTo" define o comportamento desse método)
        buscarUsuariosPaias: { map: true, proxyTo: "findByLikesVSRepoIsFalse" },

        // * Buscando dados privados do usuário por email
        findInternalByEmail: {
            map: true,
            proxyTo: "findOneByEmail",
            // * Aqui estamos dizendo que esse método específico vai ignorar o requiredWhere, ou seja, vai encontrar
            // * o usuário mesmo se ele estiver com "active" = false
            whereType: "overwrite",
            // * Aqui dizemos que queremos usar o selectModel "internal" (aquele que definimos no "selectModels")
            selectModel: "internal",
        },

        // * Método pra ver se tem um usuário com um email
        existsByEmail: { map: true },

        // * Esse método busca todos os Admins
        findAdmins: {
            map: true,
            proxyTo: "findBy",
            // * O "pushWhere" injeta esse filtro automaticamente nesse método específico
            pushWhere: {
                userType: UserType.ADMIN,
            },
        },

        // * Agora vamos criar um método que busca usuários do mesmo país
        findByAddressWithCountry: {
            map: true,
            // * Aqui injetamos uma ordenação fixa para esse método, os resultados serão automaticamente ordenados pelo estado e pela cidade
            injectOrdenation: [{ address: { state: "asc" } }, { address: { city: "asc" } }],
        },

        // * Também podemos buscar usuários sem endereço
        findByAddressWithout: { map: true },

        // * Bom, caso a gente não saiba o nome exato do usuário podemos buscar resultados que 'contenham' o nome que a gente passar e ignorar a diferença
        // * de letras maiúsculas e minúsculas, além disso vamos aceitar um parâmetro manual de ordenação e de paginação
        findByNameContainsInsensitiveOrderedAndPaginated: { map: true },

        // * Agora vamos criar 2 métodos, um para procurar usuários com produtos e outro para usuários sem produtos
        findByProductsSome: { map: true },
        findByProductsNone: { map: true },

        // * O VSRepository também tem suporte à todas as operações nativas do Prisma, vou declarar um exemplo para cada uma delas
        // * aqui só para mostrar as possibilidades, mas não entrarei muito em detalhes
        findUniqueByEmail: { map: true },
        findUniqueOrThrowById: { map: true },
        findFirstByNameStartsWith: { map: true },
        findFirstOrThrowByIdOrEmail: { map: true },
        countByUserType: { map: true },
        // * O sufixo "Optional" diz que o parâmetro "name" é opcional nesse método (podemos passar esse parâmetro como 'undefined')
        // * Veja a documentação do VSRepository para mais detalhes: https://github.com/jaobrabo123/VSRepository#filtros-de-campo
        findManyByNameOptional: { map: true },
        createManyAndReturn: { map: true },
        createManySkipDuplicates: { map: true },
        create: { map: true },
        updateManyAndReturnByUserType: { map: true },
        // * No VSRepository algumas operações aceitam o sufixo "Where" (ao invés de "By"), oq permite você passar um objeto "where" literal do Prisma como
        // * parâmetro, útil para filtragens muito complexas.
        // * Leia a documentação do VSRepository para saber quais operações tem suporte ao sufixo "Where": https://github.com/jaobrabo123/VSRepository#métodos-dinâmicos
        updateManyWhere: { map: true },
        updateById: { map: true },
        upsertByEmail: { map: true },
        deleteManyByIdIn: { map: true, whereType: "overwrite", selectModel: "minimal" },
        deleteById: { map: true, selectModel: "minimal" },
        // * O VSRepository tem suporte ao "aggregate" e ao "groupBy", para utilizá-los você pode declarar um método com o nome exato deles (não aceita
        // * parâmetros extras), a tipagem do retorno deles é definida dinamicamente pelo próprio Prisma
        // ! Observação importante: O "aggregate" e o "groupBy" ignoram os selectModels, o requiredWhere e o pushWhere
        aggregate: { map: true },
        groupBy: { map: true },
    },
});

// * Agora que configuramos noso repository vamos criar e exportar uma instância dele usando o método '.build()'
// * Para isso precisamos passar uma instância do PrismaClient como primeiro parâmetro e também podemos configurar algumas coisas dessa instância
export const userRepository = userVSRepo.build(prisma, {
    // * Aqui poderiamos marcar o showWorking como 'true' para ver o repository funcionando na prática, porém ele gera muitos logs para debug profundo, então 
    // * vamos deixar desativado, pois esse não é o foco no momento. Mas se você quiser pode ativar para ver ele funcionando e os payloads que ele gera
    // * para o Prisma
    showWorking: false, // * Por padrão já vem marcado como 'false'

    // * Também podemos configurar o funcionamento de alguns métodos base
    // * Para saber mais sobre os métodos base veja a documentação do VSRepository: https://github.com/jaobrabo123/VSRepository#métodos-base
    baseMethods: {
        removeList: {
            // * Aqui estamos desativando o "removeList" nessa instância (por padrão todos os métodos vêm ativados)
            active: false,
        },
        remove: {
            // * O método "remove" vai usar o selectModel "minimal" caso a gente não especifique ao chamar
            defaultSelect: "minimal",
        },
        getOrThrow: {
            // * Aqui estamos dizendo que o "getOrThrow" vai ignorar o "requiredWhere" (semelhante ao whereType "overwrite" dos métodos dinâmicos)
            ignoreRequiredWhere: true,
        },
        save: {
            // * Configurando que ao realizar o upsert internamente (caso objeto passado tenha a primary key) o save vai ignorar o "requiredWhere"
            ignoreRequiredWhere: true,
        },
    },
});

// * Agora que criamos a instância podemos conferir se ele realmente criou os métodos
// TODO Passe o cursor do mouse em cima de "UserRepositoryKeys" para ver os métodos do nosso repository
export type UserRepositoryKeys = keyof typeof userRepository;

// * Agora que já entendemos como criar e configurar um repository, vamos criar rapidamente os repositories das outras entidades

// * Configurando o repository de Endereco
// * Observe que aqui não utilizamos o GetPayload, pois não vamos gerenciar nem filtrar relações nesse repository
const addressVSRepo = setupVSRepo<Address, "Address">()({
    tableName: "address",
    pkName: "id",

    // * Observe também que nesse repository não definimos nenhum selectModel, o que significa que as operações retornarão o
    // * payload padrão do Prisma. Isso não é uma boa prática, mas só mostrando que isso é uma possibilidade para projetos rápidos/simples

    methods: {
        findFirstByCityStartsWith: { map: true },

        findByCountry: { map: true },

        findByUserId: { map: true },
    },
});

export const addressRepository = addressVSRepo
    .build(prisma, {
        baseMethods: { removeList: { ignoreRequiredWhere: true } },
    })
    // * Podemos estender um repository usando a função "extend" ao criar uma instâcia.
    // * Mais detalhes na documentação: https://github.com/jaobrabo123/VSRepository#estendendo-um-repository
    .extend(repo => ({
        buscarEnderecosDoBrasil: async () => {
            return repo.findByCountry("Brasil");
        },
    }));

// * Configurando repository de Produtos
type Product = ProductGetPayload<{
    include: {
        tags: true;
        user: true;
    };
}>;

const productVSRepo = setupVSRepo<Product, "Product">()({
    tableName: "product",
    pkName: "id",
    selectModels: {
        public: {
            id: true,
            description: true,
            name: true,
            price: true,
            createdAt: true,
            updatedAt: true,
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
    },
    defaultSelectModel: "public",

    // * Queremos buscar somente produtos de usuários ativos
    requiredWhere: { user: { is: { active: true } } },

    relations: {
        user: {
            mode: "mto",
            pk: "id",
            restriction: "add",
            // * O "nullAble" só existem em relações "mto" (many-to-one), ele serve para dizermos se a chave estrangeira (nesse caso o userId) pode ser nula.
            // * Como o userId é not null (definimos isso no schema.prisma) colocamos "nullAble" como false (padrão = false).
            // * Isso serve para o VSRepository decidir oq fazer caso você passe a relation como null no save/patch, se for true ele vai fazer
            // * um disconnect (colocar a fk como null) e se for false ele não faz nada
            nullAble: false,
        },
        tags: {
            mode: "mtm",
            // ! ATENÇÃO: Note que aqui colocamos o "name" como pk sendo que a primary key de tag é "id", mas como assim?? Não vai dar erro?? Não vai dar erro nesse caso,
            // ! pois marcamos "name" como unique no schema.prisma, então o VSRepository consegue identificar as tags que já existem das que ainda não existem.
            // ? Ok faz sentido, mas por que isso nesse caso? Pois na regra de negócio desse sistema em específico queremos que se uma tag fornecida já exista ela
            // ? seja conectada ao nosso produto e se caso não tiver nenhuma tag com esse nome, ele crie e conecte ao produto. Mas se as tags fossem fixas (se não existe,
            // ? não cria automaticamente), o ideal seria colocar a pk como "id". Mas muito cuidado ao fazer essas "gambiarras", sempre teste antes de enviar para produção.
            pk: "name",
            restriction: "set",
        },
    },

    methods: {
        findByNameStartsWithInsensitive: { map: true },

        findByPriceLessThan: { map: true },

        findByPriceBetween: { map: true },

        // * Esse método busca produtos sem descrição
        findByDescriptionIsNull: { map: true },

        findByTagsSomeName: { map: true },

        findByUserWithEmail: { map: true },

        findByUserId: { map: true },

        findByIdIn: { map: true },
    },
});

export const productRepository = productVSRepo.build(prisma, {
    baseMethods: { removeList: { ignoreRequiredWhere: true } },
});

// * Ok, agora que já configuramos nosssos repositories vamos para pasta "tests" testá-los na prática
