import prisma from "../db"
import categoriaRepository from "../repositories/categoriaRepository";
import postagemRepository from "../repositories/postagemRepository";
import usuarioRepository from "../repositories/usuarioRepository";

async function test() {
    const categoriasBase = await categoriaRepository.createManyAndReturn([
        {
            nome: "TI",
            descricao: "Tecnologia da informação"
        },
        {
            nome: "Back-end"
        },
        {
            id: crypto.randomUUID(),
            nome: "Front-end",
            descricao: "Desenvolvimento de interfaces"
        },
        {
            id: crypto.randomUUID(),
            nome: "Mobile",
            descricao: "Aplicativos Android e iOS"
        },
        {
            nome: "DevOps",
            descricao: "Cultura e automação"
        },
        {
            id: crypto.randomUUID(),
            nome: "Data Science",
            descricao: "Análise de dados e ML"
        },
        {
            nome: "Segurança",
            descricao: "Cibersegurança e defesa"
        },
        {
            id: crypto.randomUUID(),
            nome: "Cloud Computing",
            descricao: "Serviços em nuvem"
        },
        {
            nome: "UX/UI Design",
            descricao: "Experiência do usuário"
        },
        {
            id: crypto.randomUUID(),
            nome: "QA & Testes",
            descricao: "Garantia de qualidade"
        },
        {
            nome: "Inteligência Artificial"
        },
        {
            id: crypto.randomUUID(),
            nome: "Blockchain",
            descricao: "Tecnologias descentralizadas"
        },
        {
            nome: "Gestão de Projetos"
        },
        {
            id: crypto.randomUUID(),
            nome: "Banco de Dados",
            descricao: "SQL e NoSQL"
        },
        {
            nome: "Redes de Computadores"
        },
        {
            id: crypto.randomUUID(),
            nome: "Arquitetura de Software"
        },
        {
            nome: "Sistemas Operacionais"
        },
        {
            id: crypto.randomUUID(),
            nome: "IoT",
            descricao: "Internet das Coisas"
        },
        {
            nome: "Desenvolvimento de Jogos"
        },
        {
            id: crypto.randomUUID(),
            nome: "E-commerce",
            descricao: "Soluções para comércio eletrônico"
        }
    ]);

    const testeAND = await categoriaRepository.findByDescricaoOrDescricaoANDNome("teste", null, "Desenvolvimento de Jogos");
    console.log("Teste de AND:", testeAND)

    let novaPostagem = await postagemRepository.save({
        titulo: "Projeto em Assembly",
        conteudo: "Um projeto muito brabo em assembly",
        autor: {
            nome: "Gabriel",
            email: "gabrieldev@outlook.com",
            senha: "gabrielsecretdev"
        },
        categorias: [{
            nome: "Assembly",
            descricao: "Linguagem de programação Assembly"
        },{
            nome: "Projeto de Programação",
            descricao: "Projeto desenvolvido com linguagem de programação"
        }, ...categoriasBase]
    });
    console.log("Nova postagem:", novaPostagem);
    console.log("Quantidade de categorias da postagem:", await categoriaRepository.countByPostagens({some: {id: novaPostagem.id}}))

    const testeInsensitive = await postagemRepository.findByTituloInsensitive('projeto em assembly');
    console.log("Teste Insensitive:", testeInsensitive)
    const testeFindById = await postagemRepository.findById(novaPostagem.id);
    console.log("Teste findById:", testeFindById);
    const testeVariosInsentive = await postagemRepository.findByTituloInsensitiveOrConteudoStartsWithInsensitiveANDPublicado('projeto em assembly', 'um projeto', false);
    console.log("Teste com vários Insensitive:", testeVariosInsentive);

    const novaCategoria = {id: crypto.randomUUID(), nome: "Home office", descricao: null};
    const categoriasPraRemover = [...novaPostagem.categorias, novaCategoria];

    novaPostagem.categorias = [...categoriasBase.slice(0, 4), novaCategoria];

    novaPostagem = await postagemRepository.save(novaPostagem);

    console.log("Postagem atualizada:", novaPostagem)
    console.log("Quantidade de categorias da postagem:", await categoriaRepository.countByPostagens({some: {id: novaPostagem.id}}))

    // * Testando Transaction
    await prisma.$transaction(async (tx)=>{
        await postagemRepository.remove(novaPostagem.id, {db: tx});
        await categoriaRepository.deletarNormalizandoIds(categoriasPraRemover.map(cat=>cat.id), tx);
        await usuarioRepository.deleteByEmail("gabrieldev@outlook.com", {db: tx});
    });
    process.exit(0)
}
test()