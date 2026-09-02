import { uncapitalize } from "../utils/uncapitalize.util";
import { DynamicMethodCustomization } from "./types/dynamic-method-customization.type";
import { DynamicMethodInfo } from "./types/dynamic-method-info.type";
import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveDynamicMethodCustomization(
    instance: RepositoryBuildInstance,
    dynamicMethodInfo: DynamicMethodInfo,
    originalKey: string,
) {
    const dynamicMethodCustomization: DynamicMethodCustomization = {};

    if (!dynamicMethodInfo.ignoreSkipDuplicates) {
        if (dynamicMethodInfo.keyToMapReplaced.endsWith("SkipDuplicates")) {
            dynamicMethodInfo.keyToMapReplaced = dynamicMethodInfo.keyToMapReplaced.replace(
                "SkipDuplicates",
                "",
            );
            dynamicMethodCustomization.skipDuplicates = true;
        }
    }

    if (!dynamicMethodInfo.ignoreOrderByAndPagination) {
        dynamicMethodCustomization.injectOrdering =
            instance.methods?.[originalKey]?.injectOrdering;
        dynamicMethodCustomization.injectPagination =
            instance.methods?.[originalKey]?.injectPagination;

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
