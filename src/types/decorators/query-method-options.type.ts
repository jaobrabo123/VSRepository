/**
 * Options accepted by the `@QueryMethod` decorator.
 *
 * @publicApi
 */
export type QueryMethodOptions = {
    /**
     * When `true`, the SQL is executed as a modifying statement (`INSERT`/`UPDATE`/`DELETE`)
     * and the decorated method always resolves to the number of affected rows.
     * When `false`, the SQL is executed as a read query and the method resolves
     * to whatever return type is declared on the field.
     * @default false
     */
    modifying: boolean;
};
