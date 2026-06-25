#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const srcDir = './src';
const distDir = './dist';

function copyDefs(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      copyDefs(fullPath);
    } else if (file.endsWith('.d.ts')) {
      const relativePath = path.relative(srcDir, fullPath);
      const destPath = path.join(distDir, relativePath);
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(fullPath, destPath);
    }
  }
}

copyDefs(srcDir);
console.log('Arquivos .d.ts copiados para a pasta dist.');