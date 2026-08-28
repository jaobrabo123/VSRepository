export function isDecimal(value: any): value is {
    toString(): string;
    toNumber(): number;
    toFixed(dp?: number): string;
} {
    return (
        typeof value === "object" &&
        value !== null &&
        typeof value.toNumber === "function" &&
        typeof value.toFixed === "function" &&
        typeof value.toString === "function"
    );
}
