import { VSRepoBuildError } from "../errors/vs-repo.error";
import { DynamicMethodInfo } from "./types/dynamic-method-info.type";
import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveDynamicMethodInfo(instance: RepositoryBuildInstance, dynamicMethod: string, originalKey: string) {
    const dynamicMethodInfo: DynamicMethodInfo = {
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

    if (dynamicMethod === "aggregate") {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("aggregate", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.method = "aggregate";
        dynamicMethodInfo.prismaArgsIndex = 0;
        dynamicMethodInfo.otherParams.push("prismaArgs");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod === "groupBy") {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("groupBy", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.method = "groupBy";
        dynamicMethodInfo.prismaArgsIndex = 0;
        dynamicMethodInfo.otherParams.push("prismaArgs");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("findUniqueOrThrowBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findUniqueOrThrowBy", "");
        dynamicMethodInfo.method = "findUniqueOrThrow";
    } else if (dynamicMethod.startsWith("findUniqueBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findUniqueBy", "");
        dynamicMethodInfo.method = "findUnique";
    } else if (dynamicMethod.startsWith("findFirstOrThrowBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findFirstOrThrowBy", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirstOrThrow";
    } else if (dynamicMethod.startsWith("findFirstOrThrow")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findFirstOrThrow", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirstOrThrow";
    } else if (dynamicMethod.startsWith("findFirstBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findFirstBy", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
    } else if (dynamicMethod.startsWith("findFirst")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findFirst", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
    } else if (dynamicMethod.startsWith("countBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("countBy", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.method = "count";
    } else if (dynamicMethod.startsWith("countWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("countWhere", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.method = "count";
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where");
        dynamicMethodInfo.argsCount += 1;
    } else if (dynamicMethod.startsWith("count")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("count", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.method = "count";
    } else if (dynamicMethod.startsWith("existsBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("existsBy", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.existsMode = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
    } else if (dynamicMethod.startsWith("existsWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("existsWhere", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.existsMode = true;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where");
        dynamicMethodInfo.argsCount += 1;
    } else if (dynamicMethod.startsWith("findManyBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findManyBy", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findMany";
    } else if (dynamicMethod.startsWith("findMany")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findMany", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findMany";
    } else if (dynamicMethod.startsWith("createManyAndReturn")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("createManyAndReturn", "");
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.ignoreSkipDuplicates = false;
        dynamicMethodInfo.method = "createManyAndReturn";
        dynamicMethodInfo.dataIndex = 0;
        dynamicMethodInfo.otherParams.push("data");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("createMany")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("createMany", "");
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.ignoreSkipDuplicates = false;
        dynamicMethodInfo.method = "createMany";
        dynamicMethodInfo.dataIndex = 0;
        dynamicMethodInfo.otherParams.push("data");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("create")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("create", "");
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.method = "create";
        dynamicMethodInfo.dataIndex = 0;
        dynamicMethodInfo.otherParams.push("data");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("updateManyAndReturnBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateManyAndReturnBy", "");
        dynamicMethodInfo.method = "updateManyAndReturn";
        dynamicMethodInfo.dataIndex = -2;
        dynamicMethodInfo.otherParams.push("data");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("updateManyAndReturnWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateManyAndReturnWhere", "");
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.method = "updateManyAndReturn";
        dynamicMethodInfo.dataIndex = -2;
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where", "data");
        dynamicMethodInfo.argsCount += 2;
    } else if (dynamicMethod.startsWith("updateManyBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateManyBy", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.method = "updateMany";
        dynamicMethodInfo.dataIndex = -2;
        dynamicMethodInfo.otherParams.push("data");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("updateManyWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateManyWhere", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.method = "updateMany";
        dynamicMethodInfo.dataIndex = -2;
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where", "data");
        dynamicMethodInfo.argsCount += 2;
    } else if (dynamicMethod.startsWith("updateBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateBy", "");
        dynamicMethodInfo.method = "update";
        dynamicMethodInfo.dataIndex = -2;
        dynamicMethodInfo.otherParams.push("data");
        dynamicMethodInfo.argsCount++;
    } else if (dynamicMethod.startsWith("upsertBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("upsertBy", "");
        dynamicMethodInfo.method = "upsert";
        dynamicMethodInfo.createIndex = -2;
        dynamicMethodInfo.updateIndex = -3;
        dynamicMethodInfo.otherParams.push("update");
        dynamicMethodInfo.otherParams.push("create");
        dynamicMethodInfo.argsCount += 2;
    } else if (dynamicMethod.startsWith("deleteManyBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("deleteManyBy", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.method = "deleteMany";
    } else if (dynamicMethod.startsWith("deleteManyWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("deleteManyWhere", "");
        dynamicMethodInfo.ignoreSelect = true;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.method = "deleteMany";
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where");
        dynamicMethodInfo.argsCount += 1;
    } else if (dynamicMethod.startsWith("deleteBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("deleteBy", "");
        dynamicMethodInfo.method = "delete";
    } else if (dynamicMethod.startsWith("findWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findWhere", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where");
        dynamicMethodInfo.argsCount += 1;
    } else if (dynamicMethod.startsWith("findOneWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneWhere", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where");
        dynamicMethodInfo.argsCount += 1;
    } else if (dynamicMethod.startsWith("findListWhere")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findListWhere", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreWhere = true;
        dynamicMethodInfo.onlyBaseWheres = true;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findMany";
        dynamicMethodInfo.whereIndex = 0;
        dynamicMethodInfo.otherParams.push("where");
        dynamicMethodInfo.argsCount += 1;
    } else if (dynamicMethod.startsWith("findOneBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneBy", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = "findFirst";
    } else if (dynamicMethod.startsWith("findBy")) {
        dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findBy", "");
        dynamicMethodInfo.ignoreOrderByAndPagination = false;
        dynamicMethodInfo.ignoreDistinct = false;
        dynamicMethodInfo.method = instance.methods?.[originalKey]?.fbMode === "one" ? "findFirst" : "findMany";
    } else {
        throw new VSRepoBuildError(
            `[VSRepository] (${instance.tableName}: build) Unknown method: ${dynamicMethod}.`,
        );
    }

    return dynamicMethodInfo;
}
