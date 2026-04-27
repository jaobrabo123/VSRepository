import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { setupVSRepo, type WhereModel, type SelectModels } from "../VSRepository/VSRepository";
import { categoriaSelectModels } from "./categoriaRepository";
import { usuarioRequiredWhere } from "./usuarioRepository";

type Postagem = Prisma.postagemGetPayload<{
    include: {
        categorias: true,
        autor: true
    }
}>;

export const postagemSelectModels = {
    public: {
        id: true,
        titulo: true,
        conteudo: true,
        publicado: true,
        dataCriacao: true,
        dataAtualizacao: true,
        autor: {
            select: {
                id: true,
                nome: true,
                email: true,
            }
        },
        categorias: { select: categoriaSelectModels.public }
    }
} satisfies SelectModels<'postagem'>;

export const postagemRequiredWhere = {
    autor: usuarioRequiredWhere
} satisfies WhereModel<"postagem">;

export const postagemVSRepo = setupVSRepo<Postagem, 'postagem'>()({
    tableName: 'postagem',
    pkName: 'id',
    selectModels: postagemSelectModels,
    defaultSelectModel: 'public',
    relations: {
        autor: {
            pk: "id",
            mode: "mto",
            restriction: 'add',
            nullAble: false
        },
        categorias: {
            pk: 'id',
            mode: 'mtm',
            restriction: 'set'
        }
    },
    requiredWhere: postagemRequiredWhere,
    methods: {
        
    }
});

const postagemRepository = postagemVSRepo.build(prisma, {showWorking: true});
export default postagemRepository;