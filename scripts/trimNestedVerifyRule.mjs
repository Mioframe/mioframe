import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = process.cwd();
const selfPath = fileURLToPath(import.meta.url);
const duplicatedRule =
  ' Final completion uses the single task-scope gate defined by the root `AGENTS.md`; this nested minimum does not add another command boundary.';
let edits = 0;

function walk(directoryPath) {
  for (const entry of fs.readdirSync(directoryPath, { withFileTypes: true })) {
    const absolutePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      walk(absolutePath);
      continue;
    }

    if (entry.name !== 'AGENTS.md') {
      continue;
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    const nextContent = content.replaceAll(duplicatedRule, '');

    if (nextContent !== content) {
      fs.writeFileSync(absolutePath, nextContent, 'utf8');
      edits += 1;
    }
  }
}

walk(path.join(rootDir, 'src'));

if (edits === 0) {
  throw new Error('Expected duplicated nested verify rules to remove');
}

const packagePath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(selfPath);
