import { UsuarioRepository } from "./repositories/usuarioRepository.js";

async function testes() {
    const usuarioRepository = new UsuarioRepository();
    usuarioRepository.build()

    const buscaPaginadaPorNome = await usuarioRepository.findManyByContainsInsensitiveNomePaginated('USU', {skip: 1, take:10});
    console.log('buscaPaginadaPorNome:', buscaPaginadaPorNome);

    const buscaPorNomeOuIdade = await usuarioRepository.findManyByContainsInsensitiveNomeOrIdade('guis', 30);
    console.log('buscaPorNomeOuIdade:', buscaPorNomeOuIdade)

    const buscaLoca = await usuarioRepository.findFirstByEmailStartsWithAndNomeContainsInsensitiveOrId('joao@', 'usu', '22233333-3333-3333-3333-333333333333');
    console.log('buscaLoca:', buscaLoca);

    const buscaPorId = await usuarioRepository.findUniqueById('33333333-3333-3333-3333-333333333333');
    console.log('buscaPorId:', buscaPorId);

    const buscaPorProduto = await usuarioRepository.findFirstByProdutos({
        some: {
            preco: '30.0'
        }
    })
    console.log('buscaPorProduto:', buscaPorProduto)
}
testes()