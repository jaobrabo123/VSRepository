/**
 * ! THIS FILE IS AUTO-GENERATED.
 * ! DO NOT EDIT MANUALLY.
 */
/* eslint-disable */
/* biome-ignore-all lint: generated file */
// @ts-nocheck

/**
 * Literal types representing the internal error codes of the library.
 */
export type VSRepoErrorType = 
    | 'VSREPO_CONFIG'
    | 'VSREPO_BUILD'
    | 'VSREPO_EXTEND'
    | 'VSREPO_RUNTIME';

/**
 * Base class for all errors thrown by the VSRepository.
 */
export declare abstract class VSRepoError extends Error {
    /** Internal code used to identify the error category. */
    abstract readonly type: VSRepoErrorType;
    
    constructor(message: string, type: VSRepoErrorType);
}

/**
 * Thrown when an invalid configuration or a configuration inconsistency
 * is detected before or during repository initialization.
 */
export declare class VSRepoConfigError extends VSRepoError {
    readonly type: 'VSREPO_CONFIG';
    constructor(message: string);
}

/**
 * Thrown when the Prisma instance injection fails or when the
 * build configuration is incorrect in the `.build()`.
 */
export declare class VSRepoBuildError extends VSRepoError {
    readonly type: 'VSREPO_BUILD';
    constructor(message: string);
}

/**
 * Thrown when an error occurs while injecting new methods into the repository
 * via `.extend()`.
 */
export declare class VSRepoExtendError extends VSRepoError {
    readonly type: 'VSREPO_EXTEND';
    constructor(message: string);
}

/**
 * Thrown when dynamic operations fail at runtime, such as
 * when invalid arguments are passed to methods.
 */
export declare class VSRepoRuntimeError extends VSRepoError {
    readonly type: 'VSREPO_RUNTIME';
    constructor(message: string, code: string);
}
