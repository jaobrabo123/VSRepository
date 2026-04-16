import { VSRepository } from "../VSRepository.js";

export class UsuarioRepository extends VSRepository {
    tableName = 'usuario';
    
    selectModels = {
        public: { id: true, nome: true, email: true },
        full: { id: true, nome: true, idade: true, email: true, ativo: true }
    };

    requiredWhere = { ativo: true };

    findUniqueById = { map: true, selectModel: 'public', whereType: 'overwrite' };

    findManyByContainsInsensitiveNomePaginated = { map: true, selectModel: 'full' };

    findUniqueByEmail = { map: true, selectModel: 'full' };

    create = { map: true, selectModel: 'public' };
    
    updateById = { map: true };
}