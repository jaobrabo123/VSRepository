import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { setupVSRepo, type SelectModels } from "../VSRepository/VSRepository";

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
} satisfies SelectModels<'perfil'>;

export const perfilVSRepo = setupVSRepo<Perfil, 'perfil'>()({
    tableName: 'perfil',
    pkName: 'id',
    selectModels: perfilSelectModels,
    defaultSelectModel: 'public',
});

const perfilRepository = perfilVSRepo.build(prisma);
export default perfilRepository;
