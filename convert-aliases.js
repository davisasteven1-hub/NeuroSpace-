#!/usr/bin/env node
/*
Script: convert-aliases.js
Converts import/require paths that use the "@/" alias to relative imports.
Behavior:
  - Scans files under ./src (ts/tsx/js/jsx/mjs/cjs)
  - Finds import/export/require usages like: import X from '@/path/to/module'
  - Computes a relative path from the file to the target under ./src
  - By default runs in dry-run mode and prints proposed changes
  - Run with --apply to make changes in-place (creates .alias-backup for each changed file)

Usage:
  node convert-aliases.js        # show what would change
  node convert-aliases.js --apply   # apply the changes

IMPORTANT: Review git changes before committing. This script modifies source files.
*/

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const APPLY = process.argv.includes('--apply');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
      files.push(...walk(full));
    } else if (e.isFile()) {
      if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(e.name)) files.push(full);
    }
  }
  return files;
}

function convertImportMatch(filePath, importPath) {
  // importPath starts after @/, e.g. 'components/Button' or 'utils/index'
  const target = path.join(SRC, importPath);
  // if target exists as-is or with extension, prefer as-is; but compute relative anyway
  let rel = path.relative(path.dirname(filePath), target);
  // normalize to posix-style for import statements
  rel = rel.split(path.sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let text = original;
  // Regex: import ... from '@/something' or export ... from '@/something' or require('@/something')
  const regex = /(from\s+|require\(\s*)['"]@\/(.+?)['"]\s*\)?/g;
  const changes = [];
  let m;
  while ((m = regex.exec(original)) !== null) {
    const fullMatch = m[0];
    const prefix = m[1];
    const importPath = m[2];
    const rel = convertImportMatch(filePath, importPath);
    const replacement = prefix.includes('require') ? `${prefix}'${rel}')` : `${prefix}'${rel}'`;
    changes.push({ from: fullMatch, to: replacement });
  }

  if (changes.length === 0) return null;

  for (const c of changes) {
    // replace all occurrences of that exact match (avoid global accidental collisions)
    text = text.replace(c.from, c.to);
  }

  return { filePath, original, text, changes };
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error('Error: src directory not found at', SRC);
    process.exit(1);
  }
  const files = walk(SRC);
  const results = [];
  for (const f of files) {
    const r = processFile(f);
    if (r) results.push(r);
  }

  if (results.length === 0) {
    console.log('No @/ alias imports found under src/ — nothing to do.');
    return;
  }

  console.log(`Found ${results.length} file(s) with @/ imports.`);
  for (const res of results) {
    console.log('\n---', path.relative(ROOT, res.filePath));
    for (const c of res.changes) console.log(`- ${c.from.trim()}  ->  ${c.to.trim()}`);
  }

  if (!APPLY) {
    console.log('\nDry run complete. Run with --apply to write changes to files.');
    return;
  }

  // Apply changes with backups
  for (const res of results) {
    const bak = res.filePath + '.alias-backup';
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, res.original, 'utf8');
    fs.writeFileSync(res.filePath, res.text, 'utf8');
    console.log('Updated', path.relative(ROOT, res.filePath), '(backup saved as .alias-backup)');
  }

  console.log('\nAll done. Review changes and run your build/test.');
}

main();
