import * as v from "valibot";
import { DynamicMethodOptions } from "../../types/decorators/dynamic-method-options.type";
import { VSRepoError } from "../../errors/VSRepoError";
import orderingSchema from "./schemas/ordering.schema";
import { QueryMethodOptions } from "../../types/decorators/query-method-options.type";
import { VSRepoErrorType } from "../enums/vsrepo-error-type.enum";

export class DecoratorsValidator {
    private static readonly dynamicMethodOptionsSchema = v.object({
        proxyTo: v.optional(v.string()),
        injectOrdering: v.optional(orderingSchema),
    });

    static validateDynamicMethodOptions(options: unknown): DynamicMethodOptions {
        const parsed = v.safeParse(this.dynamicMethodOptionsSchema, options);

        if (!parsed.success) {
            const firstIssue = parsed.issues[0];
            const path = firstIssue.path?.length
                ? firstIssue.path.map(p => String(p.key)).join(".")
                : "options";
            throw new VSRepoError(`${path}: ${firstIssue.message}`, VSRepoErrorType.DECORATOR);
        }

        return parsed.output as DynamicMethodOptions;
    }

    private static queryMethodOptionsSchema = v.object({
        modifying: v.optional(v.boolean(), false),
    });

    static validateQueryMethodOptions(options: unknown): QueryMethodOptions {
        const parsed = v.safeParse(this.queryMethodOptionsSchema, options);

        if (!parsed.success) {
            const firstIssue = parsed.issues[0];
            const path = firstIssue.path?.length
                ? firstIssue.path.map(p => String(p.key)).join(".")
                : "options";
            throw new VSRepoError(`${path}: ${firstIssue.message}`, VSRepoErrorType.DECORATOR);
        }

        return parsed.output as QueryMethodOptions;
    }
}
