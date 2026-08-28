export class VSRepoError extends Error {
    constructor(
        message: string,
        public readonly type: string,
    ) {
        super(`[VSRepository] Error: ${message}`);
    }
}
