import { VSRepository } from "../VSRepository.js";

export class UsuarioRepository extends VSRepository {
    tableName = 'usuario';
    showWorking = true;
    
    selectModels = {
        public: { id: true, nome: true, email: true },
        full: { id: true, nome: true, idade: true, email: true, ativo: true }
    };

    requiredWhere = { ativo: true };

    findManyByContainsInsensitiveNomePaginated = {
        map: true,
        selectModel: 'public'
    };

    findManyByContainsInsensitiveNomeOrIdade = {
        map: true,
        selectModel: 'public'
    }

    findFirstByEmailStartsWithAndNomeContainsInsensitiveOrId = {
        map: true,
        selectModel: 'full'
    }

    findUniqueById = {
        map: true,
        selectModel: 'public',
        whereType: 'overwrite'
    }

    findFirstByProdutos = {
        map: true
    }
}