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
import { resolveDinamicMethodInfo } from "./internal/resolvers/dinamic-method-info.resolve";
import { resolveDinamicMethodCustomization } from "./internal/resolvers/dinamic-method-customization.resolve";
import { DinamicMethodWhereOps } from "./internal/resolvers/types/dinamic-method-where-ops.type";
import { resolvePrettyWheres } from "./internal/resolvers/pretty-wheres.resolve";
import { PrismaArgs } from "./internal/resolvers/types/prisma-args.type";
import { ResolveDbAndPrismaArgsData } from "./internal/resolvers/types/resolve-db-and-prisma-args-data.type";
import { MethodOptions } from "./internal/validation/types/method-options.type";
import { resolveSpecificWhere } from "./internal/resolvers/specific-where.resolve";
import { resolveDbAndPrismaArgs } from "./internal/resolvers/dbAndPrismaArgs.resolve";
import { validateMethodOptions } from "./internal/validation/method-options.validate";

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
    defaultOrdenation?: object | object[];

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
        this.defaultOrdenation = validatedConfig.defaultOrdenation;
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
                methodToMap = methods[originalKey]?.proxyTo ?? methodToMap;

                const dinamicMethodInfo = resolveDinamicMethodInfo(
                    buildInstance,
                    methodToMap,
                    originalKey,
                );

                const dinamicMethodCustomization = resolveDinamicMethodCustomization(
                    buildInstance,
                    dinamicMethodInfo,
                    originalKey,
                );

                const dinamicMethodWhereOps: DinamicMethodWhereOps = {
                    uglyWheres: [],
                    prettyWheres: [],
                    whereType: methods[originalKey]?.whereType ?? "extending",
                    pushWhere: methods[originalKey]?.pushWhere,
                };

                if (!dinamicMethodInfo.ignoreWhere) {
                    resolvePrettyWheres(dinamicMethodInfo, dinamicMethodWhereOps);
                    if (showWorking) {
                        const argsSimulation: any[] = [];

                        for (let x = 0; x < dinamicMethodInfo.argsCount; x++) {
                            argsSimulation[x] = "00";
                        }

                        logger(
                            `Where object resolved to ${methodToMap}:`,
                            "build",
                            buildInstance.tableName,
                            resolveSpecificWhere(
                                argsSimulation,
                                dinamicMethodWhereOps.prettyWheres,
                            ),
                        );

                        // logger(
                        //     `Where object resolved to ${methodToMap}:`,
                        //     "build",
                        //     buildInstance.tableName,
                        //     dinamicMethodWhereOps.prettyWheres,
                        // );
                    }
                }

                let select: object | undefined = undefined;
                if (dinamicMethodInfo.existsMode) {
                    select = { [buildInstance.pkName]: true };
                }

                buildInstance.vsrepocache.set(
                    originalKey,
                    (args: any[], methodOptions?: MethodOptions) => {
                        if (dinamicMethodInfo.prismaArgsIndex !== undefined)
                            return args.at(dinamicMethodInfo.prismaArgsIndex);

                        const resolveDbAndPrismaArgsData: ResolveDbAndPrismaArgsData = {
                            instance: buildInstance,
                            options: methodOptions,
                            alreadyValidatedOptions: true,
                            baseConfig: {
                                active: true,
                                defaultSelect: methods[originalKey]?.selectModel,
                                ignoreRequiredWhere:
                                    dinamicMethodWhereOps.whereType === "overwrite",
                            },
                            withoutWhere: dinamicMethodInfo.ignoreWhere,
                            specificSelect: select,
                            pushWhere: dinamicMethodWhereOps.pushWhere,
                            withoutSelect: dinamicMethodInfo.ignoreSelect,
                            skipDuplicates: dinamicMethodCustomization.skipDuplicates,
                            ordenation:
                                dinamicMethodCustomization.orderPosition !== undefined
                                    ? args.at(dinamicMethodCustomization.orderPosition)
                                    : dinamicMethodCustomization.injectOrdenation,
                            pagination:
                                dinamicMethodCustomization.paginationPosition !== undefined
                                    ? args.at(dinamicMethodCustomization.paginationPosition)
                                    : dinamicMethodCustomization.injectPagination,
                            dataPayload:
                                dinamicMethodInfo.dataIndex !== undefined
                                    ? args.at(dinamicMethodInfo.dataIndex)
                                    : undefined,
                            createPayload:
                                dinamicMethodInfo.createIndex !== undefined
                                    ? args.at(dinamicMethodInfo.createIndex)
                                    : undefined,
                            updatePayload:
                                dinamicMethodInfo.updateIndex !== undefined
                                    ? args.at(dinamicMethodInfo.updateIndex)
                                    : undefined,
                            withOrdenationAndPagination:
                                !dinamicMethodInfo.ignoreOrderByAndPagination,
                            distinctKeys: dinamicMethodCustomization.distinctKeys,
                        };

                        if (!dinamicMethodInfo.ignoreWhere) {
                            resolveDbAndPrismaArgsData.specificWhere = resolveSpecificWhere(
                                args,
                                dinamicMethodWhereOps.prettyWheres,
                            );
                        } else if (dinamicMethodInfo.onlyBaseWheres) {
                            resolveDbAndPrismaArgsData.specificWhere =
                                dinamicMethodInfo.whereIndex !== undefined
                                    ? args.at(dinamicMethodInfo.whereIndex)
                                    : {};
                        }

                        const { prismaArgs } = resolveDbAndPrismaArgs(resolveDbAndPrismaArgsData);

                        return prismaArgs;
                    },
                );

                (buildInstance as any)[originalKey] = async (...args: any[]) => {
                    let db = buildInstance.prisma;
                    let methodOptions: MethodOptions | undefined = undefined;

                    if (args.length < dinamicMethodInfo.argsCount) {
                        const missingParams = dinamicMethodInfo.whereParams
                            .concat(dinamicMethodInfo.otherParams)
                            .slice(args.length);

                        throw new VSRepoRuntimeError(
                            `[VSRepository] (${buildInstance.tableName}: runtime) Missing parameters: ${missingParams.join(", ")}`,
                            "48670",
                        );
                    } else if (args.length > dinamicMethodInfo.argsCount) {
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
                              dinamicMethodInfo.method,
                              prismaArgs,
                          )
                        : undefined;

                    try {
                        const result =
                            await db[buildInstance.tableName][dinamicMethodInfo.method](prismaArgs);

                        if (showWorking)
                            performanceLoggerEnd(
                                buildInstance.tableName,
                                dinamicMethodInfo.method,
                                start!,
                            );

                        if (dinamicMethodInfo.existsMode) {
                            return !!result;
                        }
                        return result;
                    } catch (err) {
                        // logger(
                        //     `Fatal error when executing ${dinamicMethodInfo.method}:`,
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
