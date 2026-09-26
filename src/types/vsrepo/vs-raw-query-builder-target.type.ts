import { VSRawQueryBuilder } from "../../internal/utils/vs-raw-query-builder.util";
import { VSSql } from "../../internal/utils/vs-sql.util";

/** Anything that can be used where a table/column reference is expected.
 *
 * @publicApi
 */
export type VSRawQueryBuilderTarget =
    string | VSSql | VSRawQueryBuilder | ((subquery: VSRawQueryBuilder) => VSRawQueryBuilder | VSSql);
