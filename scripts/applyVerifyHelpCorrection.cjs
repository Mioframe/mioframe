const fs = require('node:fs');

function replaceExact(path, oldText, newText) {
  const source = fs.readFileSync(path, 'utf8');
  const first = source.indexOf(oldText);
  const last = source.lastIndexOf(oldText);

  if (first === -1 || first !== last) {
    throw new Error(`Expected exactly one match in ${path}: ${JSON.stringify(oldText)}`);
  }

  fs.writeFileSync(
    path,
    source.slice(0, first) + newText + source.slice(first + oldText.length),
    'utf8',
  );
}

replaceExact(
  'scripts/verify.mjs',
  "  console.log('  - Full mode ignores GITHUB_BASE_REF, VERIFY_BASE, --base, and --files.');",
  "  console.log('  - Full mode ignores GITHUB_BASE_REF and VERIFY_BASE; explicit --base/--files are rejected.');",
);
replaceExact(
  'scripts/verify.test.mjs',
  "import fs from 'node:fs';\n",
  "import fs from 'node:fs';\nimport { spawnSync } from 'node:child_process';\n",
);
replaceExact(
  'scripts/verify.test.mjs',
  "describe('runVerifyCli', () => {",
  `describe('verify help output', () => {
  it('distinguishes ignored environment bases from rejected explicit full-mode scope', () => {
    const result = spawnSync(process.execPath, ['scripts/verify.mjs', '--help'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        GITHUB_BASE_REF: 'develop',
        VERIFY_BASE: 'origin/other',
      },
    });

    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain(
      'Full mode ignores GITHUB_BASE_REF and VERIFY_BASE; explicit --base/--files are rejected.',
    );
  });
});

describe('runVerifyCli', () => {`,
);

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(__filename, { force: true });
