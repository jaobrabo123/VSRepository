import { DinamicMethodInfo } from "./types/dinamic-method-info.type";
import { DinamicMethodWhereOps } from "./types/dinamic-method-where-ops.type";
import { PrettyWhere } from "./types/pretty-where.type";
import { resolveUglyWhere } from "./ugly-where.resolve";

export function resolvePrettyWheres(
    dinamicMethodInfo: DinamicMethodInfo,
    dinamicMethodWhereOps: DinamicMethodWhereOps,
) {
    let ANDMode = false;
    let keysSplitedAND = dinamicMethodInfo.keyToMapReplaced.split("AND");
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

                const uglyWhere = resolveUglyWhere(keySplitedAnd);

                if (!orMode) {
                    if (idx === 1 && ANDMode) {
                        uglyWhere.name = `AND.${i}idx.${uglyWhere.name}`;
                    }
                    dinamicMethodWhereOps.uglyWheres.push(uglyWhere);
                } else {
                    uglyWhere.name = `OR.${i}idx.${uglyWhere.name}`;
                    dinamicMethodWhereOps.uglyWheres.push(uglyWhere);
                }

                if (uglyWhere.autoInjectVal === undefined) dinamicMethodInfo.argsCount++;
            }
        }
    });

    const prettyWheres: PrettyWhere[] = dinamicMethodWhereOps.uglyWheres.map(arg => {
        let context: (string | number)[] = [];
        let otherProps: { mode?: string } | undefined = undefined;

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
                const key = propertiesKeys[i] as "mode";
                otherProps[key] = arg.properties[key];
            }
            if (arg.pushProperty === "$$$") {
                context.push("equals");
            }
        }

        dinamicMethodInfo.whereParams.push(argName);
        return {
            context,
            otherProps,
            argName,
            autoVal: arg.autoInjectVal,
            betweenMode: arg.betweenMode,
        };
    });

    dinamicMethodWhereOps.prettyWheres = prettyWheres;
}
