import { VSRepository } from "../VSRepository.js";

export class ProdutoRepository extends VSRepository {
    tableName = 'produto';

    selectModels = {
        detail: {
            id: true,
            nome: true,
            preco: true,
            codigo: true,
            usuario: { select: { nome: true } }
        }
    };

    create = { map: true, selectModel: 'detail' };

    findManyByUsuarioIdAndGreaterThanPreco = { map: true, selectModel: 'detail' };

    findUniqueByUsuarioId_codigo = { map: true, selectModel: 'detail' };

    deleteById = { map: true };
}