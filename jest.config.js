/** @type {import('jest').Config} */
module.exports = {
    rootDir: ".",
    testEnvironment: "node",
    testMatch: ["<rootDir>/test/implementation/**/*.test.ts"],
    // Os suites de implementação são testes de integração que rodam contra um banco
    // Postgres real e compartilham as mesmas tabelas (user/product) com os mesmos
    // registros de teste. Rodá-los em paralelo (comportamento padrão do Jest) causa
    // condições de corrida entre os arquivos (ex.: unique constraint em "email"), já
    // que um suite pode limpar/inserir dados enquanto o outro está no meio de uma
    // operação. Por isso forçamos execução sequencial (um worker só).
    maxWorkers: 1,
    // The codebase is written for Node's "nodenext" resolution, which requires explicit
    // ".js" extensions in relative specifiers even though the actual files are ".ts".
    // This strips the ".js" so Jest's normal module resolution can find the ".ts" source.
    moduleNameMapper: {
        "^@vsrepo/prisma/types$": "<rootDir>/generated/prisma/client",
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/test/tsconfig.json",
            },
        ],
    },
};
