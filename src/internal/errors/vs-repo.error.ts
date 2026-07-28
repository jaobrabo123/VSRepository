import { VSRepoErrorType } from "./types/vs-repo-error-type.type";
import { VSRepoRuntimeErrorCode } from "./types/vs-repo-runtime-error-code.type";

export abstract class VSRepoError extends Error {
    abstract readonly type: VSRepoErrorType;
}

export class VSRepoConfigError extends VSRepoError {
    override readonly type = "VSREPO_CONFIG";
}

export class VSRepoBuildError extends VSRepoError {
    override readonly type = "VSREPO_BUILD";
}

export class VSRepoExtendError extends VSRepoError {
    override readonly type = "VSREPO_EXTEND";
}

export class VSRepoDecoratorError extends VSRepoError {
    override readonly type = "VSREPO_DECORATOR";
}

export class VSRepoRuntimeError extends VSRepoError {
    override readonly type = "VSREPO_RUNTIME";
    readonly code: VSRepoRuntimeErrorCode;

    constructor(message: string, code: VSRepoRuntimeErrorCode) {
        super(message);
        this.code = code;
    }
}
