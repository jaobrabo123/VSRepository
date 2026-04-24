import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type MethodConfig, type ModelWhere, type RepositoryRelations, type SelectModels } from "../VSRepository/VSRepository";

type Usuario = Prisma.usuarioGetPayload<{
    include: {}
}>;

export const usuarioSelectModels = {
    public: {},
} satisfies SelectModels<'usuario'>;

type ThisMethodConfig = MethodConfig<{
    tableName: 'usuario',
    selectModels: typeof usuarioSelectModels
}>;

export class UsuarioRepository extends VSRepository<Usuario, 'usuario'> {
    readonly pkName = "id";
    readonly tableName = "usuario";
    readonly selectModels = usuarioSelectModels;
    readonly defaultSelectModel = 'public';
    readonly relations = {} satisfies RepositoryRelations<Usuario>;
    readonly requiredWhere = {} satisfies ModelWhere<'usuario'>;

}

const usuarioRepository = new UsuarioRepository().build(prisma);
export default usuarioRepository;
