import z from "zod";
import { DynamicMethodOptions } from "../../types/decorators/dynamic-method-options.type";
import { VSRepoError } from "../../errors/VSRepoError";
import orderingSchema from "./schemas/ordering.schema";

export class DecoratorsValidator {
    private static readonly dynamicMethodOptionsSchema = z.object({
        proxyTo: z.string().optional(),
        injectOrdering: orderingSchema.optional(),
    });

    static validateDynamicMethodOptions(options?: unknown): DynamicMethodOptions {
        const optionsParsed = this.dynamicMethodOptionsSchema.safeParse(options);

        if (!optionsParsed.success) {
            const firstIssue = optionsParsed.error.issues[0];
            const path = firstIssue?.path.length ? firstIssue.path.join(".") : "options";
            throw new VSRepoError(`${path}: ${firstIssue?.message}`, "DECORATOR");
        }

        return optionsParsed.data;
    }
}
