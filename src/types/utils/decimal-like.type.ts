/**
 * Structural shape of an arbitrary-precision "Decimal" value, as commonly
 * returned by ORMs for `decimal`/`numeric` columns (e.g. Prisma's
 * `Prisma.Decimal`, built on top of `decimal.js`).
 *
 * Matched structurally (duck-typed) instead of importing a concrete class,
 * so the core stays ORM-agnostic — any object exposing both `toNumber()`
 * and `decimalPlaces()` is treated as Decimal-like by {@link NumericLike}
 * and, transitively, by {@link NumericKeys}.
 *
 * Note that several ORMs (e.g. Drizzle, MikroORM, TypeORM) represent
 * `decimal`/`numeric` columns as plain `string` by default, to avoid
 * floating-point precision loss — a `string` value does **not** satisfy
 * `DecimalLike`. Configure the column in a numeric mode (or provide a
 * transformer) on those ORMs if you want the field to be eligible for
 * `increment`/`decrement`/`multiply`/`divide`/`sum`/`average`/`min`/`max`.
 *
 * @publicApi
 */
export type DecimalLike = {
    toNumber(): number;
    decimalPlaces(): number;
};
