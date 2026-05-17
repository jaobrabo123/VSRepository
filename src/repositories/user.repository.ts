import prisma from "../db";
import { setupVSRepo, type WhereModel, type SelectModels, type SelectModel } from "../../VSRepository/VSRepository";
import { commonUserToRelationModel } from "./commonUser.repository";
import type { UserGetPayload } from "../generated/prisma/models";

const userPublicModel = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
    userType: true
} satisfies SelectModel<'User'>;

export const userSelectModels = {
    public: userPublicModel,
    commonUser: {
        ...userPublicModel,
        commonUser: {
            select: commonUserToRelationModel
        }
    }
} satisfies SelectModels<'User'>;

export const userRequiredWhere = {
    active: true
} satisfies WhereModel<"User">;

export const userVSRepo = setupVSRepo<UserGetPayload<{ include: { commonUser: true } }>, 'User'>()({
    tableName: 'user',
    pkName: 'id',
    selectModels: userSelectModels,
    defaultSelectModel: 'public',
    requiredWhere: userRequiredWhere,
    relations: {
        commonUser: {
            mode: 'oto',
            pk: 'id',
            restriction: 'set'
        }
    },
    methods: {
        findById: { map: true, fbMode: 'one' },
        deleteManyBy: { map: true },
        findManyByGmailOrId: {
            map: true,
            proxyTo: 'findManyByOrId',
            pushWhere: {
                OR: [{ email: { endsWith: '@gmail.com' } }]
            }
        },
        findByNameContainsOptionalAndEmail: { map: true },
        findByCommonUserSome: { map: true }
    },
});

const userRepository = userVSRepo.build(prisma, {
    showWorking: true
});
export default userRepository;