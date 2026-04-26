import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { setupVSRepo, type WhereModel, type SelectModels } from "../VSRepository/VSRepository";

type Usuario = Prisma.usuarioGetPayload<{
    include: {
        perfil: true,
        postagens: true
    }
}>;

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
} as const satisfies SelectModels<'usuario'>;

export const usuarioRequiredWhere = {
    ativo: true
} satisfies WhereModel<'usuario'>;

export const usuarioVSRepo = setupVSRepo<Usuario, 'usuario'>()({
    tableName: 'usuario',
    pkName: 'id',
    selectModels: usuarioSelectModels,
    defaultSelectModel: 'public',
    requiredWhere: usuarioRequiredWhere,
    relations: {
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
    },
    methods: {
        createManyAndReturn: {
            map: true,
            selectModel: 'minimal'
        },
        deleteManyByIdIn: {
            map: true,
            whereType: 'overwrite',
        },
        findManyPaginated: { map: true },
        count: { map: true },
        buscarComGmailOuOutlookOuHotmail: {
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
        },
        findUniqueByIdAndEmail: { map: true },
        updateById: { map: true },
        deleteByEmail: { map: true },
        countByPerfil: { map: true },
        findListWhereOrderedAndPaginated: {
            map: true,
            whereType: "overwrite"
        },
        findManyByPostagens: {
            map: true
        },
        findWhere: {
            map: true
        },
        findById: {
            map: true,
            fbMode: 'one'
        }
    }
});

const usuarioRepository = usuarioVSRepo.build(prisma, {
    showWorking: true,
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
export default usuarioRepository;
