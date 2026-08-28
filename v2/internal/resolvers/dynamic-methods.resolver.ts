import { VSRepoError } from "../../errors/VSRepoError";
import { DynamicMethodOptions } from "../../types/decorators/dynamic-method-options.type";
import { DynamicMethodCustomization } from "../../types/dynamic-methods/dynamic-method-customization.type";
import { DynamicMethodInfo } from "../../types/dynamic-methods/dynamic-method-info.type";
import { DynamicMethodWhereOps } from "../../types/dynamic-methods/dynamic-method-where-ops.type";
import { Ordering } from "../../types/utils/ordering.type";
import { VSRepoArgs } from "../../types/vsrepo/vsrepo-args.type";
import { VSRepoMethod } from "../../types/vsrepo/vsrepo-method.type";
import { MethodOptions } from "../../types/utils/methods-options.type";
import { VSRepoPrettyWhere } from "../../types/vsrepo/vsrepo-pretty-where.type";
import { VSRepoQuery } from "../../types/vsrepo/vsrepo-query.type";
import { VSRepoResolveArgsData } from "../../types/vsrepo/vsrepo-resolve-args-data.type";
import { VSRepoUglyWhere } from "../../types/vsrepo/vsrepo-ugly-where.type";
import { VSRepoAdapter } from "../../VSRepoAdapter";
import { VSRepository } from "../../VSRepository";
import { DYNAMIC_METHODS_KEY } from "../constants/dynamic-methods-key.constant";
import { QUERY_METHODS_KEY } from "../constants/query-methods-key.constant";
import { VSLogLevel } from "../enums/vs-log-level.enum";
import { uncapitalize } from "../utils/uncapitalize.util";
import { VSLogger } from "../utils/vs-logger.util";
import { VSRepoValidator } from "../validators/vsrepo.validator";
import { MergeWheresResolver } from "./merge-wheres.resolver";
import merge from "deepmerge";
import { VSRepoErrorType } from "../enums/vsrepo-errortype.enum";

export class DynamicMethodsResolver<T, K> {
    constructor(
        private readonly logger: VSLogger,
        private readonly adapter: VSRepoAdapter<T>,
        private readonly mergeWheresResolver: MergeWheresResolver<T>,
        private readonly validator: VSRepoValidator<T, K>,
        private readonly defaultOrdering?: Ordering<T>,
    ) {}

