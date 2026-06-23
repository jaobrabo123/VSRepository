import { SeeMode } from "../validation/types/see-mode.type";
import merge from "deepmerge";

export function resolveMergeWheres(
    config: { respectRequired: boolean; see: SeeMode },
    provided?: object,
    pushed?: object,
    required?: object,
    softRemovekName?: string,
) {
    const objectsToMerge: object[] = [];

    if (provided) objectsToMerge.push(provided);
    if (pushed) objectsToMerge.push(pushed);
    if (required && config.respectRequired) objectsToMerge.push(required);
    if (softRemovekName && config.see !== "all")
        objectsToMerge.push({ [softRemovekName]: config.see === "active" ? null : { not: null } });

    const whereResolved = merge.all(objectsToMerge, {
        arrayMerge: (target, source) => source.concat(target),
    });

    return whereResolved;
}
