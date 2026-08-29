import z from "zod";
import { VSRepoDecoratorError } from "../errors/vs-repo.error";
import { isObject } from "./is-object.validate";
import { booleanSchema } from "../utils/schemas.util";
import { QueryMethodOptions } from "./types/query-method-options.type";

export function validateQueryMethodOptions(options: unknown): QueryMethodOptions {
    if (!isObject(options)) {
        throw new VSRepoDecoratorError(
            `[VSRepository] (unknown: decorator) 'options' must be a valid object`,
        );
    }

    const optionsParsed = z
        .strictObject({ modifying: booleanSchema.default(false) })
        .safeParse(options);

    if (!optionsParsed.success) {
        const firstIssue = optionsParsed.error.issues[0];
        const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
        throw new VSRepoDecoratorError(
            `[VSRepository] (unknown: decorator) ${path}: ${firstIssue?.message}`,
        );
    }

    return optionsParsed.data;
}
