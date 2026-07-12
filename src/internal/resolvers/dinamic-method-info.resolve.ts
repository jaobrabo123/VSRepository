import { VSRepoBuildError } from "../errors/vs-repo.error";
import { DinamicMethodInfo } from "./types/dinamic-method-info.type";
import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveDinamicMethodInfo(instance: RepositoryBuildInstance, dinamicMethod: string, originalKey: string) {
    const dinamicMethodInfo: DinamicMethodInfo = {
        onlyBaseWheres: false,
        ignoreWhere: false,
        ignoreOrderByAndPagination: true,
        ignoreSelect: false,
        keyToMapReplaced: "",
        argsCount: 0,
        method: "unknown",
        existsMode: false,
        ignoreSkipDuplicates: true,
        whereParams: [],
        otherParams: [],
        ignoreDistinct: true,
    };

    if (dinamicMethod === "aggregate") {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("aggregate", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.method = "aggregate";
        dinamicMethodInfo.prismaArgsIndex = 0;
        dinamicMethodInfo.otherParams.push("prismaArgs");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod === "groupBy") {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("groupBy", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.method = "groupBy";
        dinamicMethodInfo.prismaArgsIndex = 0;
        dinamicMethodInfo.otherParams.push("prismaArgs");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("findUniqueOrThrowBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findUniqueOrThrowBy", "");
        dinamicMethodInfo.method = "findUniqueOrThrow";
    } else if (dinamicMethod.startsWith("findUniqueBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findUniqueBy", "");
        dinamicMethodInfo.method = "findUnique";
    } else if (dinamicMethod.startsWith("findFirstOrThrowBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findFirstOrThrowBy", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirstOrThrow";
    } else if (dinamicMethod.startsWith("findFirstOrThrow")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findFirstOrThrow", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirstOrThrow";
    } else if (dinamicMethod.startsWith("findFirstBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findFirstBy", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
    } else if (dinamicMethod.startsWith("findFirst")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findFirst", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
    } else if (dinamicMethod.startsWith("countBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("countBy", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.method = "count";
    } else if (dinamicMethod.startsWith("countWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("countWhere", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.method = "count";
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where");
        dinamicMethodInfo.argsCount += 1;
    } else if (dinamicMethod.startsWith("count")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("count", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.method = "count";
    } else if (dinamicMethod.startsWith("existsBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("existsBy", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.existsMode = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
    } else if (dinamicMethod.startsWith("existsWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("existsWhere", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.existsMode = true;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where");
        dinamicMethodInfo.argsCount += 1;
    } else if (dinamicMethod.startsWith("findManyBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findManyBy", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findMany";
    } else if (dinamicMethod.startsWith("findMany")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findMany", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findMany";
    } else if (dinamicMethod.startsWith("createManyAndReturn")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("createManyAndReturn", "");
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.ignoreSkipDuplicates = false;
        dinamicMethodInfo.method = "createManyAndReturn";
        dinamicMethodInfo.dataIndex = 0;
        dinamicMethodInfo.otherParams.push("data");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("createMany")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("createMany", "");
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.ignoreSkipDuplicates = false;
        dinamicMethodInfo.method = "createMany";
        dinamicMethodInfo.dataIndex = 0;
        dinamicMethodInfo.otherParams.push("data");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("create")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("create", "");
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.method = "create";
        dinamicMethodInfo.dataIndex = 0;
        dinamicMethodInfo.otherParams.push("data");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("updateManyAndReturnBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("updateManyAndReturnBy", "");
        dinamicMethodInfo.method = "updateManyAndReturn";
        dinamicMethodInfo.dataIndex = -2;
        dinamicMethodInfo.otherParams.push("data");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("updateManyAndReturnWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("updateManyAndReturnWhere", "");
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.method = "updateManyAndReturn";
        dinamicMethodInfo.dataIndex = -2;
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where", "data");
        dinamicMethodInfo.argsCount += 2;
    } else if (dinamicMethod.startsWith("updateManyBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("updateManyBy", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.method = "updateMany";
        dinamicMethodInfo.dataIndex = -2;
        dinamicMethodInfo.otherParams.push("data");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("updateManyWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("updateManyWhere", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.method = "updateMany";
        dinamicMethodInfo.dataIndex = -2;
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where", "data");
        dinamicMethodInfo.argsCount += 2;
    } else if (dinamicMethod.startsWith("updateBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("updateBy", "");
        dinamicMethodInfo.method = "update";
        dinamicMethodInfo.dataIndex = -2;
        dinamicMethodInfo.otherParams.push("data");
        dinamicMethodInfo.argsCount++;
    } else if (dinamicMethod.startsWith("upsertBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("upsertBy", "");
        dinamicMethodInfo.method = "upsert";
        dinamicMethodInfo.createIndex = -2;
        dinamicMethodInfo.updateIndex = -3;
        dinamicMethodInfo.otherParams.push("update");
        dinamicMethodInfo.otherParams.push("create");
        dinamicMethodInfo.argsCount += 2;
    } else if (dinamicMethod.startsWith("deleteManyBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("deleteManyBy", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.method = "deleteMany";
    } else if (dinamicMethod.startsWith("deleteManyWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("deleteManyWhere", "");
        dinamicMethodInfo.ignoreSelect = true;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.method = "deleteMany";
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where");
        dinamicMethodInfo.argsCount += 1;
    } else if (dinamicMethod.startsWith("deleteBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("deleteBy", "");
        dinamicMethodInfo.method = "delete";
    } else if (dinamicMethod.startsWith("findWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findWhere", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where");
        dinamicMethodInfo.argsCount += 1;
    } else if (dinamicMethod.startsWith("findOneWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findOneWhere", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where");
        dinamicMethodInfo.argsCount += 1;
    } else if (dinamicMethod.startsWith("findListWhere")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findListWhere", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreWhere = true;
        dinamicMethodInfo.onlyBaseWheres = true;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findMany";
        dinamicMethodInfo.whereIndex = 0;
        dinamicMethodInfo.otherParams.push("where");
        dinamicMethodInfo.argsCount += 1;
    } else if (dinamicMethod.startsWith("findOneBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findOneBy", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = "findFirst";
    } else if (dinamicMethod.startsWith("findBy")) {
        dinamicMethodInfo.keyToMapReplaced = dinamicMethod.replace("findBy", "");
        dinamicMethodInfo.ignoreOrderByAndPagination = false;
        dinamicMethodInfo.ignoreDistinct = false;
        dinamicMethodInfo.method = instance.methods?.[originalKey]?.fbMode === "one" ? "findFirst" : "findMany";
    } else {
        throw new VSRepoBuildError(
            `[VSRepository] (${instance.tableName}: build) Unknown method: ${dinamicMethod}.`,
        );
    }

    return dinamicMethodInfo;
}
