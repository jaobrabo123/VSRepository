import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type MethodConfig, type ModelWhere, type RepositoryRelations, type SelectModels } from "../VSRepository/VSRepository";

type Usuario = Prisma.usuarioGetPayload<{
    include: {
        perfil: true,
        postagens: true
    }
}>;

type ThisMethodConfig = MethodConfig<{
    tableName: 'usuario',
    selectModels: typeof usuarioSelectModels
}>

export const usuarioSelectModels = {
    public: {
        id: true,
        nome: true,
        email: true,
        perfil: {
            select: {
                id: true,
                avatarUrl: true,
                biografia: true,
                telefone: true
            }
        }
    },
    comPosts: {
        id: true,
        nome: true,
        email: true,
        perfil: {
            select: {
                id: true,
                avatarUrl: true,
                biografia: true,
                telefone: true
            }
        },
        postagens: {
            select: {
                id: true,
                titulo: true,
                conteudo: true,
                publicado: true
            }
        }
    },
    minimal: {
        id: true
    }
} satisfies SelectModels<'usuario'>;

export const usuarioRequiredWhere = {
    ativo: true
} satisfies ModelWhere<'usuario'>;

export class UsuarioRepository extends VSRepository<Usuario, 'usuario'>{
    readonly tableName = "usuario";
    readonly pkName = "id";
    readonly relations = {
        perfil: {
            pk: 'id',
            mode: 'oto',
            restriction: 'set',
        },
        postagens: {
            pk: 'id',
            mode: 'otm',
            restriction: 'set'
        }
    } satisfies RepositoryRelations<Usuario>;
    readonly selectModels = usuarioSelectModels;
    readonly defaultSelectModel = 'public';
    readonly requiredWhere = usuarioRequiredWhere;

    createManyAndReturn = {
        map: true,
        selectModel: 'minimal'
    } satisfies ThisMethodConfig;

    deleteManyByIdIn = {
        map: true,
        whereType: 'overwrite',
    } satisfies ThisMethodConfig;

    findManyPaginated = { map: true } as const;

    count = { map: true } as const;

    buscarComGmailOuOutlookOuHotmail = {
        map: true,
        proxyTo: 'findMany',
        pushWhere: {
            OR: [
                { email: { endsWith: '@gmail.com' } },
                { email: { endsWith: '@outlook.com' } },
                { email: { endsWith: '@hotmail.com' } }
            ]
        },
        whereType: 'extending'
    } satisfies ThisMethodConfig;

    findUniqueByIdAndEmail = {
        map: true,
    } satisfies ThisMethodConfig;

    updateById = {
        map: true
    } satisfies ThisMethodConfig;

    deleteByEmail = {
        map: true
    } satisfies ThisMethodConfig;

    countByPerfil = {
        map: true
    } satisfies ThisMethodConfig;
}

const usuarioRepository = new UsuarioRepository().build(prisma);
export default usuarioRepository;
