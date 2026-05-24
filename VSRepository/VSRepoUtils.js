import z from "zod";
import { VSRepoConfigError, VSRepoBuildError } from "./VSRepoError.js";

const stringSchema = z.string().trim().nonempty();
const objectSchema = z.looseObject({});
const booleanSchema = z.boolean();

export function validateConfig(config) {
    const configSchema = z.strictObject({
        tableName: stringSchema,
        pkName: stringSchema,
        selectModels: z.record(stringSchema, objectSchema).optional(),
        defaultSelectModel: stringSchema.optional(),
        requiredWhere: objectSchema.optional(),
        relations: z.record(
            stringSchema,
            z.strictObject({
                mode: z.enum(['otm', 'mtm', 'mto', 'oto']),
                restriction: z.enum(['set', 'add']),
                pk: stringSchema,
                nullAble: booleanSchema.optional(),
            })
        ).optional(),
        methods: z.record(stringSchema, z.strictObject({
            map: booleanSchema,
            selectModel: stringSchema.or(z.literal(false)).optional(),
            whereType: z.enum(["overwrite", "extending"]).optional(),
            proxyTo: stringSchema.optional(),
            pushWhere: objectSchema.optional(),
            fbMode: z.enum(["one", "list"]).optional(),
            injectOrdenation: objectSchema.or(z.array(objectSchema)).optional(),
            injectPagination: objectSchema.optional()
        })).optional()
    }).superRefine((config, ctx)=>{
        if (config.defaultSelectModel && !config.selectModels?.[config.defaultSelectModel]) {
            ctx.addIssue({
                code: "vs_custom",
                path: ["defaultSelectModel"],
                message: "must be a valid key of 'selectModels'",
            });
        }

        if (config.methods) {
            for (const [key, method] of Object.entries(config.methods)) {
                if (method.selectModel && !config.selectModels?.[method.selectModel]) {
                    ctx.addIssue({
                        code: "vs_custom",
                        path: ["methods", key, "selectModel"],
                        message: "must be a valid key of 'selectModels'",
                    });
                }
            }
        }
    });

    const configParsed = configSchema.safeParse(config);

    if(!configParsed.success) {
        const firstIssue = configParsed.error.issues[0];
        const path = firstIssue.path.length ? firstIssue.path.join(".") : "config";
        throw new VSRepoConfigError(`[VSRepository] (config) ${path}: ${firstIssue.message}`)
    }

    return configParsed.data;
}

export function validateBuildConfig(buildConfig, buildInstance) {
    const activeSchema = booleanSchema.default(true);
    const defaultSelectSchema = buildInstance.selectModels ?
        z.enum(Object.keys(buildInstance.selectModels)).optional()
        : z.never("can only be passed if you have configured 'selectModels'.");
    const ignoreRequiredWhereSchema = booleanSchema.default(false);

    const buildConfigSchema = z.strictObject({
        freeze: booleanSchema.default(true),
        showWorking: booleanSchema.default(false),
        baseMethods: z.strictObject({
            get: z.strictObject({
                active: activeSchema,
                defaultSelect: defaultSelectSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            getOrThrow: z.strictObject({
                active: activeSchema,
                defaultSelect: defaultSelectSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            getAll: z.strictObject({
                active: activeSchema,
                defaultSelect: defaultSelectSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            remove: z.strictObject({
                active: activeSchema,
                defaultSelect: defaultSelectSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            save: z.strictObject({
                active: activeSchema,
                defaultSelect: defaultSelectSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            removeList: z.strictObject({
                active: activeSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            total: z.strictObject({
                active: activeSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
            has: z.strictObject({
                active: activeSchema,
                ignoreRequiredWhere: ignoreRequiredWhereSchema
            }).optional(),
        }).optional()
    });

    const buildConfigParsed = buildConfigSchema.safeParse(buildConfig);

    if(!buildConfigParsed.success) {
        const firstIssue = buildConfigParsed.error.issues[0];
        const path = firstIssue.path.length ? firstIssue.path.join(".") : "config";
        throw new VSRepoBuildError(`[VSRepository] (build) ${path}: ${firstIssue.message}`)
    }

    return buildConfigParsed.data;
}
