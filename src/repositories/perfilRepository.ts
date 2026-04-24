import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type SelectModels } from "../VSRepository/VSRepository";

type Perfil = Prisma.perfilGetPayload<{
    include: {
        usuario: true
    }
}>;

export const perfilSelectModels = {
    public: {
        id: true,
        avatarUrl: true,
        biografia: true,
        telefone: true,
        usuarioId: true
    },
} satisfies SelectModels<'perfil'>

export class PerfilRepository extends VSRepository<Perfil, 'perfil'> {
    readonly pkName = "id";
    readonly tableName = "perfil";
    readonly selectModels = perfilSelectModels;
    readonly defaultSelectModel = 'public';
}

const perfilRepository = new PerfilRepository().build(prisma);
export default perfilRepository;
