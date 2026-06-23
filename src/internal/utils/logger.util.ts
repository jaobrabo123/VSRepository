import { RepositoryBuildInstance } from "../resolvers/types/repository-build-instance.type";

export function logger(
    message: string,
    moment: "runtime" | "config" | "extend" | "build",
    tableName?: string,
    obj?: object,
) {
    console.log(
        `[VSRepository] (${tableName ?? "unknown"}: ${moment}) ${message}${obj ? "\n" : ""}`,
        JSON.stringify(obj, null, 2),
    );
}

export function performanceLoggerStart(
    tableName: string,
    operation: string,
    prismaArgs?: object,
) {
    logger(`Executing ${operation}.`, "runtime", tableName);
    if (prismaArgs)
        logger(`Built arguments to ${operation}:`, "runtime", tableName, prismaArgs);

    return performance.now();
}

export function performanceLoggerEnd(
    tableName: string,
    operation: string,
    start: number,
) {
    const end = performance.now();
    const duration = (end - start).toFixed(2);
    logger(`Executed ${operation} (took: ${duration}ms).`, "runtime", tableName);
}
