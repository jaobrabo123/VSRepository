import { VSRepoErrorType } from "./types/vs-repo-error-type.type";

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

export class VSRepoRuntimeError extends VSRepoError {
    override readonly type = "VSREPO_RUNTIME";
    code?: string;

    constructor(message: string, code?: string) {
        super(message);
        this.code = code;
    }
}
