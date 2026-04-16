//
// ESSES TESTES FORAM GERADOS COM IA
//

import { ProdutoRepository } from "./repositories/produtoRepository.js";
import { UsuarioRepository } from "./repositories/usuarioRepository.js";

async function runTests() {
    const userRepo = new UsuarioRepository();
    const prodRepo = new ProdutoRepository();

    userRepo.build();
    prodRepo.build();

    console.log("--- Iniciando Testes de Usuário ---");

    // 1. Criar Usuário
    const novoUser = await userRepo.create({
        nome: 'Matias',
        idade: 54,
        email: `matias_${Date.now()}@email.com`
    });
    console.log("Usuário Criado:", novoUser);

    // 2. Buscar por ID (Ignorando filtro de ativo)
    const userById = await userRepo.findUniqueById('b8f72221-5f2b-4d44-8d96-c1482f347890');
    console.log("Busca por ID (Inativo):", userById);

    // 3. Busca Paginada
    const usersPaginados = await userRepo.findManyByContainsInsensitiveNomePaginated(
        'joao', 
        { skip: 0, take: 5 }
    );
    console.log("Users Paginados:", usersPaginados);

    console.log("\n--- Iniciando Testes de Produto ---");

    const userIdFixo = 'a431801d-c0d4-4669-9e5e-1e0bd1dfc05e';

    // 1. Criar Produto
    const novoProduto = await prodRepo.create({
        nome: 'Teclado Mecânico',
        preco: 450.00,
        codigo: `TK-${Date.now()}`,
        usuarioId: userIdFixo
    });
    console.log("Produto Criado:", novoProduto);

    // 2. Buscar por Usuario e Preço Mínimo
    // Nota: Preço é Decimal no Prisma, passamos o valor numérico
    const prodsCaros = await prodRepo.findManyByUsuarioIdAndGreaterThanPreco(
        userIdFixo, 
        500.00
    );
    console.log("Produtos > 500.00:", prodsCaros);

    // 3. Buscar por Unique Composto (UsuarioId e Codigo)
    const prodByCode = await prodRepo.findUniqueByUsuarioId_codigo({
        usuarioId: userIdFixo,
        codigo: 'NB-001'
    });
    console.log("Produto por Código:", prodByCode);
}

runTests().catch(console.error);