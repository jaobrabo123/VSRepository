import { PlainObject } from "../types/plain-object.type";
import { isDecimal } from "./is-decimal.validator";

export function isPlainObject(value: unknown): value is PlainObject {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !isDecimal(value)
    );
}