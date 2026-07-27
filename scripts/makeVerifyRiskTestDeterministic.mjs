import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

function replaceOnce(filePath, before, after) {
  const content = fs.readFileSync(filePath, 'utf8');
  const count = content.split(before).length - 1;

  if (count !== 1) {
    throw new Error(`Expected one match in ${filePath}, found ${count}.`);
  }

  fs.writeFileSync(filePath, content.replace(before, after), 'utf8');
}

replaceOnce(
  'scripts/verify.test.mjs',
  "} from './lib/packageJsonImpact.mjs';\nimport {",
  "} from './lib/packageJsonImpact.mjs';\nimport { resolveVerifyInvocation } from './lib/verifyInvocation.mjs';\nimport {",
);

replaceOnce(
  'scripts/verify.test.mjs',
  "      {\n        ciProfileRisk: {\n          affectedChecks: ['e2e'],\n          activeProfile: { name: 'local' },\n        },\n      },",
  "      {\n        ciProfileRisk: {\n          affectedChecks: ['e2e'],\n          activeProfile: { name: 'local' },\n        },\n        invocation: resolveVerifyInvocation(['--base', 'origin/develop'], {\n          GITHUB_ACTIONS: 'false',\n        }),\n      },",
);

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(fileURLToPath(import.meta.url));
