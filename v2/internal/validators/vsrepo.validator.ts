import z from "zod";
import { VSRepoOptions } from "../../types/vsrepo/vsrepo-options.type";
import { VSLogLevel } from "../enums/vs-log-level.enum";
import { VSRepoError } from "../../errors/VSRepoError";
import orderingSchema from "./schemas/ordering.schema";
import { MethodOptions } from "../../types/utils/methods-options.type";
import { QueryMethodArg } from "../../types/utils/query-method-arg.type";
import { VSRepoErrorType } from "../enums/vsrepo-errortype.enum";

export class VSRepoValidator<T, K> {
    private readonly constructorOptionsSchema = z.object({
        // * Usando any ao invés de instanceof para não ter erro de referencia
        adapter: z.any(),
        pkName: z.string(),
        hooks: z
            .record(
                z.string(),
                z.object({ before: z.function().optional(), after: z.function().optional() }),
            )
            .optional(),
        softRemoveKey: z.string().optional(),
        logLevel: z.enum(VSLogLevel).optional(),
        defaultOrdering: orderingSchema.optional(),
    });

    validateConstructorOptions(options: unknown): VSRepoOptions<T, K> {
        const optionsParsed = this.constructorOptionsSchema.safeParse(options);

        if (!optionsParsed.success) {
            const firstIssue = optionsParsed.error.issues[0];
            const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
            throw new VSRepoError(`${path}: ${firstIssue?.message}`, VSRepoErrorType.VALIDATOR);
        }

        return optionsParsed.data as unknown as VSRepoOptions<T, K>;
    }

    private readonly methodOptionsSchema = z.strictObject({
        db: z.looseObject({}).optional(),
        see: z.enum(["active", "removed", "all"]).default("active"),
        relations: z.looseObject({}).optional(),
        select: z.looseObject({}).optional(),
    });

    validateMethodOptions(options: unknown): MethodOptions<T> {
        const optionsParsed = this.methodOptionsSchema.safeParse(options ?? {});

        if (!optionsParsed.success) {
            const firstIssue = optionsParsed.error.issues[0];
            const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
            throw new VSRepoError(`${path}: ${firstIssue?.message}`, VSRepoErrorType.VALIDATOR);
        }

        return optionsParsed.data as unknown as MethodOptions<T>;
    }

    private queryArgSchema = z.strictObject({
        args: z.array(z.any()).optional(),
        db: z.looseObject({}).optional(),
    });

    validateQueryMethodArg(arg?: unknown): QueryMethodArg<any> {
        const argParsed = this.queryArgSchema.safeParse(arg ?? {});

        if (!argParsed.success) {
            const firstIssue = argParsed.error.issues[0];
            const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
            throw new VSRepoError(`${path}: ${firstIssue?.message}`, VSRepoErrorType.VALIDATOR);
        }

        return argParsed.data;
    }
}
