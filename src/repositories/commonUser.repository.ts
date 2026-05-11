import prisma from "../db";
import type { Prisma } from "../generated/prisma/client";
import { setupVSRepo, type WhereModel, type SelectModels, type SelectModel } from "../VSRepository/VSRepository";

type CommonUser = Prisma.CommonUserGetPayload<{
    include: {

    }
}>;

export const commonUserToRelationModel = {
    id: true,
    biography: true,
    birthDate: true,
    createdAt: true,
    image: true,
} satisfies SelectModel<'CommonUser'>;

export const commonUserSelectModels = {
    public: {
        
    },
    toRelationModel: commonUserToRelationModel
} satisfies SelectModels<'CommonUser'>;

export const commonUserRequiredWhere = {
    
} satisfies WhereModel<'CommonUser'>;

export const commonUserVSRepo = setupVSRepo<CommonUser, 'CommonUser'>()({
    tableName: 'commonUser',
    pkName: 'id',
    selectModels: commonUserSelectModels,
    defaultSelectModel: 'public',
    requiredWhere: commonUserRequiredWhere,
    relations: {

    },
    methods: {

    }
});

const commonUserRepository = commonUserVSRepo.build(prisma);
export default commonUserRepository;