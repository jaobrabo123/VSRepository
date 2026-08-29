/**
 * Pagination options accepted by `getAll` and by dynamic methods with `Paginated`.
 *
 * @publicApi
 */
export type Pagination = {
    /** Maximum number of records to return. */
    limit?: number;
    /** Number of records to skip before starting to return results. */
    offset?: number;
};
