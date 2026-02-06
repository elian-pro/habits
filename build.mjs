#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire('/opt/node22/lib/node_modules/typescript/');
const ts = require('typescript');

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'dist');

// Collect all .ts/.tsx source files (excluding vite.config.ts and node_modules)
function collectFiles(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git', 'android'].includes(entry.name)) {
      collectFiles(full, files);
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && entry.name !== 'vite.config.ts') {
      files.push(full);
    }
  }
  return files;
}

// Fix relative imports to add .js extension
function fixImports(code) {
  // Match: from './something' or from '../something' (without .js already)
  return code.replace(
    /(from\s+['"])(\.\.?\/[^'"]+?)(['"])/g,
    (match, prefix, specifier, suffix) => {
      if (specifier.endsWith('.js') || specifier.endsWith('.mjs')) return match;
      return `${prefix}${specifier}.js${suffix}`;
    }
  );
}

// Clean and create output directory
if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const files = collectFiles(ROOT);

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  jsx: ts.JsxEmit.ReactJSX,
  esModuleInterop: true,
  skipLibCheck: true,
  isolatedModules: true,
};

let hasErrors = false;

for (const file of files) {
  const relPath = path.relative(ROOT, file);
  const source = fs.readFileSync(file, 'utf-8');

  const result = ts.transpileModule(source, {
    compilerOptions,
    fileName: file,
  });

  if (result.diagnostics && result.diagnostics.length > 0) {
    console.error(`Errors in ${relPath}:`);
    result.diagnostics.forEach(d => console.error('  ', ts.flattenDiagnosticMessageText(d.messageText, '\n')));
    hasErrors = true;
  }

  // Fix relative imports and write output
  let outputCode = fixImports(result.outputText);

  // Output path: same relative structure but with .js extension
  const outRelPath = relPath.replace(/\.tsx?$/, '.js');
  const outFile = path.join(OUT, outRelPath);

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, outputCode);
  console.log(`  ${relPath} -> dist/${outRelPath}`);
}

// Copy index.html to dist with updated script src
let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
html = html.replace('/index.tsx', '/index.js');
fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log('  index.html -> dist/index.html');

// Copy dist to Android assets
const ANDROID_ASSETS = path.join(ROOT, 'android', 'app', 'src', 'main', 'assets', 'webapp');
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (fs.existsSync(path.join(ROOT, 'android', 'app'))) {
  if (fs.existsSync(ANDROID_ASSETS)) fs.rmSync(ANDROID_ASSETS, { recursive: true });
  copyDir(OUT, ANDROID_ASSETS);
  console.log('\n  Copied dist -> android/app/src/main/assets/webapp/');
}

if (hasErrors) {
  console.error('\nBuild completed with errors.');
  process.exit(1);
} else {
  console.log('\nBuild successful!');
  console.log('  Web:     npx http-server dist -p 3000');
  console.log('  Android: Open android/ in Android Studio and run');
}
