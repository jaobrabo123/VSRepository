import { VSRepoRelations } from "../../../types/vsrepo/vsrepo-relations.type";
import { PlainObject } from "../types/plain-object.type";
import { isPlainObject } from "../validators/is-plain-object.validator";

export function parsePrismaInclude<T>(relations: VSRepoRelations<T>): PlainObject {
    const include: PlainObject = {};

    for (const [key, value] of Object.entries(relations)) {
        if (isPlainObject(value)) {
            include[key] = { include: parsePrismaInclude(value) };
        } else {
            include[key] = value;
        }
    }

    return include;
}
