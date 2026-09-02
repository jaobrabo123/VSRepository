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
    | 'VSREPO_RUNTIME'
    | 'VSREPO_DECORATOR';

/**
 * Catalog of the internal codes used by `VSRepoRuntimeError`. Each code identifies
 * a category of runtime failure, so consuming code can discriminate on
 * `error.code` without parsing the (human-readable) message. See the
 * "Error handling" section of the README for the full description of each code.
 */
export type VSRepoRuntimeErrorCode =
    /** A required argument is missing or has an invalid shape (e.g. missing `pk`, `pks`/`objs`/`tuples` that aren't an array, or `options`/`obj` that isn't a valid object). */
    | '65706'
    /** No record was found for the provided primary key (`getOrThrow` when fetching the base record). */
    | '20727'
    /** Validation (zod) of a method's `options`, or of a `@QueryMethod` argument, failed. */
    | '67542'
    /** A relation passed to `save`/`patch`/`merge` has an invalid shape for the configured `mode`/`restriction`. */
    | '91868'
    /** A dynamic method (`config.methods`) was called with fewer positional arguments than its `where` fields require. */
    | '48670';

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
 * Thrown when invalid arguments are passed to a decorator.
 */
export declare class VSRepoDecoratorError extends VSRepoError {
    readonly type: 'VSREPO_DECORATOR';
    constructor(message: string);
}

/**
 * Thrown when dynamic operations fail at runtime, such as
 * when invalid arguments are passed to methods.
 */
export declare class VSRepoRuntimeError extends VSRepoError {
    readonly type: 'VSREPO_RUNTIME';
    /** Internal code identifying the category of runtime failure. See {@link VSRepoRuntimeErrorCode}. */
    readonly code: VSRepoRuntimeErrorCode;
    constructor(message: string, code: VSRepoRuntimeErrorCode);
}
