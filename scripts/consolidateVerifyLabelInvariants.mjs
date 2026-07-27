import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

function replaceOnce(filePath, before, after) {
  const content = fs.readFileSync(filePath, 'utf8');
  const count = content.split(before).length - 1;

  if (count !== 1) {
    throw new Error(`Expected one match in ${filePath}, found ${count}: ${before.slice(0, 100)}`);
  }

  fs.writeFileSync(filePath, content.replace(before, after), 'utf8');
}

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  "];\n\nconst VERIFY_PROFILES = new Set(['local', 'github-actions']);",
  "];\n\nexport const FULL_ONLY_LABELS = new Set([\n  'release-version',\n  'release-config',\n  'build',\n  'artifact',\n  'release-smoke',\n]);\n\nconst VERIFY_PROFILES = new Set(['local', 'github-actions']);",
);

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  "  const hasFix = argv.includes('--fix');\n  const hasFixOnly = argv.includes('--fix-only');\n\n  if (hasFix && hasFixOnly) {",
  "  const hasFix = argv.includes('--fix');\n  const hasFixOnly = argv.includes('--fix-only');\n  const full = argv.includes('--full');\n\n  if (hasFix && hasFixOnly) {",
);

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  "  if (hasFix && hasFixOnly) {\n    throw new Error('Use either --fix or --fix-only, not both.');\n  }\n\n  const profileEnv =",
  "  if (hasFix && hasFixOnly) {\n    throw new Error('Use either --fix or --fix-only, not both.');\n  }\n\n  if (onlyLabel !== null && FULL_ONLY_LABELS.has(onlyLabel) && !full) {\n    throw new Error(\n      `--only ${onlyLabel} requires --full. Run: pnpm verify --full --only ${onlyLabel}`,\n    );\n  }\n\n  const profileEnv =",
);

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  "    onlyLabel,\n    full: argv.includes('--full'),",
  "    onlyLabel,\n    full,",
);

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  "    (value.onlyLabel === null || VERIFY_LABELS.includes(value.onlyLabel)) &&\n    typeof value.full === 'boolean' &&",
  "    (value.onlyLabel === null || VERIFY_LABELS.includes(value.onlyLabel)) &&\n    typeof value.full === 'boolean' &&\n    (value.onlyLabel === null || !FULL_ONLY_LABELS.has(value.onlyLabel) || value.full) &&",
);

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  "  if (onlyLabel !== null && !VERIFY_LABELS.includes(onlyLabel)) {\n    throw new Error(`Invalid value for --only: ${onlyLabel}`);\n  }\n\n  if (!VERIFY_PROFILES.has(profile)) {",
  "  if (onlyLabel !== null && !VERIFY_LABELS.includes(onlyLabel)) {\n    throw new Error(`Invalid value for --only: ${onlyLabel}`);\n  }\n\n  if (onlyLabel !== null && FULL_ONLY_LABELS.has(onlyLabel) && !invocation.full) {\n    throw new Error(`--only ${onlyLabel} requires --full.`);\n  }\n\n  if (!VERIFY_PROFILES.has(profile)) {",
);

replaceOnce(
  'scripts/verify.mjs',
  "  formatVerifyInvocationCommand,\n  getCliFilesOverride,\n  resolveVerifyInvocation,\n  VERIFY_LABELS,",
  "  formatVerifyInvocationCommand,\n  FULL_ONLY_LABELS,\n  getCliFilesOverride,\n  resolveVerifyInvocation,\n  VERIFY_LABELS,",
);

replaceOnce(
  'scripts/verify.mjs',
  "// Release-only labels only run in full/release mode (pnpm verify --full).\n// Focused `pnpm verify` never builds these into its command list.\nconst FULL_ONLY_LABELS = new Set([\n  'release-version',\n  'release-config',\n  'build',\n  'artifact',\n  'release-smoke',\n]);\n",
  '',
);

replaceOnce(
  'scripts/verify.mjs',
  "\nif (cliOnlyLabel !== null && FULL_ONLY_LABELS.has(cliOnlyLabel) && !isFullMode) {\n  throw new Error(\n    `--only ${cliOnlyLabel} requires --full. Run: pnpm verify --full --only ${cliOnlyLabel}`,\n  );\n}\n",
  '\n',
);

replaceOnce(
  'scripts/lib/verifyInvocation.test.mjs',
  "  it('rejects mutually exclusive fix modes', () => {",
  "  it('rejects a release-only label without full mode', () => {\n    expect(() => resolveVerifyInvocation(['--only', 'artifact'], {})).toThrow(\n      '--only artifact requires --full',\n    );\n  });\n\n  it('accepts a release-only label in full mode', () => {\n    expect(resolveVerifyInvocation(['--full', '--only', 'artifact'], {}).onlyLabel).toBe(\n      'artifact',\n    );\n  });\n\n  it('rejects mutually exclusive fix modes', () => {",
);

replaceOnce(
  'scripts/lib/verifyInvocation.test.mjs',
  "  it('rejects corrupted persisted metadata', () => {\n    expect(isResolvedVerifyInvocation({ version: 1, scope: { kind: 'local' } })).toBe(false);\n  });",
  "  it('rejects corrupted persisted metadata', () => {\n    expect(isResolvedVerifyInvocation({ version: 1, scope: { kind: 'local' } })).toBe(false);\n  });\n\n  it('rejects a persisted release-only label without full mode', () => {\n    expect(\n      isResolvedVerifyInvocation({\n        version: 1,\n        scope: { kind: 'local' },\n        profile: 'local',\n        onlyLabel: 'artifact',\n        full: false,\n        verbose: false,\n        fixMode: 'none',\n      }),\n    ).toBe(false);\n  });",
);

const packagePath = 'package.json';
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(fileURLToPath(import.meta.url));
