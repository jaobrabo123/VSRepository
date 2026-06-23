import { VSRepoRuntimeError } from "../errors/vs-repo.error";
import { RepositoryBuildInstance } from "../resolvers/types/repository-build-instance.type";
import { isObject } from "./is-object.validate";

export function validateObjWithRelations(
    instance: RepositoryBuildInstance,
    obj: Record<string, unknown>,
    relationsKeys: string[]
) {
    const relations = instance.relations;

    if (!relations) return;

    for (let i = 0; i < relationsKeys.length; i++) {
        const key = relationsKeys[i]!;

        if (obj[key] === undefined) continue;

        const relation = relations[key]!;
        if (relation.mode === "mtm" || relation.mode === "otm") {
            if (obj[key] === null) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${instance.tableName}: runtime) '${key}' cannot be 'null' when relation mode is "mtm" or "otm", use an empty array instead.`,
                );
            } else if (!Array.isArray(obj[key]) || obj[key].some(val => !isObject(val))) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${instance.tableName}: runtime) '${key}' must be a valid array of objects when relation mode is "mtm" or "otm".`,
                );
            }
        } else {
            if (obj[key] === null) {
                if (relation.mode === "oto" && relation.restriction !== "set") {
                    throw new VSRepoRuntimeError(
                        `[VSRepository] (${instance.tableName}: runtime) '${key}' can be 'null' only if the relation restriction is "set" and mode is "oto".`,
                    );
                } else if (relation.mode === "mto" && !relation.nullable && !relation.nullAble) {
                    throw new VSRepoRuntimeError(
                        `[VSRepository] (${instance.tableName}: runtime) '${key}' can be 'null' only if the relation 'nullable' is 'true' and mode is "mto".`,
                    );
                }
            } else if (!isObject(obj[key])) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${instance.tableName}: runtime) '${key}' must be a valid object when relation mode is "oto" or "mto".`,
                );
            }
        }
    }
}
