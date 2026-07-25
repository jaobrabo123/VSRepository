import z from "zod";
import { QueryMethodArg } from "./types/query-method-arg.type";
import { objectSchema } from "../utils/schemas.util";
import { RepositoryBuildInstance } from "../resolvers/types/repository-build-instance.type";
import { VSRepoRuntimeError } from "../errors/vs-repo.error";

export function validateQueryMethodArg(arg: unknown, instance: RepositoryBuildInstance): QueryMethodArg {
    const queryArgSchema = z.strictObject({
        args: z.array(z.any()),
        db: objectSchema.optional(),
    });

    const argParsed = queryArgSchema.safeParse(arg);

    if (!argParsed.success) {
        const firstIssue = argParsed.error.issues[0];
        const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
        throw new VSRepoRuntimeError(
            `[VSRepository] (${instance.tableName}: runtime) ${path}: ${firstIssue?.message}`,
            "67542",
        );
    }

    return argParsed.data;
}
