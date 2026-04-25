import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type ModelWhere, type RepositoryRelations, type SelectModels } from "../VSRepository/VSRepository";
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
} satisfies ModelWhere<"postagem">;

export class PostagemRepository extends VSRepository<Postagem, 'postagem'> {
    readonly tableName = "postagem";
    readonly pkName = "id";
    readonly selectModels = postagemSelectModels;
    readonly defaultSelectModel = 'public';
    readonly relations = {
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
    } satisfies RepositoryRelations<Postagem>;
    readonly requiredWhere = postagemRequiredWhere;

}

const postagemRepository = new PostagemRepository().build(prisma);
export default postagemRepository;