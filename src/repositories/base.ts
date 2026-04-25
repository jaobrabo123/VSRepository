import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { VSRepository, type MethodConfig, type ModelWhere, type RepositoryRelations, type SelectModels } from "../VSRepository/VSRepository";

type Foo = Prisma.fooGetPayload<{
    include: {}
}>;

type ThisMethodConfig = MethodConfig<{
    tableName: 'foo',
    selectModels: typeof fooSelectModels
}>;

export const fooSelectModels = {
    public: {},
} satisfies SelectModels<'foo'>;

export const fooRequiredWhere = {} satisfies ModelWhere<'foo'>;

export class FooRepository extends VSRepository<Foo, 'foo'> {
    readonly pkName = "id";
    readonly tableName = "foo";
    readonly selectModels = fooSelectModels;
    readonly defaultSelectModel = 'public';
    readonly relations = {} satisfies RepositoryRelations<Foo>;
    readonly requiredWhere = fooRequiredWhere;

}

const fooRepository = new FooRepository().build(prisma);
export default fooRepository;
