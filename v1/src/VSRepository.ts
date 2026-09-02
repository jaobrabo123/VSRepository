export * from "./internal/errors/vs-repo.error";

import { RepositoryBuildInstance } from "./internal/resolvers/types/repository-build-instance.type";
import { validateBuildConfig } from "./internal/validation/build-config.validate";
import { validateConstructorConfig } from "./internal/validation/constructor-config.validate";
import { validateExtension } from "./internal/validation/extension.validate";
import { validatePrismaClient } from "./internal/validation/prisma-client.validate";
import { Method } from "./internal/validation/types/method.type";
import { Relation } from "./internal/validation/types/relation.type";
import { VSRepoBuildError, VSRepoRuntimeError } from "./internal/errors/vs-repo.error";
import { resolveBaseMethods } from "./internal/resolvers/base-methods.resolve";
import { logger, performanceLoggerEnd, performanceLoggerStart } from "./internal/utils/logger.util";
import { resolveDynamicMethodInfo } from "./internal/resolvers/dynamic-method-info.resolve";
import { resolveDynamicMethodCustomization } from "./internal/resolvers/dynamic-method-customization.resolve";
import { DynamicMethodWhereOps } from "./internal/resolvers/types/dynamic-method-where-ops.type";
import { resolvePrettyWheres } from "./internal/resolvers/pretty-wheres.resolve";
import { PrismaArgs } from "./internal/resolvers/types/prisma-args.type";
import { ResolveDbAndPrismaArgsData } from "./internal/resolvers/types/resolve-db-and-prisma-args-data.type";
import { MethodOptions } from "./internal/validation/types/method-options.type";
import { resolveSpecificWhere } from "./internal/resolvers/specific-where.resolve";
import { resolveDbAndPrismaArgs } from "./internal/resolvers/dbAndPrismaArgs.resolve";
import { validateMethodOptions } from "./internal/validation/method-options.validate";
import { validateQueryMethodArg } from "./internal/validation/query-method-arg.validate";

export class VSRepository {
    vsrepocache: Map<string, (args: any[], methodOptions?: MethodOptions) => PrismaArgs>;
    tableName: string;
    pkName: string;
    softRemovekName?: string;
    selectModels?: Record<string, { [x: string]: unknown }>;
    includeModels?: Record<string, { [x: string]: unknown }>;
    defaultSelectModel?: string;
    requiredWhere?: object;
    relations?: Record<string, Relation>;
    methods?: Record<string | symbol, Method>;
    defaultOrdering?: object | object[];

    constructor(config: unknown) {
        const validatedConfig = validateConstructorConfig(config);

        this.vsrepocache = new Map();
        this.tableName = validatedConfig.tableName;
        this.pkName = validatedConfig.pkName;
        this.softRemovekName = validatedConfig.softRemovekName;
        this.selectModels = validatedConfig.selectModels;
        this.includeModels = validatedConfig.includeModels;
        this.defaultSelectModel = validatedConfig.defaultSelectModel;
        this.relations = validatedConfig.relations;
        this.requiredWhere = validatedConfig.requiredWhere;
        this.methods = validatedConfig.methods;
        this.defaultOrdering = validatedConfig.defaultOrdering;
    }

    extend(extensionFunc: unknown) {
        const extension = validateExtension(extensionFunc, this);

        const extended = Object.assign(Object.create(this), extension);

        if (Object.isFrozen(this)) {
            Object.freeze(extended);
        }

        return extended;
    }

