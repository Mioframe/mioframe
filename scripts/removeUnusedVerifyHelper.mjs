import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const verifyPath = 'scripts/verify.mjs';
const before = `function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

`;
const verify = fs.readFileSync(verifyPath, 'utf8');
const count = verify.split(before).length - 1;

if (count !== 1) {
  throw new Error(`Expected one unused toPosixPath helper, found ${count}.`);
}

fs.writeFileSync(verifyPath, verify.replace(before, ''), 'utf8');

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(fileURLToPath(import.meta.url));
