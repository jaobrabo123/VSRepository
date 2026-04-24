import prisma from "../db";
import { UsuarioRepository } from "../repositories/usuarioRepository";

async function test(){
    const usuarioRepositoryTest = new UsuarioRepository().build(prisma, {
        showWorking: false,
        baseMethods: {
            get: {
                active: true,
                defaultSelect: 'public'
            },
            remove: {
                defaultSelect: 'minimal'
            }
        }
    });

    const novoUsuario = await usuarioRepositoryTest.save({
        nome: "João",
        email: "joao@email.com",
        senha: "password",
    })
    console.log("Novo usuário:", novoUsuario);

    await usuarioRepositoryTest.remove(novoUsuario.id);
    const usuarioAindaExiste = await usuarioRepositoryTest.get(novoUsuario.id);
    if(usuarioAindaExiste === null){
        console.log("Usuário removido com sucesso");
    }

    const usuarioComPerfil = await usuarioRepositoryTest.save({
        nome: "João",
        email: "joao@email.com",
        senha: "password",
        perfil: {
            id: crypto.randomUUID(),
            biografia: "Sou um programador",
            telefone: "40028922",
            avatarUrl: 'https://preview.redd.it/the-penitent-one-artwork-by-me-v0-oojiwklc45nf1.jpeg?auto=webp&s=bdf83a05097df01f402b9dc387f33c4ab561e6e0'
        }
    }, {selectModel: 'comPosts'});
    console.log("Novo usuário com um perfil:",usuarioComPerfil);

    usuarioComPerfil.perfil.biografia = "Não sou um programador";
    usuarioComPerfil.perfil.telefone = "12345678"

    const usuarioComPerfilAtualizado = await usuarioRepositoryTest.save(usuarioComPerfil);
    console.log("Novo usuário com perfil perfil atualzado:",usuarioComPerfilAtualizado);

    const usuarioSemPerfil = await usuarioRepositoryTest.save({
        ...usuarioComPerfilAtualizado,
        perfil: null
    });
    console.log("Usuário sem o perfil:", usuarioSemPerfil)

    await usuarioRepositoryTest.remove(usuarioComPerfil.id);

    const usuarioComPosts = await usuarioRepositoryTest.save({
        nome: "João",
        email: "joao@email.com",
        senha: "password",
        perfil: {
            id: crypto.randomUUID(),
            biografia: "Sou um programador",
            telefone: "40028922",
            avatarUrl: 'https://preview.redd.it/the-penitent-one-artwork-by-me-v0-oojiwklc45nf1.jpeg?auto=webp&s=bdf83a05097df01f402b9dc387f33c4ab561e6e0'
        },
        postagens: [{
            id: crypto.randomUUID(),
            titulo: "Novo Post",
            conteudo: "Projeto em Nodejs",
        },{
            id: crypto.randomUUID(),
            titulo: "Projeto em Java",
            conteudo: "Novo projeto desenvolvido em Java usando Spring",
        },{
            titulo: "Python",
            conteudo: "Análise de dados com Python",
        }]
    }, {selectModel: 'comPosts'});
    console.log("Usuário com posts:", usuarioComPosts);

    usuarioComPosts.postagens[0]!.publicado = true;
    usuarioComPosts.postagens[1]!.publicado = true;

    usuarioComPosts.postagens = usuarioComPosts.postagens.slice(0, 2);

    const usuarioComPostsAtualizado = await usuarioRepositoryTest.save(usuarioComPosts, {selectModel: "comPosts"});
    console.log("Usuário com posts atualizados:", usuarioComPostsAtualizado);

    const usuarioGet = await usuarioRepositoryTest.get(usuarioComPostsAtualizado.id, {selectModel: 'comPosts'});
    console.log("Usuario:", usuarioGet);

    await usuarioRepositoryTest.remove(usuarioComPosts.id);

    const novosUsuarios = await usuarioRepositoryTest.createManyAndReturn([
        {
            nome: "Pedro Silva",
            email: "pedrin@gmail.com",
            senha: "password123",
            ativo: true
        },
        {
            nome: "Ana Beatriz Costa",
            email: "ana.beatriz@empresa.com.br",
            senha: "senhaSegura!2026",
            ativo: true
        },
        {
            nome: "Carlos Eduardo (Cadu)",
            email: "cadu_gamer@outlook.com",
            senha: "gta_v_forever",
            ativo: false // Usuário inativo para testar filtros
        },
        {
            nome: "Fernanda Lima",
            email: "fe.lima.dev@tech.io",
            senha: "admin",
            ativo: true
        },
        {
            nome: "Lucas Mendes",
            email: "lucasmendes.design@yahoo.com",
            senha: "artpass_abc",
            ativo: true
        },
        {
            nome: "Juliana Santos",
            email: "juli.santos@gov.br",
            senha: "gov_pass_44",
            ativo: false // Outro inativo
        },
        {
            nome: "Roberto Alves",
            email: "beto.alves99@hotmail.com",
            senha: "palmeiras_campeao",
            ativo: true
        },
        {
            nome: "Mariana Oliveira",
            email: "mari.oliveira@startup.co",
            senha: "innovate_26",
            ativo: true
        },
        {
            nome: "Thiago Rocha",
            email: "thiago.rocha@universidade.edu",
            senha: "phd_student_pwd",
            ativo: true
        },
        {
            nome: "Vanessa Gomes",
            email: "vanessa.gomes@freelance.net",
            senha: "vane_free_2026",
            ativo: true
        }
    ]);

    console.log(`Foram inseridos ${novosUsuarios.length} novos usuários com sucesso!`);

    const usuariosAtivos = await usuarioRepositoryTest.count();
    console.log('Usuarios ativos:', usuariosAtivos);

    const cincoUsuarios = await usuarioRepositoryTest.findManyPaginated({
        take: 5
    });
    console.log("Cinco usuarios:", cincoUsuarios);

    const usuariosComGmailOuOutlook = await usuarioRepositoryTest.buscarComGmailOuOutlookOuHotmail();
    console.log("Usuarios com gmail, outlook ou hotmail:", usuariosComGmailOuOutlook);

    const buscandoUnique = await usuarioRepositoryTest.findUniqueByIdAndEmail(usuariosComGmailOuOutlook[0]!.id, usuariosComGmailOuOutlook[0]!.email);
    console.log("Buscando Unique:", buscandoUnique)

    console.log("Deixando ele desativado");
    await usuarioRepositoryTest.updateById(buscandoUnique!.id, { ativo: false });

    const buscandoDenovo = await usuarioRepositoryTest.findUniqueByIdAndEmail(buscandoUnique!.id, buscandoUnique!.email);
    console.log("Buscando Denovo:", buscandoDenovo);

    console.log("\nRemovendo todos.")
    await usuarioRepositoryTest.deleteManyByIdIn(novosUsuarios.map(_=>_.id));

}
test()