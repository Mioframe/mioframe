import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = process.cwd();
const selfPath = fileURLToPath(import.meta.url);
const testPath = path.join(rootDir, 'scripts/verify.test.mjs');
const content = fs.readFileSync(testPath, 'utf8');
const marker =
  "  it('shell-quotes spaces, substitutions, backticks, and single quotes in file paths', () => {";

if (!content.includes(marker)) {
  throw new Error('Expected verify rerun test insertion point');
}

if (content.includes("it('preserves full and file scope while replacing label and profile'")) {
  throw new Error('Verify rerun mode tests already exist');
}

const addition = `  it('preserves full and file scope while replacing label and profile', () => {
    expect(
      getVerifyRerunCommand(
        [
          '--fix-only',
          '--verbose',
          '--full',
          '--only=visual',
          '--profile=local',
          '--files',
          'tests/e2e/visual/path with space.spec.ts',
        ],
        { onlyLabel: 'artifact', profile: 'github-actions' },
      ),
    ).toBe(
      "pnpm verify --verbose --full --files 'tests/e2e/visual/path with space.spec.ts' --profile github-actions --only artifact",
    );
  });

  it('removes fix mode from the original read-only rerun without dropping scope', () => {
    expect(
      getVerifyRerunCommand([
        '--fix',
        '--base',
        'origin/develop',
        '--profile',
        'local',
        '--only',
        'unit-tests',
      ]),
    ).toBe('pnpm verify --base origin/develop --profile local --only unit-tests');
  });

`;

fs.writeFileSync(testPath, content.replace(marker, addition + marker), 'utf8');

const packagePath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(selfPath);
