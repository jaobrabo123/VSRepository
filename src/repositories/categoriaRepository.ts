import type { Prisma } from "@generated/prisma/client";
import { setupVSRepo, type SelectModels } from "../VSRepository/VSRepository";
import prisma from "../db";

type Categoria = Prisma.categoriaGetPayload<{
    include: {
        postagens: true
    }
}>;

export const categoriaSelectModels = {
    public: {
        id: true,
        nome: true,
        descricao: true
    }
} satisfies SelectModels<'categoria'>;

export const categoriaVSRepo = setupVSRepo<Categoria, 'categoria'>()({
    tableName: "categoria",
    pkName: "id",
    selectModels: categoriaSelectModels,
    defaultSelectModel: 'public',
    relations: {
        postagens: {
            pk: "id",
            mode: "mtm",
            restriction: "add"
        }
    },
    methods: {
        createManyAndReturn: {
            map: true,
        },
        deleteManyByIdIn : {
            map: true
        },
        countByPostagens: {
            map: true
        }
    }
});

const categoriaRepository = categoriaVSRepo
    .build(prisma)
    .extend((vsrepo)=>({
        deletarNormalizandoIds: async (ids: string[]) => {
            return vsrepo.deleteManyByIdIn(ids.map(id=>id.toLowerCase()))
        }
    }));
export default categoriaRepository;