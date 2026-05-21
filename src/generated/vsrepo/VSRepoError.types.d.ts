/**
 * ! THIS FILE IS AUTO-GENERATED.
 * ! DO NOT EDIT MANUALLY.
 */
/* eslint-disable */
/* biome-ignore-all lint: generated file */
// @ts-nocheck

/**
 * Tipos literais que representam os códigos de erro internos da biblioteca.
 */
export type VSRepoErrorType = 
    | 'VSREPO_CONFIG'
    | 'VSREPO_BUILD'
    | 'VSREPO_EXTEND'
    | 'VSREPO_RUNTIME';

/**
 * Classe base para todos os erros lançados pelo Virtual Schema Repository.
 */
export declare abstract class VSRepoError extends Error {
    /** Código interno usado para identificar a categoria do erro. */
    abstract readonly type: VSRepoErrorType;
    
    constructor(message: string, type: VSRepoErrorType);
}

/**
 * Lançado quando uma configuração inválida ou uma inconsistência de
 * configuração é detectada antes ou durante a inicialização do repositório.
 */
export declare class VSRepoConfigError extends VSRepoError {
    readonly type: 'VSREPO_CONFIG';
    constructor(message: string);
}

/**
 * Lançado quando a injeção da instância do Prisma falha ou quando o
 * repositório não pode ser finalizado por meio de `.build()`.
 */
export declare class VSRepoBuildError extends VSRepoError {
    readonly type: 'VSREPO_BUILD';
    constructor(message: string);
}

/**
 * Lançado quando ocorre um erro ao injetar novos métodos no repositório
 * por meio de `.extend()`.
 */
export declare class VSRepoExtendError extends VSRepoError {
    readonly type: 'VSREPO_EXTEND';
    constructor(message: string);
}

/**
 * Lançado quando operações dinâmicas falham em tempo de execução, como
 * quando argumentos inválidos são passados para métodos.
 */
export declare class VSRepoRuntimeError extends VSRepoError {
    readonly type: 'VSREPO_RUNTIME';
    constructor(message: string);
}