    build(prisma: unknown, config: unknown, useInstance?: any) {
        validatePrismaClient(prisma, this);

        const buildInstance: RepositoryBuildInstance = useInstance ?? Object.create(this);
        buildInstance.prisma = prisma;

        if (
            buildInstance.softRemovekName &&
            prisma[buildInstance.tableName]["fields"][buildInstance.softRemovekName]["typeName"] !==
                "DateTime"
        ) {
            throw new VSRepoBuildError(
                `[VSRepository] (${buildInstance.tableName}: build) 'typeName' of 'softRemovekName' must be "DateTime": ${buildInstance.softRemovekName}`,
            );
        }

        const validatedConfig = validateBuildConfig(config ?? {}, buildInstance);

        resolveBaseMethods(buildInstance, validatedConfig);

        const showWorking = validatedConfig.showWorking;

        const methods = buildInstance.methods;
        if (methods) {
            const methodsToMap = Object.keys(methods).filter(m => methods[m]?.map);
            if (showWorking) logger("Keys to map:", "build", buildInstance.tableName, methodsToMap);

            for (let methodToMap of methodsToMap) {
                const originalKey = methodToMap;

                if (methods[originalKey]?.query) {
                    const modifyingQueryMethod = methods[originalKey].query.modifying;
                    const valueQueryMethod = methods[originalKey].query.value;

                    (buildInstance as any)[originalKey] = async (arg: unknown) => {
                        const queryArgValidated = validateQueryMethodArg(arg, buildInstance);
                        const db = queryArgValidated.db ?? buildInstance.prisma;

                        const start = showWorking
                            ? performanceLoggerStart(
                                  buildInstance.tableName,
                                  `Query method: ${originalKey} (Modifying: ${modifyingQueryMethod})`,
                                  queryArgValidated.args,
                              )
                            : undefined;

                        try {
                            const result = await db[
                                modifyingQueryMethod ? "$executeRawUnsafe" : "$queryRawUnsafe"
                            ](valueQueryMethod, ...queryArgValidated.args);

                            if (showWorking)
                                performanceLoggerEnd(
                                    buildInstance.tableName,
                                    `Query method: ${originalKey} (Modifying: ${modifyingQueryMethod})`,
                                    start!,
                                );

                            return result;
                        } catch (err) {
                            throw err;
                        }
                    };

                    continue;
                }

                methodToMap = methods[originalKey]?.proxyTo ?? methodToMap;

                const dynamicMethodInfo = resolveDynamicMethodInfo(
                    buildInstance,
                    methodToMap,
                    originalKey,
                );

                const dynamicMethodCustomization = resolveDynamicMethodCustomization(
                    buildInstance,
                    dynamicMethodInfo,
                    originalKey,
                );

                const dynamicMethodWhereOps: DynamicMethodWhereOps = {
                    uglyWheres: [],
                    prettyWheres: [],
                    whereType: methods[originalKey]?.whereType ?? "extending",
                    pushWhere: methods[originalKey]?.pushWhere,
                };

                if (!dynamicMethodInfo.ignoreWhere) {
                    resolvePrettyWheres(dynamicMethodInfo, dynamicMethodWhereOps);
                    // if (showWorking) {
                    //     const argsSimulation: any[] = [];

                    //     for (let x = 0; x < dynamicMethodInfo.argsCount; x++) {
                    //         argsSimulation[x] = "00";
                    //     }

                    //     logger(
                    //         `Where object resolved to ${methodToMap}:`,
                    //         "build",
                    //         buildInstance.tableName,
                    //         resolveSpecificWhere(
                    //             argsSimulation,
                    //             dynamicMethodWhereOps.prettyWheres,
                    //         ),
                    //     );

                    //     // logger(
                    //     //     `Where object resolved to ${methodToMap}:`,
                    //     //     "build",
                    //     //     buildInstance.tableName,
                    //     //     dynamicMethodWhereOps.prettyWheres,
                    //     // );
                    // }
                }

                let select: object | undefined = undefined;
                if (dynamicMethodInfo.existsMode) {
                    select = { [buildInstance.pkName]: true };
                }

                buildInstance.vsrepocache.set(
                    originalKey,
                    (args: any[], methodOptions?: MethodOptions) => {
                        if (dynamicMethodInfo.prismaArgsIndex !== undefined)
                            return args.at(dynamicMethodInfo.prismaArgsIndex);

                        const resolveDbAndPrismaArgsData: ResolveDbAndPrismaArgsData = {
                            instance: buildInstance,
                            options: methodOptions,
                            alreadyValidatedOptions: true,
                            baseConfig: {
                                active: true,
                                defaultSelect: methods[originalKey]?.selectModel,
                                ignoreRequiredWhere:
                                    dynamicMethodWhereOps.whereType === "overwrite",
                            },
                            withoutWhere:
                                dynamicMethodInfo.ignoreWhere && !dynamicMethodInfo.onlyBaseWheres,
                            specificSelect: select,
                            pushWhere: dynamicMethodWhereOps.pushWhere,
                            withoutSelect: dynamicMethodInfo.ignoreSelect,
                            skipDuplicates: dynamicMethodCustomization.skipDuplicates,
                            ordering:
                                dynamicMethodCustomization.orderPosition !== undefined
                                    ? args.at(dynamicMethodCustomization.orderPosition)
                                    : dynamicMethodCustomization.injectOrdering,
                            pagination:
                                dynamicMethodCustomization.paginationPosition !== undefined
                                    ? args.at(dynamicMethodCustomization.paginationPosition)
                                    : dynamicMethodCustomization.injectPagination,
                            dataPayload:
                                dynamicMethodInfo.dataIndex !== undefined
                                    ? args.at(dynamicMethodInfo.dataIndex)
                                    : undefined,
                            createPayload:
                                dynamicMethodInfo.createIndex !== undefined
                                    ? args.at(dynamicMethodInfo.createIndex)
                                    : undefined,
                            updatePayload:
                                dynamicMethodInfo.updateIndex !== undefined
                                    ? args.at(dynamicMethodInfo.updateIndex)
                                    : undefined,
                            withOrderingAndPagination:
                                !dynamicMethodInfo.ignoreOrderByAndPagination,
                            distinctKeys: dynamicMethodCustomization.distinctKeys,
                        };

                        if (!dynamicMethodInfo.ignoreWhere) {
                            resolveDbAndPrismaArgsData.specificWhere = resolveSpecificWhere(
                                args,
                                dynamicMethodWhereOps.prettyWheres,
                            );
                        } else if (dynamicMethodInfo.onlyBaseWheres) {
                            resolveDbAndPrismaArgsData.specificWhere =
                                dynamicMethodInfo.whereIndex !== undefined
                                    ? args.at(dynamicMethodInfo.whereIndex)
                                    : {};
                        }

                        const { prismaArgs } = resolveDbAndPrismaArgs(resolveDbAndPrismaArgsData);

                        return prismaArgs;
                    },
                );

                if (showWorking) {
                    const argsSimulation = new Array<string>(dynamicMethodInfo.argsCount).fill(
                        "00",
                    );

                    const prismaArgs = buildInstance.vsrepocache.get(originalKey)!(argsSimulation);

                    logger(
                        `PrismaArgs preview for ${methodToMap}:`,
                        "build",
                        buildInstance.tableName,
                        prismaArgs,
                    );
                }

                (buildInstance as any)[originalKey] = async (...args: any[]) => {
                    let db = buildInstance.prisma;
                    let methodOptions: MethodOptions | undefined = undefined;

                    if (args.length < dynamicMethodInfo.argsCount) {
                        const missingParams = dynamicMethodInfo.whereParams
                            .concat(dynamicMethodInfo.otherParams)
                            .slice(args.length);

                        throw new VSRepoRuntimeError(
                            `[VSRepository] (${buildInstance.tableName}: runtime) Missing parameters: ${missingParams.join(", ")}`,
                            "48670",
                        );
                    } else if (args.length > dynamicMethodInfo.argsCount) {
                        const optionsArg = args[args.length - 1];
                        methodOptions = validateMethodOptions(optionsArg, buildInstance);
                        db = methodOptions.db ?? db;
                    } else {
                        args.push("1");
                    }

                    const prismaArgs = buildInstance.vsrepocache.get(originalKey)!(
                        args,
                        methodOptions,
                    );

                    const start = showWorking
                        ? performanceLoggerStart(
                              buildInstance.tableName,
                              dynamicMethodInfo.method,
                              prismaArgs,
                          )
                        : undefined;

                    try {
                        const result =
                            await db[buildInstance.tableName][dynamicMethodInfo.method](prismaArgs);

                        if (showWorking)
                            performanceLoggerEnd(
                                buildInstance.tableName,
                                dynamicMethodInfo.method,
                                start!,
                            );

                        if (dynamicMethodInfo.existsMode) {
                            return !!result;
                        }
                        return result;
                    } catch (err) {
                        // logger(
                        //     `Fatal error when executing ${dynamicMethodInfo.method}:`,
                        //     "runtime",
                        //     buildInstance.tableName,
                        //     { prismaArgs },
                        // );
                        throw err;
                    }
                };
            }
        }

        if (validatedConfig.freeze) Object.freeze(buildInstance);
        return buildInstance;
    }
}

export const setupVSRepo = () => (config: unknown) => new VSRepository(config);
