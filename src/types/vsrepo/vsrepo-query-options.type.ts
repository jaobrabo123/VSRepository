/**
 * Options accepted by `VSRepository.query()`.
 *
 * @publicApi
 */
export type VSRepoQueryOptions = {
    /** Positional parameters injected into the SQL placeholders (`$1`, `$2`, ...). */
    args?: any[];
    /** Database client or transaction to run this query in, instead of the repository's default client. */
    db?: any;
    /**
     * Whether this is a modifying statement (`INSERT`/`UPDATE`/`DELETE`).
     * @default false
     */
    modifying?: boolean;
};
