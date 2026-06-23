import { VSRepoExtendError, VSRepository } from "../../VSRepository";
import { isObject } from "./is-object.validate";

export function validateExtension(extensionFunc: unknown, repo: VSRepository) {
    if (typeof extensionFunc !== "function") {
        throw new VSRepoExtendError(
            `[VSRepository] (${repo.tableName}: extend) 'extensionFunc' must be a valid funcion.`,
        );
    }

    const extension = extensionFunc(repo);

    if (!isObject(extension)) {
        throw new VSRepoExtendError(
            `[VSRepository] (${repo.tableName}: extend) The return of the 'extensionFunc' must be a valid object.`,
        );
    }

    return extension;
}
