import { VSRepoRuntimeError } from "../errors/vs-repo.error";
import { performanceLoggerEnd, performanceLoggerStart } from "../utils/logger.util";
import { isObject } from "../validation/is-object.validate";
import { validateMethodOptions } from "../validation/method-options.validate";
import { validateObjWithRelations } from "../validation/obj-with-relations.validate";
import { BuildConfig } from "../validation/types/build-config.type";
import { resolveCreateUpdatePayloadsWithRelations } from "./create-update-payloads-with-relations.resolve";
import { resolveDataPayloadWithRelations } from "./data-payload-with-relations.resolve";
import { resolveDbAndPrismaArgs } from "./dbAndPrismaArgs.resolve";
import { PrismaArgs } from "./types/prisma-args.type";
import { RepositoryBuildInstance } from "./types/repository-build-instance.type";
import merge from "deepmerge";

export function resolveBaseMethods(instance: RepositoryBuildInstance, config: BuildConfig) {
    const { baseMethods, showWorking } = config;
    const { tableName, pkName, relations, softRemovekName } = instance;
    const relationsKeys = relations ? Object.keys(relations) : [];

    // * GET
    if (baseMethods.get.active) {
        instance.get = async (pk: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.get,
                options,
                wherePkValue: pk,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "get", prismaArgs)
                : undefined;

            const result = await db[tableName].findUnique(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "get", start!);

            return result;
        };
    }

    // * GET OR THROW
    if (baseMethods.getOrThrow.active) {
        instance.getOrThrow = async (pk: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.getOrThrow,
                options,
                wherePkValue: pk,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "getOrThrow", prismaArgs)
                : undefined;

            const result = await db[tableName].findUnique(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "getOrThrow", start!);

            if (!result) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) No record was found for the provided primary key.`,
                    "20727",
                );
            }

            return result;
        };
    }

    // * GET LIST
    if (baseMethods.getList.active) {
        instance.getList = async (pks: unknown, options?: unknown) => {
            if (!Array.isArray(pks) || pks.some(pk => pk == undefined))
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pks' must an array of primary keys.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.getList,
                options,
                wherePkValue: { in: pks },
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "getList", prismaArgs)
                : undefined;

            const result = await db[tableName].findMany(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "getList", start!);

            return result;
        };
    }

    // * GET ALL
    if (baseMethods.getAll.active) {
        instance.getAll = async (options?: any) => {
            if (options !== undefined && !isObject(options))
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'options' must be a valid object.`,
                );

            const { pagination, order, ...restOptions } = options ?? {};
            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.getAll,
                options: restOptions,
                pagination,
                ordenation: order,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "getAll", prismaArgs)
                : undefined;

            const result = await db[tableName].findMany(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "getAll", start!);

            return result;
        };
    }

    // * REMOVE
    if (baseMethods.remove.active) {
        instance.remove = async (pk: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.remove,
                options,
                wherePkValue: pk,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "remove", prismaArgs)
                : undefined;

            const result = await db[tableName].delete(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "remove", start!);

            return result;
        };
    }

    // * REMOVE LIST
    if (baseMethods.removeList.active) {
        instance.removeList = async (pks: unknown, options?: unknown) => {
            if (!Array.isArray(pks) || pks.some(pk => pk == undefined))
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pks' must an array of primary keys.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.removeList,
                options,
                wherePkValue: { in: pks },
                withoutSelect: true,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "removeList", prismaArgs)
                : undefined;

            const result = await db[tableName].deleteMany(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "removeList", start!);

            return result;
        };
    }

    // * TOTAL
    if (baseMethods.total.active) {
        instance.total = async (options?: unknown) => {
            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.total,
                options,
                withoutSelect: true,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "total", prismaArgs)
                : undefined;

            const result = await db[tableName].count(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "total", start!);

            return result;
        };
    }

    // * HAS
    if (baseMethods.has.active) {
        instance.has = async (pk: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.has,
                options,
                wherePkValue: pk,
                specificSelect: { [pkName]: true },
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "has", prismaArgs)
                : undefined;

            const result = await db[tableName].findUnique(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "has", start!);

            return !!result;
        };
    }

    // * MERGE
    if (baseMethods.merge.active) {
        instance.merge = async (pk: unknown, obj: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );
            if (!isObject(obj)) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'obj' must be a valid object.`,
                );
            }

            validateObjWithRelations(instance, obj as any, relationsKeys);

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.merge,
                options,
                wherePkValue: pk,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "merge", prismaArgs)
                : undefined;

            const result = await db[tableName].findUnique(prismaArgs);

            if (!result) return null;
            if (!relations)
                return merge(result, obj, {
                    arrayMerge: (target, source) => target.concat(source),
                });

            const objKeys = Object.keys(obj);
            const objAny = obj as any;

            for (let i = 0; i < objKeys.length; i++) {
                const key = objKeys[i]!;

                if (!relationsKeys.includes(key)) {
                    result[key] = objAny[key];
                    continue;
                }

                const relation = relations[key]!;

                if ((relation.mode === "oto" || relation.mode === "mto") && isObject(result[key])) {
                    result[key] = objAny[key] === null ? null : merge(result[key], objAny[key]);
                    continue;
                } else if (
                    (relation.mode === "mtm" || relation.mode === "otm") &&
                    Array.isArray(result[key])
                ) {
                    const targetArray = result[key] as Array<Record<string, any>>;
                    const sourceArray = objAny[key] as Array<Record<string, any>>;
                    const relationPk = relation.pk;

                    const targetMap = new Map<any, Record<string, any>>();
                    const targetWithoutPk: Array<Record<string, any>> = [];
                    const sourceWithoutPk: Array<Record<string, any>> = [];

                    for (let i = 0; i < targetArray.length; i++) {
                        const item = targetArray[i]!;
                        if (item[relationPk] !== undefined) {
                            targetMap.set(item[relationPk], item);
                        } else {
                            targetWithoutPk.push(item);
                        }
                    }

                    for (let i = 0; i < sourceArray.length; i++) {
                        const sourceItem = sourceArray[i]!;
                        if (sourceItem[relationPk] !== undefined) {
                            const targetItem = targetMap.get(sourceItem[relationPk]);
                            if (targetItem) {
                                targetMap.set(
                                    sourceItem[relationPk],
                                    merge(targetItem, sourceItem),
                                );
                            } else {
                                targetMap.set(sourceItem[relationPk], sourceItem);
                            }
                        } else {
                            sourceWithoutPk.push(sourceItem);
                        }
                    }

                    result[key] = [...targetMap.values(), ...targetWithoutPk, ...sourceWithoutPk];
                    continue;
                }

                result[key] = objAny[key];
            }

            if (showWorking) performanceLoggerEnd(tableName, "merge", start!);

            return result;
        };
    }

    // * SOFT REMOVE
    if (baseMethods.softRemove.active && softRemovekName) {
        instance.softRemove = async (pk: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.softRemove,
                options,
                wherePkValue: pk,
                dataPayload: { [softRemovekName]: new Date() },
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "softRemove", prismaArgs)
                : undefined;

            const result = await db[tableName].update(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "softRemove", start!);

            return result;
        };
    }

    // * SOFT REMOVE LIST
    if (baseMethods.softRemoveList.active && softRemovekName) {
        instance.softRemoveList = async (pks: unknown, options?: unknown) => {
            if (!Array.isArray(pks) || pks.some(pk => pk == undefined))
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pks' must an array of primary keys.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.softRemoveList,
                options,
                wherePkValue: { in: pks },
                dataPayload: { [softRemovekName]: new Date() },
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "softRemoveList", prismaArgs)
                : undefined;

            const result = await db[tableName].updateManyAndReturn(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "softRemoveList", start!);

            return result;
        };
    }

    // * RESTORE
    if (baseMethods.restore.active && softRemovekName) {
        instance.restore = async (pk: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.restore,
                options,
                wherePkValue: pk,
                dataPayload: { [softRemovekName]: null },
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "restore", prismaArgs)
                : undefined;

            const result = await db[tableName].update(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "restore", start!);

            return result;
        };
    }

    // * RESTORE LIST
    if (baseMethods.restoreList.active && softRemovekName) {
        instance.restoreList = async (pks: unknown, options?: unknown) => {
            if (!Array.isArray(pks) || pks.some(pk => pk == undefined))
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pks' must an array of primary keys.`,
                );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.restoreList,
                options,
                wherePkValue: { in: pks },
                dataPayload: { [softRemovekName]: null },
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "restoreList", prismaArgs)
                : undefined;

            const result = await db[tableName].updateManyAndReturn(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "restoreList", start!);

            return result;
        };
    }

    // * SAVE
    if (baseMethods.save.active) {
        instance.save = async (obj: unknown, options?: unknown) => {
            if (!isObject(obj)) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'obj' must be a valid object.`,
                );
            }

            validateObjWithRelations(instance, obj as any, relationsKeys);

            const objAny = obj as Record<string, any>;

            if (objAny[pkName] === undefined) {
                const { db, prismaArgs } = resolveDbAndPrismaArgs({
                    instance,
                    baseConfig: baseMethods.save,
                    options,
                    withoutWhere: true,
                    dataPayload: resolveDataPayloadWithRelations(instance, objAny, relationsKeys),
                });

                const start = showWorking
                    ? performanceLoggerStart(tableName, "save", prismaArgs)
                    : undefined;

                const result = await db[tableName].create(prismaArgs);

                if (showWorking) performanceLoggerEnd(tableName, "save", start!);

                return result;
            } else {
                const { createPayload, updatePayload } = resolveCreateUpdatePayloadsWithRelations(
                    instance,
                    obj,
                    relationsKeys,
                );

                const { db, prismaArgs } = resolveDbAndPrismaArgs({
                    instance,
                    baseConfig: baseMethods.save,
                    options,
                    wherePkValue: objAny[pkName],
                    createPayload,
                    updatePayload,
                });

                const start = showWorking
                    ? performanceLoggerStart(tableName, "save", prismaArgs)
                    : undefined;

                const result = await db[tableName].upsert(prismaArgs);

                if (showWorking) performanceLoggerEnd(tableName, "save", start!);

                return result;
            }
        };
    }

    // * SAVE LIST
    if (baseMethods.saveList.active) {
        instance.saveList = async (objs: unknown, options?: unknown) => {
            if (!Array.isArray(objs) || objs.some(ob => !isObject(ob))) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'objs' must be an array of valid objects.`,
                );
            }

            const validatedOptions = validateMethodOptions(options, instance);
            const argsList: PrismaArgs[] = [];

            const queries = objs.map(obj => {
                validateObjWithRelations(instance, obj as any, relationsKeys);
                const objAny = obj as Record<string, any>;

                if (objAny[pkName] === undefined) {
                    const { prismaArgs } = resolveDbAndPrismaArgs({
                        instance,
                        baseConfig: baseMethods.saveList,
                        options: validatedOptions,
                        alreadyValidatedOptions: true,
                        withoutWhere: true,
                        dataPayload: resolveDataPayloadWithRelations(
                            instance,
                            objAny,
                            relationsKeys,
                        ),
                    });

                    argsList.push(prismaArgs);
                    return (db: any) => db[tableName].create(prismaArgs);
                } else {
                    const { createPayload, updatePayload } =
                        resolveCreateUpdatePayloadsWithRelations(instance, obj, relationsKeys);

                    const { prismaArgs } = resolveDbAndPrismaArgs({
                        instance,
                        baseConfig: baseMethods.saveList,
                        options: validatedOptions,
                        alreadyValidatedOptions: true,
                        wherePkValue: objAny[pkName],
                        createPayload,
                        updatePayload,
                    });

                    argsList.push(prismaArgs);
                    return (db: any) => db[tableName].upsert(prismaArgs);
                }
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "saveList", argsList)
                : undefined;

            const results: any[] = [];

            if (validatedOptions.db) {
                for (let i = 0; i < queries.length; i++) {
                    results.push(await queries[i]!(validatedOptions.db));
                }
            } else {
                await instance.prisma.$transaction(async (tx: any) => {
                    for (let i = 0; i < queries.length; i++) {
                        results.push(await queries[i]!(tx));
                    }
                });
            }

            if (showWorking) performanceLoggerEnd(tableName, "saveList", start!);

            return results;
        };
    }

    // * PATCH
    if (baseMethods.patch.active) {
        instance.patch = async (pk: unknown, obj: unknown, options?: unknown) => {
            if (pk == undefined)
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'pk' must be provided.`,
                );
            if (!isObject(obj)) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'obj' must be a valid object.`,
                );
            }

            validateObjWithRelations(instance, obj as any, relationsKeys);

            const { updatePayload } = resolveCreateUpdatePayloadsWithRelations(
                instance,
                obj,
                relationsKeys,
            );

            const { db, prismaArgs } = resolveDbAndPrismaArgs({
                instance,
                baseConfig: baseMethods.patch,
                options,
                wherePkValue: pk,
                dataPayload: updatePayload,
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "patch", prismaArgs)
                : undefined;

            const result = await db[tableName].update(prismaArgs);

            if (showWorking) performanceLoggerEnd(tableName, "patch", start!);

            return result;
        };
    }

    // * PATCH LIST
    if (baseMethods.patchList.active) {
        instance.patchList = async (tuples: [pk: unknown, obj: unknown][], options?: unknown) => {
            if (
                !Array.isArray(tuples) ||
                tuples.some(tuple => tuple[0] == undefined || !isObject(tuple[1]))
            ) {
                throw new VSRepoRuntimeError(
                    `[VSRepository] (${tableName}: runtime) 'tuples' must be a valid array of tuples [pk, obj].`,
                );
            }

            const validatedOptions = validateMethodOptions(options, instance);
            const argsList: PrismaArgs[] = [];

            const queries = tuples.map(tuple => {
                validateObjWithRelations(instance, tuple[1] as any, relationsKeys);
                const objAny = tuple[1] as Record<string, any>;

                const { updatePayload } = resolveCreateUpdatePayloadsWithRelations(
                    instance,
                    objAny,
                    relationsKeys,
                );

                const { prismaArgs } = resolveDbAndPrismaArgs({
                    instance,
                    baseConfig: baseMethods.patchList,
                    options: validatedOptions,
                    alreadyValidatedOptions: true,
                    wherePkValue: tuple[0],
                    dataPayload: updatePayload,
                });

                argsList.push(prismaArgs);
                return (db: any) => db[tableName].update(prismaArgs);
            });

            const start = showWorking
                ? performanceLoggerStart(tableName, "patchList", argsList)
                : undefined;

            const results: any[] = [];

            if (validatedOptions.db) {
                for (let i = 0; i < queries.length; i++) {
                    results.push(await queries[i]!(validatedOptions.db));
                }
            } else {
                await instance.prisma.$transaction(async (tx: any) => {
                    for (let i = 0; i < queries.length; i++) {
                        results.push(await queries[i]!(tx));
                    }
                });
            }

            if (showWorking) performanceLoggerEnd(tableName, "patchList", start!);

            return results;
        };
    }
}
