#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = process.cwd();
const args = process.argv.slice(2);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_OUTPUT = 'generated/vsrepo';
const DEFAULT_PRISMA = 'generated/prisma';
const GENERATED_HEADER = `/**
 * ! THIS FILE IS AUTO-GENERATED.
 * ! DO NOT EDIT MANUALLY.
 */
/* eslint-disable */
/* biome-ignore-all lint: generated file */
// @ts-nocheck

`;

const command = args[0]?.startsWith('-') ? 'generate' : args[0] ?? 'generate';
const commandArgs = command === 'generate' && args[0] !== command ? args : args.slice(1);

if (command !== 'generate') {
  console.error(`Comando desconhecido: ${command}`);
  console.error('Uso: vsrepo generate --output <dir-output> --prisma <path-prisma>');
  process.exit(1);
}

const outputFlagIndex = commandArgs.findIndex((arg) => arg === '--output' || arg === '-o');
const prismaFlagIndex = commandArgs.findIndex((arg) => arg === '--prisma' || arg === '-p');

const outputArg =
  outputFlagIndex >= 0
    ? commandArgs[outputFlagIndex + 1]
    : DEFAULT_OUTPUT;

const prismaArg =
  prismaFlagIndex >= 0
    ? commandArgs[prismaFlagIndex + 1]
    : DEFAULT_PRISMA;

if (outputArg.startsWith('-')) {
  console.error('Valor inválido para --output');
  process.exit(1);
}

if (prismaArg.startsWith('-')) {
  console.error('Valor inválido para --prisma');
  process.exit(1);
}

const outputDir = path.resolve(workspaceRoot, outputArg);

const prismaTargetPath = stripKnownExtension(
  path.resolve(workspaceRoot, prismaArg, prismaArg.endsWith('client') ? '' : 'client')
);

const installedNodeModulesPath = path.join(workspaceRoot, 'node_modules/vsrepo');

const installedPackageExists = fs.existsSync(installedNodeModulesPath);

const packageRoot = installedPackageExists
  ? installedNodeModulesPath
  : path.resolve(scriptDirectory, '..');

const sourceDir = path.join(packageRoot, 'VSRepository');

if (!fs.existsSync(sourceDir)) {
  console.error(`Nao foi possivel localizar a pasta VSRepository em: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(outputDir, { recursive: true });

const typeFiles = [
  'VSRepoError.d.ts',
  'VSRepository.d.ts',
];

for (const fileName of typeFiles) {
  const sourceFile = path.join(sourceDir, fileName);

  if (!fs.existsSync(sourceFile)) {
    console.warn(`Arquivo ignorado (nao encontrado): ${fileName}`);
    continue;
  }

  const targetFile = path.join(
    outputDir,
    fileName.replace('.d.ts', '.types.d.ts')
  );

  let contents = fs.readFileSync(sourceFile, 'utf8');

  contents = contents.replace(
    /from\s+(['"])@vsrepo\/prisma\/types\1/g,
    `from '${relativeImportPath(path.dirname(targetFile), prismaTargetPath)}'`
  );

  fs.writeFileSync(targetFile, GENERATED_HEADER + contents, 'utf8');

  console.log(`Gerado: ${path.relative(workspaceRoot, targetFile)}`);
}

const tsFiles = [
  {
    fileName: 'VSRepoError.ts',
    content: `import {
  VSRepoError as VSRepoErrorRuntime,
  VSRepoConfigError as VSRepoConfigErrorRuntime,
  VSRepoBuildError as VSRepoBuildErrorRuntime,
  VSRepoExtendError as VSRepoExtendErrorRuntime,
  VSRepoRuntimeError as VSRepoRuntimeErrorRuntime
} from 'vsrepo/VSRepoError';

import type {
  VSRepoError as VSRepoErrorType,
  VSRepoConfigError as VSRepoConfigErrorType,
  VSRepoBuildError as VSRepoBuildErrorType,
  VSRepoExtendError as VSRepoExtendErrorType,
  VSRepoRuntimeError as VSRepoRuntimeErrorType
} from './VSRepoError.types';

export const VSRepoError: typeof VSRepoErrorType = VSRepoErrorRuntime;
export const VSRepoConfigError: typeof VSRepoConfigErrorType = VSRepoConfigErrorRuntime;
export const VSRepoBuildError: typeof VSRepoBuildErrorType = VSRepoBuildErrorRuntime;
export const VSRepoExtendError: typeof VSRepoExtendErrorType = VSRepoExtendErrorRuntime;
export const VSRepoRuntimeError: typeof VSRepoRuntimeErrorType = VSRepoRuntimeErrorRuntime;

export type * from './VSRepoError.types';
`,
  },
  {
    fileName: 'VSRepository.ts',
    content: `import {
  VSRepository as VSRepositoryRuntime,
  setupVSRepo as setupVSRepoRuntime
} from 'vsrepo/VSRepository';

import type {
  VSRepository as VSRepositoryType,
  setupVSRepo as setupVSRepoType
} from './VSRepository.types';

export const VSRepository = VSRepositoryRuntime as typeof VSRepositoryType;
export const setupVSRepo = setupVSRepoRuntime as typeof setupVSRepoType;

export type * from './VSRepository.types';
`,
  },
  {
    fileName: 'index.ts',
    content: `export {
  VSRepoError,
  VSRepoConfigError,
  VSRepoBuildError,
  VSRepoExtendError,
  VSRepoRuntimeError
} from './VSRepoError.js';

export {
  VSRepository,
  setupVSRepo
} from './VSRepository.js';

export type * from './VSRepoError.types';
export type * from './VSRepository.types';
`,
  },
];

for (const file of tsFiles) {
  const targetFile = path.join(outputDir, file.fileName);

  fs.writeFileSync(targetFile, GENERATED_HEADER + file.content, 'utf8');

  console.log(`Gerado: ${path.relative(workspaceRoot, targetFile)}`);
}

// Copia o README.md do pacote VSRepository para o diretório de output, se existir
const readmeSource = path.join(packageRoot, 'README.md');
const readmeTarget = path.join(outputDir, 'README.md');

if (fs.existsSync(readmeSource)) {
  fs.copyFileSync(readmeSource, readmeTarget);
  console.log(`Gerado: ${path.relative(workspaceRoot, readmeTarget)}`);
} else {
  console.warn(`README.md do VSRepository nao encontrado em: ${path.relative(workspaceRoot, readmeSource)}. Ignorando a copia.`);
}

console.log('\nVSRepository gerado com tipagem do Prisma.');
console.log(`Output: ${outputDir}`);
console.log(`Prisma usado em: ${prismaTargetPath}`);

function stripKnownExtension(inputPath) {
  return inputPath.replace(/\.(?:d\.ts|ts|js|mjs|cjs)$/i, '');
}

function relativeImportPath(fromDirectory, toPath) {
  const relativePath = path.relative(fromDirectory, toPath);

  const normalized = relativePath.startsWith('.')
    ? relativePath
    : `./${relativePath}`;

  return toPosix(normalized);
}

function toPosix(inputPath) {
  return inputPath.split(path.sep).join('/');
}
