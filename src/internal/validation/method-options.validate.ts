import z from "zod";
import { objectSchema } from "../utils/schemas.util";
import { MethodOptions } from "./types/method-options.type";
import { VSRepoRuntimeError } from "../errors/vs-repo.error";
import { RepositoryBuildInstance } from "../resolvers/types/repository-build-instance.type";

export function validateMethodOptions(
    options: unknown,
    instance: RepositoryBuildInstance,
): MethodOptions {
    const optionsSchema = z
        .strictObject({
            db: objectSchema.optional(),
            selectModel: z
                .literal(false)
                .or(z.enum(Object.keys(instance.selectModels ?? {})))
                .optional(),
            includeModel: z.enum(Object.keys(instance.includeModels ?? {})).optional(),
            see: z.enum(["active", "removed", "all"]).default("active"),
            include: objectSchema.optional(),
        })
        .refine(
            data => {
                return !(data.selectModel !== undefined && data.includeModel !== undefined);
            },
            {
                message: "cannot be provided with 'selectModel'.",
                path: ["includeModel"],
            },
        );

    const optionsParsed = optionsSchema.safeParse(options ?? {});

    if (!optionsParsed.success) {
        const firstIssue = optionsParsed.error.issues[0];
        const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
        throw new VSRepoRuntimeError(
            `[VSRepository] (${instance.tableName}: runtime) ${path}: ${firstIssue?.message}`,
            "67542",
        );
    }

    return optionsParsed.data;
}
