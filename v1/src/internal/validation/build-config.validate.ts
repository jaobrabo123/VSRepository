import z from "zod";
import { VSRepository } from "../../VSRepository";
import { booleanSchema } from "../utils/schemas.util";
import { VSRepoBuildError } from "../errors/vs-repo.error";
import { BuildConfig } from "./types/build-config.type";

const defaultBaseMethodConfig = {
    active: true,
    ignoreRequiredWhere: false,
};

const defaultBaseMethods = {
    get: defaultBaseMethodConfig,
    getOrThrow: defaultBaseMethodConfig,
    getAll: defaultBaseMethodConfig,
    remove: defaultBaseMethodConfig,
    save: defaultBaseMethodConfig,
    patch: defaultBaseMethodConfig,
    removeList: defaultBaseMethodConfig,
    total: defaultBaseMethodConfig,
    has: defaultBaseMethodConfig,
    merge: defaultBaseMethodConfig,
    getList: defaultBaseMethodConfig,
    saveList: defaultBaseMethodConfig,
    softRemove: defaultBaseMethodConfig,
    restore: defaultBaseMethodConfig,
    softRemoveList: defaultBaseMethodConfig,
    restoreList: defaultBaseMethodConfig,
    patchList: defaultBaseMethodConfig,
};

export function validateBuildConfig(config: unknown, buildInstance: VSRepository): BuildConfig {
    const defaultSelectSchema = buildInstance.selectModels
        ? z.enum(Object.keys(buildInstance.selectModels)).optional()
        : z.never("can only be passed if you have configured 'selectModels'.").optional();
    const activeSchema = booleanSchema.default(true);
    const ignoreRequiredWhereSchema = booleanSchema.default(false);

    const baseMethodSchema = z
        .strictObject({
            active: activeSchema,
            ignoreRequiredWhere: ignoreRequiredWhereSchema,
        })
        .default(defaultBaseMethodConfig);

    const baseMethodWithSelectSchema = z
        .strictObject({
            active: activeSchema,
            defaultSelect: defaultSelectSchema,
            ignoreRequiredWhere: ignoreRequiredWhereSchema,
        })
        .default(defaultBaseMethodConfig);

    const buildConfigSchema = z.strictObject({
        freeze: booleanSchema.default(true),
        showWorking: booleanSchema.default(false),
        baseMethods: z
            .strictObject({
                get: baseMethodWithSelectSchema,
                getOrThrow: baseMethodWithSelectSchema,
                getAll: baseMethodWithSelectSchema,
                remove: baseMethodWithSelectSchema,
                save: baseMethodWithSelectSchema,
                patch: baseMethodWithSelectSchema,
                removeList: baseMethodSchema,
                total: baseMethodSchema,
                has: baseMethodSchema,
                merge: baseMethodWithSelectSchema,
                getList: baseMethodWithSelectSchema,
                saveList: baseMethodWithSelectSchema,
                softRemove: baseMethodWithSelectSchema,
                restore: baseMethodWithSelectSchema,
                softRemoveList: baseMethodWithSelectSchema,
                restoreList: baseMethodWithSelectSchema,
                patchList: baseMethodWithSelectSchema,
            })
            .default(defaultBaseMethods),
    });

    const buildConfigParsed = buildConfigSchema.safeParse(config);

    if (!buildConfigParsed.success) {
        const firstIssue = buildConfigParsed.error.issues[0];
        const path = firstIssue?.path.length ? firstIssue.path.join(".") : "config";
        throw new VSRepoBuildError(
            `[VSRepository] (${buildInstance.tableName}: build) ${path}: ${firstIssue?.message}`,
        );
    }

    return buildConfigParsed.data;
}
