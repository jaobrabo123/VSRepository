import { DinamicMethodCustomization } from "./types/dinamic-method-customization.type";
import { DinamicMethodInfo } from "./types/dinamic-method-info.type";
import { RepositoryBuildInstance } from "./types/repository-build-instance.type";

export function resolveDinamicMethodCustomization(
    instance: RepositoryBuildInstance,
    dinamicMethodInfo: DinamicMethodInfo,
    originalKey: string,
) {
    const dinamicMethodCustomization: DinamicMethodCustomization = {};

    if (!dinamicMethodInfo.ignoreSkipDuplicates) {
        if (dinamicMethodInfo.keyToMapReplaced.endsWith("SkipDuplicates")) {
            dinamicMethodInfo.keyToMapReplaced = dinamicMethodInfo.keyToMapReplaced.replace(
                "SkipDuplicates",
                "",
            );
            dinamicMethodCustomization.skipDuplicates = true;
        }
    }
 
    if (!dinamicMethodInfo.ignoreOrderByAndPagination) {
        dinamicMethodCustomization.injectOrdenation = instance.methods?.[originalKey]?.injectOrdenation;
        dinamicMethodCustomization.injectPagination = instance.methods?.[originalKey]?.injectPagination;

        if (dinamicMethodInfo.keyToMapReplaced.endsWith("PaginatedAndOrdered")) {
            dinamicMethodCustomization.orderPosition = -2;
            dinamicMethodCustomization.paginationPosition = -3;

            dinamicMethodInfo.otherParams.push("pagination");
            dinamicMethodInfo.otherParams.push("order");

            dinamicMethodInfo.keyToMapReplaced = dinamicMethodInfo.keyToMapReplaced.replace(
                "PaginatedAndOrdered",
                "",
            );

            dinamicMethodInfo.argsCount += 2;
        } else if (dinamicMethodInfo.keyToMapReplaced.endsWith("OrderedAndPaginated")) {
            dinamicMethodCustomization.orderPosition = -3;
            dinamicMethodCustomization.paginationPosition = -2;

            dinamicMethodInfo.otherParams.push("order");
            dinamicMethodInfo.otherParams.push("pagination");

            dinamicMethodInfo.keyToMapReplaced = dinamicMethodInfo.keyToMapReplaced.replace(
                "OrderedAndPaginated",
                "",
            );

            dinamicMethodInfo.argsCount += 2;
        } else if (dinamicMethodInfo.keyToMapReplaced.endsWith("Paginated")) {
            dinamicMethodCustomization.paginationPosition = -2;

            dinamicMethodInfo.otherParams.push("pagination");

            dinamicMethodInfo.keyToMapReplaced = dinamicMethodInfo.keyToMapReplaced.replace(
                "Paginated",
                "",
            );

            dinamicMethodInfo.argsCount++;
        } else if (dinamicMethodInfo.keyToMapReplaced.endsWith("Ordered")) {
            dinamicMethodCustomization.orderPosition = -2;

            dinamicMethodInfo.otherParams.push("order");

            dinamicMethodInfo.keyToMapReplaced = dinamicMethodInfo.keyToMapReplaced.replace(
                "Ordered",
                "",
            );

            dinamicMethodInfo.argsCount++;
        }
    }

    return dinamicMethodCustomization;
}
