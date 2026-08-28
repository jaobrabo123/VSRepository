import { VSRepoSelect } from "../../../types/vsrepo/vsrepo-select.type";
import { PlainObject } from "../types/plain-object.type";
import { isPlainObject } from "../validators/is-plain-object.validator";

export function parsePrismaSelect<T>(relations: VSRepoSelect<T>): PlainObject {
    const select: PlainObject = {};

    for (const [key, value] of Object.entries(relations)) {
        if (isPlainObject(value)) {
            select[key] = { select: parsePrismaSelect(value) };
        } else {
            select[key] = value;
        }
    }

    return select;
}
