import z from "zod";
import { DynamicMethodOptions } from "../../types/decorators/dynamic-method-options.type";
import { VSRepoError } from "../../errors/VSRepoError";
import orderingSchema from "./schemas/ordering.schema";
import { QueryMethodOptions } from "../../types/decorators/query-method-options.type";
import { VSRepoErrorType } from "../enums/vsrepo-errortype.enum";

export class DecoratorsValidator {
    private static readonly dynamicMethodOptionsSchema = z.object({
        proxyTo: z.string().optional(),
        injectOrdering: orderingSchema.optional(),
    });

    static validateDynamicMethodOptions(options: unknown): DynamicMethodOptions {
        const optionsParsed = this.dynamicMethodOptionsSchema.safeParse(options);

        if (!optionsParsed.success) {
            const firstIssue = optionsParsed.error.issues[0];
            const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
            throw new VSRepoError(`${path}: ${firstIssue?.message}`, VSRepoErrorType.DECORATOR);
        }

        return optionsParsed.data;
    }

    private static queryMethodOptionsSchema = z.object({
        modifying: z.boolean().default(false),
    });

    static validateQueryMethodOptions(options: unknown): QueryMethodOptions {
        const optionsParsed = this.queryMethodOptionsSchema.safeParse(options);

        if (!optionsParsed.success) {
            const firstIssue = optionsParsed.error.issues[0];
            const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
            throw new VSRepoError(`${path}: ${firstIssue?.message}`, VSRepoErrorType.DECORATOR);
        }

        return optionsParsed.data;
    }
}
