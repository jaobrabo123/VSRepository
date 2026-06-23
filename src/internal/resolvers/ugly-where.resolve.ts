import { uncapitalize } from "../utils/uncapitalize.util";
import { UglyWhere } from "./types/ugly-where.type";

export function resolveUglyWhere(keySplitedAnd: string) {
    const uglyWhere: UglyWhere = { name: "", pushProperty: "$$$" };
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
        if (keySplitedAnd.includes("Insensitive")) {
            uglyWhere.properties = {};
            uglyWhere.properties.mode = "insensitive";
            keySplitedAnd = keySplitedAnd.replace("Insensitive", "");
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
                uglyWhere.pushProperty = nullMode === "not" ? "is" : "isNot";
            } else {
                uglyWhere.pushProperty = "isNot";
                uglyWhere.autoInjectVal = {};
            }
        } else {
            uglyWhere.pushProperty = `isNot.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
        }
        keySplitedAnd = keySplitedConector[0]!;
    } else if (keySplitedAnd.includes("With")) {
        const keySplitedConector = keySplitedAnd.split("With");
        const specificField = keySplitedConector[1];
        if (!specificField) {
            if (nullMode) {
                uglyWhere.pushProperty = nullMode === "not" ? "isNot" : "is";
            } else {
                uglyWhere.pushProperty = "is";
                uglyWhere.autoInjectVal = {};
            }
        } else {
            uglyWhere.pushProperty = `is.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
        }
        keySplitedAnd = keySplitedConector[0]!;
    } else if (keySplitedAnd.includes("Some")) {
        const keySplitedConector = keySplitedAnd.split("Some");
        const specificField = keySplitedConector[1];
        if (!specificField) {
            uglyWhere.pushProperty = "some";
            uglyWhere.autoInjectVal = {};
        } else {
            uglyWhere.pushProperty = `some.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
        }
        keySplitedAnd = keySplitedConector[0]!;
    } else if (keySplitedAnd.includes("Every")) {
        const keySplitedConector = keySplitedAnd.split("Every");
        const specificField = keySplitedConector[1];
        if (!specificField) {
            uglyWhere.pushProperty = "every";
            uglyWhere.autoInjectVal = {};
        } else {
            uglyWhere.pushProperty = `every.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
        }
        keySplitedAnd = keySplitedConector[0]!;
    } else if (keySplitedAnd.includes("None")) {
        const keySplitedConector = keySplitedAnd.split("None");
        const specificField = keySplitedConector[1];
        if (!specificField) {
            uglyWhere.pushProperty = "none";
            uglyWhere.autoInjectVal = {};
        } else {
            uglyWhere.pushProperty = `none.${uncapitalize(specificField)}${uglyWhere.pushProperty === "$$$" ? "" : `.${uglyWhere.pushProperty}`}`;
        }
        keySplitedAnd = keySplitedConector[0]!;
    }

    keySplitedAnd = uncapitalize(keySplitedAnd);

    uglyWhere.name = keySplitedAnd;

    return uglyWhere;
}
