import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type SelectModels } from "../VSRepository/VSRepository";
import { usuarioSelectModels } from "./usuarioRepository";

type Postagem = Prisma.postagemGetPayload<{

}>;

export const postagemSelectModels = {
    public: {
        id: true,
        titulo: true,
        conteudo: true,
        publicado: true,
        autor: {
            select: usuarioSelectModels.public
        },
        dataCriacao: true,
        dataAtualizacao: true
    }
} satisfies SelectModels<'postagem'>;

export class PostagemRepository extends VSRepository<Postagem, 'postagem'> {
    readonly tableName = "postagem";
    readonly pkName = "id";
    readonly selectModels = postagemSelectModels;
    readonly defaultSelectModel = 'public';
}