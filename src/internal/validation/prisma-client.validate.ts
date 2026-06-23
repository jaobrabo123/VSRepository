import { VSRepoBuildError } from "../../../generated/vsrepo";
import { VSRepository } from "../../VSRepository";
import { isObject } from "./is-object.validate";


export function validatePrismaClient(prisma: unknown, repo: VSRepository): asserts prisma is any {
    if (!isObject(prisma) || (prisma as any)["$transaction"] === undefined) {
        throw new VSRepoBuildError(`[VSRepository] (${repo.tableName}: build) 'prisma' must be a valid Prisma Client.`);
    }
}