    private resolveDynamicMethodInfo(dynamicMethod: string) {
        const dynamicMethodInfo: DynamicMethodInfo = {
            onlyBaseWheres: false,
            ignoreWhere: false,
            ignoreOrderByAndPagination: true,
            ignoreSelect: false,
            keyToMapReplaced: "",
            argsCount: 0,
            method: "unknown",
            existsMode: false,
            ignoreIgnoreConflicts: true,
            ignoreDistinct: true,
            whereParams: [],
            otherParams: [],
        };

        if (dynamicMethod.startsWith("findOneBy")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneBy", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.method = "findOne";
        } else if (dynamicMethod.startsWith("findBy")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findBy", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.ignoreDistinct = false;
            dynamicMethodInfo.method = "findMany";
        }
        // else if (dynamicMethod === "groupBy") {
        //     dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("groupBy", "");
        //     dynamicMethodInfo.ignoreSelect = true;
        //     dynamicMethodInfo.ignoreWhere = true;
        //     dynamicMethodInfo.method = "groupBy";
        //     dynamicMethodInfo.otherParams.push("prismaArgs"); // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        //     dynamicMethodInfo.argsCount++;
        // }
        else if (dynamicMethod.startsWith("findOneOrThrowBy")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneOrThrowBy", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.method = "findOneOrThrow";
        } else if (dynamicMethod.startsWith("findOneOrThrowWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneOrThrowWhere", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where");
            dynamicMethodInfo.argsCount += 1;
            dynamicMethodInfo.method = "findOneOrThrow";
        } else if (dynamicMethod.startsWith("findOneOrThrow")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneOrThrow", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.method = "findOneOrThrow";
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
            dynamicMethodInfo.method = "exists";
        } else if (dynamicMethod.startsWith("existsWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("existsWhere", "");
            dynamicMethodInfo.ignoreSelect = true;
            dynamicMethodInfo.existsMode = true;
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.method = "exists";
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where");
            dynamicMethodInfo.argsCount += 1;
        } else if (dynamicMethod.startsWith("createMany")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("createMany", "");
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.ignoreSelect = true;
            dynamicMethodInfo.ignoreIgnoreConflicts = false;
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
        } else if (dynamicMethod.startsWith("updateManyReturningBy")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateManyReturningBy", "");
            dynamicMethodInfo.method = "updateManyReturning";
            dynamicMethodInfo.dataIndex = -2;
            dynamicMethodInfo.otherParams.push("data");
            dynamicMethodInfo.argsCount++;
        } else if (dynamicMethod.startsWith("updateManyReturningWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace(
                "updateManyReturningWhere",
                "",
            );
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.method = "updateManyReturning";
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
        } else if (dynamicMethod.startsWith("updateWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("updateWhere", "");
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.method = "update";
            dynamicMethodInfo.dataIndex = -2;
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where", "data");
            dynamicMethodInfo.argsCount += 2;
        } else if (dynamicMethod.startsWith("upsertBy")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("upsertBy", "");
            dynamicMethodInfo.method = "upsert";
            dynamicMethodInfo.createIndex = -3;
            dynamicMethodInfo.updateIndex = -2;
            dynamicMethodInfo.otherParams.push("create", "update");
            dynamicMethodInfo.argsCount += 2;
        } else if (dynamicMethod.startsWith("upsertWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("upsertWhere", "");
            dynamicMethodInfo.method = "upsert";
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.createIndex = -3;
            dynamicMethodInfo.updateIndex = -2;
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where", "create", "update");
            dynamicMethodInfo.argsCount += 3;
        } else if (dynamicMethod.startsWith("deleteManyReturningBy")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("deleteManyReturningBy", "");
            dynamicMethodInfo.method = "deleteManyReturning";
        } else if (dynamicMethod.startsWith("deleteManyReturningWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace(
                "deleteManyReturningWhere",
                "",
            );
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.method = "deleteManyReturning";
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where");
            dynamicMethodInfo.argsCount += 1;
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
        } else if (dynamicMethod.startsWith("deleteWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("deleteWhere", "");
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where");
            dynamicMethodInfo.argsCount += 1;
            dynamicMethodInfo.method = "delete";
        } else if (dynamicMethod.startsWith("findWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findWhere", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.ignoreDistinct = false;
            dynamicMethodInfo.method = "findMany";
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where");
            dynamicMethodInfo.argsCount += 1;
        } else if (dynamicMethod.startsWith("findOneWhere")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethod.replace("findOneWhere", "");
            dynamicMethodInfo.ignoreOrderByAndPagination = false;
            dynamicMethodInfo.ignoreWhere = true;
            dynamicMethodInfo.onlyBaseWheres = true;
            dynamicMethodInfo.method = "findOne";
            dynamicMethodInfo.whereIndex = 0;
            dynamicMethodInfo.otherParams.push("where");
            dynamicMethodInfo.argsCount += 1;
        } else {
            throw new VSRepoError(
                `Unknown dynamic method: ${dynamicMethod}.`,
                VSRepoErrorType.RESOLVER,
            );
        }

        return dynamicMethodInfo;
    }

    private resolveDynamicMethodCustomization(
        dynamicMethodInfo: DynamicMethodInfo,
        methodData: DynamicMethodOptions<T>,
    ) {
        const dynamicMethodCustomization: DynamicMethodCustomization = {};

        if (!dynamicMethodInfo.ignoreIgnoreConflicts) {
            if (dynamicMethodInfo.keyToMapReplaced.endsWith("IgnoreConflicts")) {
                dynamicMethodInfo.keyToMapReplaced = dynamicMethodInfo.keyToMapReplaced.replace(
                    "IgnoreConflicts",
                    "",
                );
                dynamicMethodCustomization.ignoreConflicts = true;
            }
        }

        if (!dynamicMethodInfo.ignoreOrderByAndPagination) {
            if (dynamicMethodInfo.keyToMapReplaced.endsWith("PaginatedAndOrdered")) {
                dynamicMethodCustomization.orderPosition = -2;
                dynamicMethodCustomization.paginationPosition = -3;

                dynamicMethodInfo.otherParams.push("pagination");
                dynamicMethodInfo.otherParams.push("order");

                dynamicMethodInfo.keyToMapReplaced = dynamicMethodInfo.keyToMapReplaced.replace(
                    "PaginatedAndOrdered",
                    "",
                );

                dynamicMethodInfo.argsCount += 2;
            } else if (dynamicMethodInfo.keyToMapReplaced.endsWith("OrderedAndPaginated")) {
                dynamicMethodCustomization.orderPosition = -3;
                dynamicMethodCustomization.paginationPosition = -2;

                dynamicMethodInfo.otherParams.push("order");
                dynamicMethodInfo.otherParams.push("pagination");

                dynamicMethodInfo.keyToMapReplaced = dynamicMethodInfo.keyToMapReplaced.replace(
                    "OrderedAndPaginated",
                    "",
                );

                dynamicMethodInfo.argsCount += 2;
            } else if (dynamicMethodInfo.keyToMapReplaced.endsWith("Paginated")) {
                dynamicMethodCustomization.paginationPosition = -2;

                dynamicMethodInfo.otherParams.push("pagination");

                dynamicMethodInfo.keyToMapReplaced = dynamicMethodInfo.keyToMapReplaced.replace(
                    "Paginated",
                    "",
                );

                dynamicMethodInfo.argsCount++;
            } else if (dynamicMethodInfo.keyToMapReplaced.endsWith("Ordered")) {
                dynamicMethodCustomization.orderPosition = -2;

                dynamicMethodInfo.otherParams.push("order");

                dynamicMethodInfo.keyToMapReplaced = dynamicMethodInfo.keyToMapReplaced.replace(
                    "Ordered",
                    "",
                );

                dynamicMethodInfo.argsCount++;
            }

            const keySplitedOrderBy = dynamicMethodInfo.keyToMapReplaced.split("OrderBy");

            if (keySplitedOrderBy[1]) {
                const orderByFields = keySplitedOrderBy[1].split("And").map(uncapitalize);

                dynamicMethodCustomization.injectOrdering = orderByFields.map(field => {
                    if (field.endsWith("Asc")) {
                        field = field.replace("Asc", "");
                        return { [field]: "ASC" };
                    } else if (field.endsWith("Desc")) {
                        field = field.replace("Desc", "");
                        return { [field]: "DESC" };
                    }

                    return { [field]: "ASC" };
                });
            }

            dynamicMethodInfo.keyToMapReplaced = keySplitedOrderBy[0]!;

            dynamicMethodCustomization.injectOrdering ??= methodData.injectOrdering;
        }

        if (!dynamicMethodInfo.ignoreDistinct) {
            const keySplitedDistinct = dynamicMethodInfo.keyToMapReplaced.split("Distinct");

            if (keySplitedDistinct[1]) {
                dynamicMethodCustomization.distinctKeys = keySplitedDistinct[1]
                    .split("And")
                    .map(uncapitalize);
            }

            dynamicMethodInfo.keyToMapReplaced = keySplitedDistinct[0]!;
        }

        return dynamicMethodCustomization;
    }

    private resolveUglyWhere(keySplitedAnd: string) {
        const uglyWhere: VSRepoUglyWhere = { name: "", pushProperty: "$$$" };
        let nullMode: "is" | "not" | undefined = undefined;

        if (keySplitedAnd.includes("IsNull")) {
            uglyWhere.pushProperty = "$$$";
            uglyWhere.autoInjectVal = null;
            nullMode = "is";
            keySplitedAnd = keySplitedAnd.replace("IsNull", "");
        } else if (keySplitedAnd.includes("IsNotNull")) {
            uglyWhere.pushProperty = "not";
            uglyWhere.autoInjectVal = null;
            nullMode = "not";
            keySplitedAnd = keySplitedAnd.replace("IsNotNull", "");
        } else if (keySplitedAnd.includes("IsTrue")) {
            uglyWhere.pushProperty = "$$$";
            uglyWhere.autoInjectVal = true;
            keySplitedAnd = keySplitedAnd.replace("IsTrue", "");
        } else if (keySplitedAnd.includes("IsFalse")) {
            uglyWhere.pushProperty = "$$$";
            uglyWhere.autoInjectVal = false;
            keySplitedAnd = keySplitedAnd.replace("IsFalse", "");
        } else {
            if (keySplitedAnd.includes("IgnoreCase")) {
                uglyWhere.properties = {};
                uglyWhere.properties.ignoreCase = true;
                keySplitedAnd = keySplitedAnd.replace("IgnoreCase", "");
            }
            if (keySplitedAnd.includes("Optional")) {
                keySplitedAnd = keySplitedAnd.replace("Optional", "");
            }

            if (keySplitedAnd.includes("NotBetween")) {
                uglyWhere.pushProperty = "not";
                uglyWhere.betweenMode = true;
                keySplitedAnd = keySplitedAnd.replace("NotBetween", "");
            } else if (keySplitedAnd.includes("Between")) {
                uglyWhere.pushProperty = "$$$";
                uglyWhere.betweenMode = true;
                keySplitedAnd = keySplitedAnd.replace("Between", "");
            } else if (keySplitedAnd.includes("NotStartsWith")) {
                uglyWhere.pushProperty = "not.startsWith";
                keySplitedAnd = keySplitedAnd.replace("NotStartsWith", "");
            } else if (keySplitedAnd.includes("StartsWith")) {
                uglyWhere.pushProperty = "startsWith";
                keySplitedAnd = keySplitedAnd.replace("StartsWith", "");
            } else if (keySplitedAnd.includes("NotEndsWith")) {
                uglyWhere.pushProperty = "not.endsWith";
                keySplitedAnd = keySplitedAnd.replace("NotEndsWith", "");
            } else if (keySplitedAnd.includes("EndsWith")) {
                uglyWhere.pushProperty = "endsWith";
                keySplitedAnd = keySplitedAnd.replace("EndsWith", "");
            } else if (keySplitedAnd.includes("NotContains")) {
                uglyWhere.pushProperty = "not.contains";
                keySplitedAnd = keySplitedAnd.replace("NotContains", "");
            } else if (keySplitedAnd.includes("Contains")) {
                uglyWhere.pushProperty = "contains";
                keySplitedAnd = keySplitedAnd.replace("Contains", "");
            } else if (keySplitedAnd.includes("LessThanEqual")) {
                uglyWhere.pushProperty = "lte";
                keySplitedAnd = keySplitedAnd.replace("LessThanEqual", "");
            } else if (keySplitedAnd.includes("LessThan")) {
                uglyWhere.pushProperty = "lt";
                keySplitedAnd = keySplitedAnd.replace("LessThan", "");
            } else if (keySplitedAnd.includes("GreaterThanEqual")) {
                uglyWhere.pushProperty = "gte";
                keySplitedAnd = keySplitedAnd.replace("GreaterThanEqual", "");
            } else if (keySplitedAnd.includes("GreaterThan")) {
                uglyWhere.pushProperty = "gt";
                keySplitedAnd = keySplitedAnd.replace("GreaterThan", "");
            } else if (keySplitedAnd.includes("NotIn")) {
                uglyWhere.pushProperty = "notIn";
                keySplitedAnd = keySplitedAnd.replace("NotIn", "");
            } else if (keySplitedAnd.includes("In")) {
                uglyWhere.pushProperty = "in";
                keySplitedAnd = keySplitedAnd.replace("In", "");
            } else if (keySplitedAnd.includes("Not")) {
                uglyWhere.pushProperty = "not";
                keySplitedAnd = keySplitedAnd.replace("Not", "");
            } else {
                uglyWhere.pushProperty = "$$$";
            }
        }

        if (keySplitedAnd.includes("Without")) {
            const keySplitedConector = keySplitedAnd.split("Without");
            const specificField = keySplitedConector[1];
            if (!specificField) {
                if (nullMode) {
                    uglyWhere.pushProperty = nullMode === "not" ? "_with" : "_without";
                } else {
                    uglyWhere.pushProperty = "_without";
                    uglyWhere.autoInjectVal = {};
                }
            } else {
                uglyWhere.pushProperty = `_without.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
            }

            keySplitedAnd = keySplitedConector[0]!;
        } else if (keySplitedAnd.includes("With")) {
            const keySplitedConector = keySplitedAnd.split("With");
            const specificField = keySplitedConector[1];
            if (!specificField) {
                if (nullMode) {
                    uglyWhere.pushProperty = nullMode === "not" ? "_without" : "_with";
                } else {
                    uglyWhere.pushProperty = "_with";
                    uglyWhere.autoInjectVal = {};
                }
            } else {
                uglyWhere.pushProperty = `_with.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
            }

            keySplitedAnd = keySplitedConector[0]!;
        } else if (keySplitedAnd.includes("Some")) {
            const keySplitedConector = keySplitedAnd.split("Some");
            const specificField = keySplitedConector[1];
            if (!specificField) {
                uglyWhere.pushProperty = "_some";
                uglyWhere.autoInjectVal = {};
            } else {
                uglyWhere.pushProperty = `_some.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
            }

            keySplitedAnd = keySplitedConector[0]!;
        } else if (keySplitedAnd.includes("Every")) {
            const keySplitedConector = keySplitedAnd.split("Every");
            const specificField = keySplitedConector[1];
            if (!specificField) {
                uglyWhere.pushProperty = "_every";
                uglyWhere.autoInjectVal = {};
            } else {
                uglyWhere.pushProperty = `_every.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
            }

            keySplitedAnd = keySplitedConector[0]!;
        } else if (keySplitedAnd.includes("None")) {
            const keySplitedConector = keySplitedAnd.split("None");
            const specificField = keySplitedConector[1];
            if (!specificField) {
                uglyWhere.pushProperty = "_none";
                uglyWhere.autoInjectVal = {};
            } else {
                uglyWhere.pushProperty = `_none.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
            }

            keySplitedAnd = keySplitedConector[0]!;
        }

        keySplitedAnd = uncapitalize(keySplitedAnd);

        uglyWhere.name = keySplitedAnd;

        return uglyWhere;
    }

    private resolvePrettyWheres(dynamicMethodInfo: DynamicMethodInfo): DynamicMethodWhereOps {
        const dynamicMethodWhereOps: DynamicMethodWhereOps = {
            uglyWheres: [],
            prettyWheres: [],
        };

        let ANDMode = false;
        let keysSplitedAND = dynamicMethodInfo.keyToMapReplaced.split("AND");
        if (keysSplitedAND.length > 1) {
            ANDMode = true;
        }

        keysSplitedAND.forEach((keySplitedAND, idx) => {
            let orMode = false;
            let keysSplitedOr = idx === 0 ? keySplitedAND.split("Or") : [keySplitedAND];
            if (keysSplitedOr.length > 1) {
                orMode = true;
            }

            for (let i = 0; i < keysSplitedOr.length; i++) {
                if (keysSplitedOr[i] === "") continue;

                const keysSplitedAnd = keysSplitedOr[i]!.split("And");

                for (const keySplitedAnd of keysSplitedAnd) {
                    if (keySplitedAnd === "") continue;

                    const uglyWhere = this.resolveUglyWhere(keySplitedAnd);

                    if (!orMode) {
                        if (idx === 1 && ANDMode) {
                            uglyWhere.name = `AND.${i}idx.${uglyWhere.name}`;
                        }
                        dynamicMethodWhereOps.uglyWheres.push(uglyWhere);
                    } else {
                        uglyWhere.name = `OR.${i}idx.${uglyWhere.name}`;
                        dynamicMethodWhereOps.uglyWheres.push(uglyWhere);
                    }

                    if (uglyWhere.autoInjectVal === undefined) dynamicMethodInfo.argsCount++;
                }
            }
        });

        const prettyWheres: VSRepoPrettyWhere[] = dynamicMethodWhereOps.uglyWheres.map(arg => {
            let context: (string | number)[] = [];
            let otherProps: { ignoreCase?: boolean } | undefined = undefined;

            let argName = arg.name;
            const agrNameSplitedOr = argName.split("OR.");
            if (agrNameSplitedOr.length > 1) {
                const agrNameSplitedOrIdx = agrNameSplitedOr[1]!.split("idx.");
                context.push("OR");
                context.push(Number(agrNameSplitedOrIdx[0]));
                argName = agrNameSplitedOrIdx[1]!;
            } else {
                const agrNameSplitedAND = argName.split("AND.");
                if (agrNameSplitedAND.length > 1) {
                    const agrNameSplitedANDIdx = agrNameSplitedAND[1]!.split("idx.");
                    context.push("AND");
                    context.push(Number(agrNameSplitedANDIdx[0]));
                    argName = agrNameSplitedANDIdx[1]!;
                }
            }

            context.push(argName);
            if (arg.pushProperty !== "$$$") {
                const pushProperty = arg.pushProperty;
                const pushPropertySplitedDot = pushProperty.split(".");

                pushPropertySplitedDot.forEach(prop => context.push(prop));
            }

            if (arg.properties !== undefined) {
                const propertiesKeys = Object.keys(arg.properties);
                otherProps = {};
                for (let i = 0; i < propertiesKeys.length; i++) {
                    const key = propertiesKeys[i] as "ignoreCase";
                    otherProps[key] = arg.properties[key];
                }
                if (arg.pushProperty === "$$$") {
                    context.push("equals");
                }
            }

            dynamicMethodInfo.whereParams.push(argName);
            return {
                context,
                otherProps,
                argName,
                autoVal: arg.autoInjectVal,
                betweenMode: arg.betweenMode,
            };
        });

        dynamicMethodWhereOps.prettyWheres = prettyWheres;

        return dynamicMethodWhereOps;
    }

    private resolveVSRepoArgs(data: VSRepoResolveArgsData<T, K>): VSRepoArgs<T> {
        const {
            instance,
            options,
            wherePkValue,
            withoutSelect,
            withoutWhere,
            specificSelect,
            dataPayload,
            createPayload,
            updatePayload,
            specificWhere,
            ordering,
            pagination,
            withOrderingAndPagination,
            ignoreConflicts,
            distinctKeys,
        } = data;

        // console.log(this.adapter)

        const vsrepoArgs: VSRepoArgs<T> = {};
        vsrepoArgs.options = { db: options.db ?? this.adapter.getDbClient() };

        if (!withoutWhere) {
            vsrepoArgs.where = this.mergeWheresResolver.resolve(
                options.see,
                wherePkValue != undefined ? { [instance.pkName]: wherePkValue } : specificWhere,
            );
        }

        if (!withoutSelect) {
            vsrepoArgs.options.select = specificSelect ?? options.select;
            vsrepoArgs.options.relations = options.relations;
        }

        if (dataPayload) {
            vsrepoArgs.obj = dataPayload;
        }

        if (createPayload) {
            vsrepoArgs.create = createPayload;
        }

        if (updatePayload) {
            vsrepoArgs.update = updatePayload;
        }

        if (withOrderingAndPagination) {
            if (ordering) {
                vsrepoArgs.options.order = ordering;
            }

            if (pagination) {
                vsrepoArgs.options.pagination = pagination;
            }
        }

        if (ignoreConflicts !== undefined) {
            // * Usado no createMany
            (vsrepoArgs.options as any).ignoreConflicts = ignoreConflicts;
        }

        if (distinctKeys !== undefined) {
            // * Usado no findMany
            (vsrepoArgs.options as any).distinct = distinctKeys;
        }

        return vsrepoArgs;
    }

    private resolveSpecificWhere(args: any[], prettyWheres: VSRepoPrettyWhere[]) {
        let specificWhere: Record<string, any> = {};
        let OR: any[] | undefined;
        let AND: any[] | undefined;

        let adjust = 0;
        for (let j = 0; j < prettyWheres.length; j++) {
            let path: Record<string, any> = {};
            let current = path;
            let ormode = false;
            let andmode = false;
            let modeIdx: number;
            const currentWhereRslvd = prettyWheres[j]!;
            const context = currentWhereRslvd.context;
            const contextLength = context.length;
            const contextLengthM1 = contextLength - 1;
            for (let i = 0; i < contextLength; i++) {
                if (i < contextLengthM1) {
                    if (context[i] === "OR") {
                        ormode = true;
                    } else if (context[i] === "AND") {
                        andmode = true;
                    } else if (typeof context[i] === "number") {
                        modeIdx = context[i] as number;
                    } else {
                        if (!current[context[i]!]) current[context[i]!] = {};
                        current = current[context[i]!];
                    }
                } else {
                    if (currentWhereRslvd.autoVal !== undefined) {
                        current[context[i]!] = currentWhereRslvd.autoVal;
                        adjust++;
                    }
                    // ? Avaliar necessidade dessa validação; era usada por compatibilidade direta com o prisma
                    else if (currentWhereRslvd.betweenMode && args[j - adjust] !== undefined) {
                        current[context[i]!] = { between: args[j - adjust] };
                        // current[context[i]!]["gte"] = args[j - adjust][0];
                        // current[context[i]!]["lte"] = args[j - adjust][1];
                    } else {
                        current[context[i]!] = args[j - adjust];
                    }
                }
            }

            if (currentWhereRslvd.otherProps !== undefined) {
                Object.assign(path[currentWhereRslvd.argName], currentWhereRslvd.otherProps);
            }

            if (ormode) {
                if (!OR) OR = [];
                if (!OR[modeIdx!]) OR[modeIdx!] = {};
                OR[modeIdx!] = merge(OR[modeIdx!], path);
                // Object.assign(OR[modeIdx!], path);
            } else if (andmode) {
                if (!AND) AND = [];
                if (!AND[modeIdx!]) AND[modeIdx!] = {};
                AND[modeIdx!] = merge(AND[modeIdx!], path);
                // Object.assign(AND[modeIdx!], path);
            } else {
                specificWhere = merge(specificWhere, path);
                // Object.assign(specificWhere, path);
            }
        }

        if (OR) specificWhere.OR = OR.filter(x => x !== undefined);
        if (AND) specificWhere.AND = AND.filter(x => x !== undefined);

        return specificWhere;
    }

    resolve(instance: VSRepository<T, K, any>) {
        const dynamicMethods: VSRepoMethod<T>[] =
            Reflect.getMetadata(DYNAMIC_METHODS_KEY, instance.constructor.prototype) ?? [];

        this.logger.logDebug("Dynamic methods detected:", dynamicMethods);

        for (const method of dynamicMethods) {
            if (typeof method.propertyKey === "symbol") {
                throw new VSRepoError(`The propertyKey must be a string`, VSRepoErrorType.RESOLVER);
            }

            const originalKey = method.propertyKey;
            const methodToMap = method.proxyTo ?? originalKey;

            const dynamicMethodInfo = this.resolveDynamicMethodInfo(methodToMap);

            const dynamicMethodCustomization = this.resolveDynamicMethodCustomization(
                dynamicMethodInfo,
                method,
            );

            let dynamicMethodWhereOps: DynamicMethodWhereOps = {
                uglyWheres: [],
                prettyWheres: [],
            };

            if (!dynamicMethodInfo.ignoreWhere) {
                dynamicMethodWhereOps = this.resolvePrettyWheres(dynamicMethodInfo);
            }

            instance.$vsrepocache.set(originalKey, (args, methodOptions) => {
                const vsrepoResolveArgsData: VSRepoResolveArgsData<T, K> = {
                    instance,
                    options: methodOptions ?? {},
                    withoutWhere:
                        dynamicMethodInfo.ignoreWhere && !dynamicMethodInfo.onlyBaseWheres,
                    specificSelect: undefined, // ? Avaliar quando vai precisar
                    withoutSelect: dynamicMethodInfo.ignoreSelect,
                    ignoreConflicts: dynamicMethodCustomization.ignoreConflicts,
                    ordering:
                        dynamicMethodCustomization.orderPosition !== undefined
                            ? args.at(dynamicMethodCustomization.orderPosition)
                            : (dynamicMethodCustomization.injectOrdering ?? this.defaultOrdering),
                    pagination:
                        dynamicMethodCustomization.paginationPosition !== undefined
                            ? args.at(dynamicMethodCustomization.paginationPosition)
                            : undefined,
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
                    withOrderingAndPagination: !dynamicMethodInfo.ignoreOrderByAndPagination,
                    distinctKeys: dynamicMethodCustomization.distinctKeys,
                };

                if (!dynamicMethodInfo.ignoreWhere) {
                    vsrepoResolveArgsData.specificWhere = this.resolveSpecificWhere(
                        args,
                        dynamicMethodWhereOps.prettyWheres,
                    );
                } else if (dynamicMethodInfo.onlyBaseWheres) {
                    vsrepoResolveArgsData.specificWhere =
                        dynamicMethodInfo.whereIndex !== undefined
                            ? args.at(dynamicMethodInfo.whereIndex)
                            : {};
                }

                return this.resolveVSRepoArgs(vsrepoResolveArgsData);
            });

            // * If para evitar cálculo desnecessário
            if (this.logger.getLogLevel() === VSLogLevel.DEBUG) {
                const argsSimulation: string[] = [];

                for (let i = 0; i <= dynamicMethodInfo.argsCount; i++) {
                    argsSimulation.push(`<args>[${i}]`);
                }

                const vsrepoArgs = instance.$vsrepocache.get(originalKey)!(argsSimulation);

                const { db: _, ...options } = vsrepoArgs.options ?? {};

                this.logger.logDebug(`Args preview for ${originalKey}:`, {
                    ...vsrepoArgs,
                    options,
                });
            }

            (instance as any)[originalKey] = async (...args: any[]) => {
                let db = this.adapter.getDbClient();
                let methodOptions: MethodOptions<T> | undefined;

                if (args.length < dynamicMethodInfo.argsCount) {
                    const missingParams = dynamicMethodInfo.whereParams
                        .concat(dynamicMethodInfo.otherParams)
                        .slice(args.length);

                    throw new VSRepoError(
                        `Missing parameters: ${missingParams.join(", ")}`,
                        VSRepoErrorType.DYNAMIC,
                    );
                } else if (args.length > dynamicMethodInfo.argsCount) {
                    const optionsArg = args[args.length - 1];
                    methodOptions = this.validator.validateMethodOptions(optionsArg);
                    db = methodOptions.db ?? db;
                } else {
                    args.push("1");
                }

                const vsrepoArgs = instance.$vsrepocache.get(originalKey)!(args, methodOptions);

                const start = this.logger.startPerformLog("run " + dynamicMethodInfo.method);

                try {
                    // * Todos os métodos do adapter seguem essa precedencia de parametros
                    const argsOrdered: any[] = [
                        vsrepoArgs.where,
                        vsrepoArgs.obj,
                        vsrepoArgs.create,
                        vsrepoArgs.update,
                        vsrepoArgs.options,
                    ].filter(arg => arg !== undefined);

                    const result = await (this.adapter as any)[dynamicMethodInfo.method](
                        ...argsOrdered,
                    );

                    this.logger.endPerformLog(start);

                    return result;
                } catch (err) {
                    // ? Deixar o catch para se quiser fazer algum tratamento antes de lançar o erro

                    throw err;
                }
            };
        }
    }

    resolveQueries(instance: VSRepository<T, K, any>) {
        const queryMethods: VSRepoQuery[] =
            Reflect.getMetadata(QUERY_METHODS_KEY, instance.constructor.prototype) ?? [];

        this.logger.logDebug("Query methods detected:", queryMethods);

        for (const method of queryMethods) {
            const originalKey = method.propertyKey;

            const modifyingQueryMethod = method.modifying;
            const valueQueryMethod = method.value;

            (instance as any)[originalKey] = async (arg: unknown) => {
                const queryArgValidated = this.validator.validateQueryMethodArg(arg);
                queryArgValidated.db ??= this.adapter.getDbClient();

                const start = this.logger.startPerformLog(
                    `run ${String(originalKey)} (Modifying: ${modifyingQueryMethod})`,
                );

                try {
                    const result = await this.adapter.query(valueQueryMethod, {
                        ...queryArgValidated,
                        modifying: modifyingQueryMethod,
                    });

                    this.logger.endPerformLog(start);

                    return result;
                } catch (err) {
                    throw err;
                }
            };
        }
    }
}
