/** @type {import('jest').Config} */
module.exports = {
    rootDir: ".",
    testEnvironment: "node",
    testMatch: ["<rootDir>/test/implementation/**/*.test.ts"],
    // maxWorkers: 1,
    // The codebase is written for Node's "nodenext" resolution, which requires explicit
    // ".js" extensions in relative specifiers even though the actual files are ".ts".
    // This strips the ".js" so Jest's normal module resolution can find the ".ts" source.
    moduleNameMapper: {
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
