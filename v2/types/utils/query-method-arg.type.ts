/**
 * @publicApi
 */
export type QueryMethodArg<T extends Array<any>> = {
    args?: T;
    db?: any;
};
