import { validateMethodOptions } from "../validation/method-options.validate";
import { MethodOptions } from "../validation/types/method-options.type";
import { resolveMergeWheres } from "./merge-wheres.resolve";
import { resolveSelect } from "./select.resolve";
import { PrismaArgs } from "./types/prisma-args.type";
import { ResolveDbAndPrismaArgsData } from "./types/resolve-db-and-prisma-args-data.type";

export function resolveDbAndPrismaArgs(data: ResolveDbAndPrismaArgsData) {
    const {
        baseConfig,
        instance,
        options,
        wherePkValue,
        withoutSelect,
        withoutWhere,
        specificSelect,
        dataPayload,
        createPayload,
        updatePayload,
        alreadyValidatedOptions,
        specificWhere,
        pushWhere,
        ordenation,
        pagination,
        skipDuplicates,
    } = data;

    const validatedOptions = alreadyValidatedOptions
        ? (options as MethodOptions)
        : validateMethodOptions(options, instance);

    const db = validatedOptions.db ?? instance.prisma;
    const prismaArgs: PrismaArgs = {};

    if (!withoutWhere) {
        prismaArgs.where = resolveMergeWheres(
            {
                respectRequired: !baseConfig.ignoreRequiredWhere,
                see: validatedOptions.see,
            },
            wherePkValue != undefined ? { [instance.pkName]: wherePkValue } : specificWhere,
            pushWhere,
            instance.requiredWhere,
            instance.softRemovekName,
        );
    }

    if (!withoutSelect) {
        prismaArgs.select =
            specificSelect ??
            resolveSelect(instance, validatedOptions.selectModel, baseConfig.defaultSelect);
    }

    if (dataPayload) {
        prismaArgs.data = dataPayload;
    }

    if (createPayload) {
        prismaArgs.create = createPayload;
    }

    if (updatePayload) {
        prismaArgs.update = updatePayload;
    }

    if (ordenation) {
        prismaArgs.orderBy = ordenation;
    }

    if (pagination) {
        prismaArgs.skip = pagination.skip;
        prismaArgs.take = pagination.take;
        prismaArgs.cursor = pagination.cursor;
    }

    if (skipDuplicates!==undefined) {
        prismaArgs.skipDuplicates = skipDuplicates;
    }

    return { db, prismaArgs };
}
