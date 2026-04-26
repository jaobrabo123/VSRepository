import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { setupVSRepo, type WhereModel, type SelectModels } from "../VSRepository/VSRepository";

type Foo = Prisma.fooGetPayload<{
    include: {

    }
}>;

export const fooSelectModels = {
    public: {
        
    },
} satisfies SelectModels<'foo'>;

export const fooRequiredWhere = {
    
} satisfies WhereModel<"foo">;

export const fooVSRepo = setupVSRepo<Foo, 'foo'>()({
    tableName: 'foo',
    pkName: 'id',
    selectModels: fooSelectModels,
    defaultSelectModel: 'public',
    requiredWhere: fooRequiredWhere,
    relations: {

    },
    methods: {

    }
});

const fooRepository = fooVSRepo.build(prisma);
export default fooRepository;
