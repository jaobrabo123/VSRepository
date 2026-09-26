import { VSRawQueryBuilder } from "../../internal/utils/vs-raw-query-builder.util";
import { VSSql } from "../../internal/utils/vs-sql.util";

/** Anything that can be used as a CTE's body in {@link VSRawQueryBuilder.with}/
 * {@link VSRawQueryBuilder.withRecursive}.
 *
 * @publicApi
 */
export type VSRawQueryBuilderCteQuery =
    VSSql | VSRawQueryBuilder | ((cte: VSRawQueryBuilder) => VSRawQueryBuilder | VSSql);
