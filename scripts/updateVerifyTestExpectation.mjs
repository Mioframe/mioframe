import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const testPath = 'scripts/verify.test.mjs';
const before = "expect.stringContaining('pnpm verify --profile github-actions --only e2e')";
const after =
  "expect.stringContaining(\n        'pnpm verify --base origin/develop --profile github-actions --only e2e',\n      )";
const test = fs.readFileSync(testPath, 'utf8');
const count = test.split(before).length - 1;

if (count !== 1) {
  throw new Error(`Expected one stale CI-profile assertion, found ${count}.`);
}

fs.writeFileSync(testPath, test.replace(before, after), 'utf8');

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(fileURLToPath(import.meta.url));
