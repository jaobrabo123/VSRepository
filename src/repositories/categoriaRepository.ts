import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type MethodConfig, type ModelWhere, type RepositoryRelations, type SelectModels } from "../VSRepository/VSRepository";

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

type ThisMethodConfig = MethodConfig<{
    tableName: 'categoria',
    selectModels: typeof categoriaSelectModels
}>;

export class CategoriaRepository extends VSRepository<Categoria, 'categoria'> {
    readonly pkName = "id";
    readonly tableName = "categoria";
    readonly selectModels = categoriaSelectModels;
    readonly defaultSelectModel = 'public';
    readonly relations = {
        postagens: {
            pk: "id",
            mode: "mtm",
            restriction: "add"
        }
    } satisfies RepositoryRelations<Categoria>;
    readonly requiredWhere = {} satisfies ModelWhere<'categoria'>;

    createManyAndReturn = {
        map: true
    } satisfies ThisMethodConfig;

    deleteManyByIdIn = {
        map: true
    } satisfies ThisMethodConfig;

    countByPostagens = {
        map: true,
    } satisfies ThisMethodConfig;

}

const categoriaRepository = new CategoriaRepository().build(prisma);
export default categoriaRepository;
