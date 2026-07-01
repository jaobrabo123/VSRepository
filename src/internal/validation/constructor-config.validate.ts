import z from "zod";
import { ConstructorConfig } from "./types/constructor-config.type";
import { booleanSchema, objectSchema, stringSchema } from "../utils/schemas.util";
import { VSRepoConfigError } from "../errors/vs-repo.error";

export function validateConstructorConfig(config: unknown): ConstructorConfig {
    const configSchema = z
        .strictObject({
            tableName: stringSchema,
            pkName: stringSchema,
            softRemovekName: stringSchema.optional(),
            selectModels: z.record(stringSchema, objectSchema).optional(),
            includeModels: z.record(stringSchema, objectSchema).optional(),
            defaultSelectModel: stringSchema.optional(),
            requiredWhere: objectSchema.optional(),
            relations: z
                .record(
                    stringSchema,
                    z.strictObject({
                        mode: z.enum(["otm", "mtm", "mto", "oto"]),
                        restriction: z.enum(["set", "add"]),
                        pk: stringSchema,
                        nullAble: booleanSchema.optional(),
                        nullable: booleanSchema.optional(),
                    }),
                )
                .optional(),
            methods: z
                .record(
                    stringSchema,
                    z.strictObject({
                        map: booleanSchema,
                        selectModel: stringSchema.or(z.literal(false)).optional(),
                        whereType: z.enum(["overwrite", "extending"]).optional(),
                        proxyTo: stringSchema.optional(),
                        pushWhere: objectSchema.optional(),
                        fbMode: z.enum(["one", "list"]).optional(),
                        injectOrdenation: objectSchema.or(z.array(objectSchema)).optional(),
                        injectPagination: objectSchema.optional(),
                    }),
                )
                .optional(),
            defaultOrdenation: objectSchema.or(z.array(objectSchema)).optional(),
        })
        .superRefine((config, ctx) => {
            if (config.defaultSelectModel && !config.selectModels?.[config.defaultSelectModel]) {
                ctx.addIssue({
                    code: "custom",
                    path: ["defaultSelectModel"],
                    message: "must be a valid key of 'selectModels'",
                });
            }

            if (config.methods) {
                for (const [key, method] of Object.entries(config.methods)) {
                    if (method.selectModel && !config.selectModels?.[method.selectModel]) {
                        ctx.addIssue({
                            code: "custom",
                            path: ["methods", key, "selectModel"],
                            message: "must be a valid key of 'selectModels'",
                        });
                    }
                }
            }
        });

    const configParsed = configSchema.safeParse(config);

    if (!configParsed.success) {
        const firstIssue = configParsed.error.issues[0];
        const path = firstIssue?.path.length ? firstIssue.path.join(".") : "config";
        throw new VSRepoConfigError(
            `[VSRepository] (unknown: config) ${path}: ${firstIssue?.message}`,
        );
    }

    return configParsed.data;
}
