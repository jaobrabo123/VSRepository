import { VSRepoErrorType } from "../internal/enums/vsrepo-errortype.enum";

/**
 * @publicApi
 */
export class VSRepoError extends Error {
    constructor(
        message: string,
        public readonly type: VSRepoErrorType,
        cause?: unknown,
    ) {
        super(`[VSRepository] Error: ${message}`, { cause });
    }
}
