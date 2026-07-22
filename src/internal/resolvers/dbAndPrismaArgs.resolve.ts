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
        forceSeeMode,
        withOrdenationAndPagination,
        distinctKeys,
    } = data;

    const validatedOptions =
        alreadyValidatedOptions && options
            ? (options as MethodOptions)
            : validateMethodOptions(options, instance);

    const db = validatedOptions.db ?? instance.prisma;
    const prismaArgs: PrismaArgs = {};

    if (!withoutWhere) {
        prismaArgs.where = resolveMergeWheres(
            {
                respectRequired: !baseConfig.ignoreRequiredWhere,
                see: forceSeeMode ?? validatedOptions.see,
            },
            wherePkValue != undefined ? { [instance.pkName]: wherePkValue } : specificWhere,
            pushWhere,
            instance.requiredWhere,
            instance.softRemovekName,
        );
    }

    if (!withoutSelect) {
        if (specificSelect) {
            prismaArgs.select = specificSelect;
        } else if (validatedOptions.includeModel) {
            prismaArgs.include = instance.includeModels?.[validatedOptions.includeModel];
        } else if (validatedOptions.include) {
            prismaArgs.include = validatedOptions.include;
        } else {
            prismaArgs.select = resolveSelect(
                instance,
                validatedOptions.selectModel,
                baseConfig.defaultSelect,
            );
        }
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

    if (withOrdenationAndPagination) {
        if (instance.defaultOrdenation || ordenation) {
            prismaArgs.orderBy = ordenation ?? instance.defaultOrdenation;
        }

        if (pagination) {
            prismaArgs.skip = pagination.skip;
            prismaArgs.take = pagination.take;
            prismaArgs.cursor = pagination.cursor;
        }
    }

    if (skipDuplicates !== undefined) {
        prismaArgs.skipDuplicates = skipDuplicates;
    }

    if (distinctKeys !== undefined) {
        prismaArgs.distinct = distinctKeys;
    }

    return { db, prismaArgs };
}
