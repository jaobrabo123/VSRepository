import merge from "deepmerge";
import { PrettyWhere } from "./types/pretty-where.type";

export function resolveSpecificWhere(args: any[], prettyWheres: PrettyWhere[]) {
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
                } else if (currentWhereRslvd.betweenMode && args[j - adjust] !== undefined) {
                    current[context[i]!] = {};
                    current[context[i]!]["gte"] = args[j - adjust][0];
                    current[context[i]!]["lte"] = args[j - adjust][1];
                } else {
                    current[context[i]!] = args[j - adjust];
                }
            }
        }

        if (currentWhereRslvd.otherProps !== undefined) {
            Object.assign(current, currentWhereRslvd.otherProps);
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
