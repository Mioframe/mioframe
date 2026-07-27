import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = process.cwd();
const selfPath = fileURLToPath(import.meta.url);
const lines = (items) => items.join('\n');

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8');
}

function write(relativePath, content) {
  fs.writeFileSync(path.join(rootDir, relativePath), content, 'utf8');
}

function replaceExact(relativePath, before, after) {
  const content = read(relativePath);
  const occurrences = content.split(before).length - 1;

  if (occurrences !== 1) {
    throw new Error(`${relativePath}: expected exactly one replacement, found ${occurrences}`);
  }

  write(relativePath, content.replace(before, after));
}

function appendExact(relativePath, marker, addition) {
  const content = read(relativePath);

  if (content.includes(marker)) {
    throw new Error(`${relativePath}: correction marker already exists`);
  }

  write(relativePath, `${content.trimEnd()}\n\n${addition.trim()}\n`);
}

replaceExact(
  'scripts/verify.mjs',
  "import { getChangedFileProjection, resolveChangedPathsScope } from './lib/changedPaths.mjs';",
  lines([
    'import {',
    '  getChangedFileProjection,',
    '  getVerifyBaseRef,',
    '  resolveChangedPathsScope,',
    "} from './lib/changedPaths.mjs';",
  ]),
);

replaceExact(
  'scripts/verify.mjs',
  lines([
    'const cliArgs = process.argv.slice(2);',
    "const isHelpMode = process.argv.includes('--help') || cliArgs.includes('help');",
    "const isFixMode = process.argv.includes('--fix');",
    "const isFixOnlyMode = process.argv.includes('--fix-only');",
    "const isVerboseMode = process.argv.includes('--verbose');",
    "const isFullMode = process.argv.includes('--full');",
  ]),
  lines([
    'const rawCliArgs = process.argv.slice(2);',
    "const isHelpMode = process.argv.includes('--help') || rawCliArgs.includes('help');",
    'const cliArgs = isHelpMode ? rawCliArgs : getEffectiveVerifyArgs(rawCliArgs);',
    "const isFixMode = cliArgs.includes('--fix');",
    "const isFixOnlyMode = cliArgs.includes('--fix-only');",
    "const isVerboseMode = cliArgs.includes('--verbose');",
    "const isFullMode = cliArgs.includes('--full');",
  ]),
);

const validateProfileBlock = lines([
  'function validateProfile(profile) {',
  "  if (profile === 'local' || profile === 'github-actions') {",
  '    return;',
  '  }',
  '',
  '  throw new Error(',
  "    [`Invalid value for --profile: ${profile}`, 'Accepted profiles: local, github-actions'].join(",
  "      '\\n',",
  '    ),',
  '  );',
  '}',
]);

const effectiveArgsBlock = lines([
  validateProfileBlock,
  '',
  'function removeCliOption(argv, flag) {',
  '  const args = [];',
  '',
  '  for (let index = 0; index < argv.length; index += 1) {',
  '    const argument = argv[index];',
  '',
  '    if (argument === flag) {',
  '      index += 1;',
  '      continue;',
  '    }',
  '',
  '    if (argument.startsWith(`${flag}=`)) {',
  '      continue;',
  '    }',
  '',
  '    args.push(argument);',
  '  }',
  '',
  '  return args;',
  '}',
  '',
  '/**',
  ' * Normalize the verify CLI to the effective repository scope used by the runner.',
  ' * Environment-derived base/profile values become explicit so summaries, lock metadata,',
  ' * and copied retry commands preserve the same behavior outside the original process.',
  ' * @param argv Raw verify CLI arguments.',
  ' * @param [processEnv] Environment used to resolve GitHub/base/profile defaults.',
  ' * @returns Effective verify arguments with explicit base and profile values.',
  ' */',
  'export function getEffectiveVerifyArgs(argv, processEnv = process.env) {',
  '  const explicitBaseRef = getCliBaseRef(argv);',
  '  const githubBaseRef = processEnv.GITHUB_BASE_REF',
  '    ? `origin/${processEnv.GITHUB_BASE_REF}`',
  '    : null;',
  '  const effectiveBaseRef = githubBaseRef ?? explicitBaseRef ?? getVerifyBaseRef(processEnv);',
  '  const explicitProfile = getCliProfile(argv);',
  '  const effectiveProfile = resolvePlaywrightContainerProfile(',
  '    getVerifyProcessEnv(processEnv, explicitProfile),',
  '  ).name;',
  '  const argsWithoutResolvedOptions = removeCliOption(',
  "    removeCliOption(argv, '--base'),",
  "    '--profile',",
  '  );',
  '',
  '  if (effectiveBaseRef !== null) {',
  "    argsWithoutResolvedOptions.push('--base', effectiveBaseRef);",
  '  }',
  '',
  "  argsWithoutResolvedOptions.push('--profile', effectiveProfile);",
  '  return argsWithoutResolvedOptions;',
  '}',
]);

replaceExact(
  'scripts/verify.mjs',
  `${validateProfileBlock}\n\n/**\n * Parse explicit file overrides from the verify CLI.`,
  `${effectiveArgsBlock}\n\n/**\n * Parse explicit file overrides from the verify CLI.`,
);

replaceExact(
  'scripts/verify.mjs',
  lines([
    'function quoteArg(value) {',
    '  return /^[A-Za-z0-9_./:-]+$/.test(value) ? value : JSON.stringify(value);',
    '}',
  ]),
  lines([
    'function quoteArg(value) {',
    '  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {',
    '    return value;',
    '  }',
    '',
    '  const singleQuote = String.fromCharCode(39);',
    "  const escapedSingleQuote = singleQuote + '\\\\' + singleQuote + singleQuote;",
    '  return singleQuote + value.replaceAll(singleQuote, escapedSingleQuote) + singleQuote;',
    '}',
  ]),
);

replaceExact(
  'scripts/verify.mjs',
  "      command: ['pnpm', 'verify', ...cliArgs].join(' ').trim(),",
  "      command: formatCommand('pnpm', ['verify', ...cliArgs]),",
);

replaceExact(
  'scripts/verify.test.mjs',
  lines(['  getActionRequired,', '  getBlockingLogIssue,']),
  lines(['  getActionRequired,', '  getBlockingLogIssue,', '  getEffectiveVerifyArgs,']),
);
replaceExact(
  'scripts/verify.test.mjs',
  lines(['  getVerifyProcessEnv,', '  getAllSiblingTestFiles,']),
  lines(['  getVerifyProcessEnv,', '  getVerifyRerunCommand,', '  getAllSiblingTestFiles,']),
);

const effectiveScopeTests = lines([
  "describe('effective verify retry scope', () => {",
  "  it('makes the GitHub Actions base and profile explicit in failure recommendations', () => {",
  "    const effectiveArgs = getEffectiveVerifyArgs(['--only', 'unit-tests'], {",
  "      GITHUB_ACTIONS: 'true',",
  "      GITHUB_BASE_REF: 'develop',",
  '    });',
  '    const actions = getActionRequired(',
  '      [',
  '        {',
  "          label: 'unit-tests',",
  "          command: 'pnpm exec vitest run src/foo.test.ts',",
  "          status: 'failed',",
  '          exitCode: 1,',
  '          hasWarnings: false,',
  "          warningSummary: '',",
  '          blockingLogIssue: null,',
  '        },',
  '      ],',
  '      { verifyArgs: effectiveArgs },',
  '    );',
  '',
  '    expect(actions).toContain(',
  "      'Fix failed unit-tests errors. Rerun through verify: pnpm verify --base origin/develop --profile github-actions --only unit-tests',",
  '    );',
  '    expect(actions).toContain(',
  "      'After fixes, rerun the original read-only scope: pnpm verify --only unit-tests --base origin/develop --profile github-actions',",
  '    );',
  "    expect(actions.join('\\n')).not.toContain('pnpm exec vitest');",
  '  });',
  '',
  "  it('uses VERIFY_BASE when no CLI or GitHub base is present', () => {",
  '    expect(',
  '      getEffectiveVerifyArgs([], {',
  "        GITHUB_ACTIONS: 'false',",
  "        VERIFY_BASE: 'origin/parent-feature',",
  '      }),',
  "    ).toEqual(['--base', 'origin/parent-feature', '--profile', 'local']);",
  '  });',
  '',
  "  it('uses the actual GitHub base even when a different CLI base was supplied', () => {",
  '    expect(',
  "      getEffectiveVerifyArgs(['--base', 'origin/wrong'], {",
  "        GITHUB_ACTIONS: 'true',",
  "        GITHUB_BASE_REF: 'develop',",
  '      }),',
  "    ).toEqual(['--base', 'origin/develop', '--profile', 'github-actions']);",
  '  });',
  '',
  "  it('shell-quotes spaces, substitutions, backticks, and single quotes in file paths', () => {",
  '    const backtick = String.fromCharCode(96);',
  '    const unsafePath =',
  '      "src/path with $(touch unsafe) " + backtick + "echo unsafe" + backtick + " and \'quote.ts";',
  "    const command = getVerifyRerunCommand(['--files', unsafePath]);",
  '',
  '    expect(command.startsWith("pnpm verify --files \'")).toBe(true);',
  '    expect(command.endsWith("\'")).toBe(true);',
  "    expect(command).toContain('$(touch unsafe)');",
  '    expect(command).toContain(backtick);',
  "    expect(command).toContain(\"'\\\\''\");",
  '  });',
  '});',
]);
appendExact(
  'scripts/verify.test.mjs',
  "describe('effective verify retry scope'",
  effectiveScopeTests,
);

replaceExact(
  'scripts/verifyResume.test.mjs',
  "import { getRetryInstruction, resumeVerification } from './verifyResume.mjs';",
  lines([
    "import { getEffectiveVerifyArgs, getVerifyRerunCommand } from './verify.mjs';",
    "import { getRetryInstruction, resumeVerification } from './verifyResume.mjs';",
  ]),
);

const retryIntegrationTest = lines([
  "describe('effective retry metadata integration', () => {",
  "  it('round-trips the effective CI scope through retry metadata', () => {",
  "    const effectiveArgs = getEffectiveVerifyArgs(['--only', 'e2e'], {",
  "      GITHUB_ACTIONS: 'true',",
  "      GITHUB_BASE_REF: 'develop',",
  '    });',
  '    const command = getVerifyRerunCommand(effectiveArgs);',
  '',
  '    expect(getRetryInstruction({ command })).toBe(',
  "      '  Run `pnpm verify --only e2e --base origin/develop --profile github-actions` again.',",
  '    );',
  '  });',
  '});',
]);
appendExact(
  'scripts/verifyResume.test.mjs',
  "it('round-trips the effective CI scope through retry metadata'",
  retryIntegrationTest,
);

const nestedRuleReplacement =
  'Final completion uses the single task-scope gate defined by the root `AGENTS.md`; this nested minimum does not add another command boundary.';
let nestedRuleEdits = 0;

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
    const nextContent = content.replace(
      /Final completion (?:still )?requires `pnpm verify`\./g,
      nestedRuleReplacement,
    );

    if (nextContent !== content) {
      fs.writeFileSync(absolutePath, nextContent, 'utf8');
      nestedRuleEdits += 1;
    }
  }
}

walk(path.join(rootDir, 'src'));

if (nestedRuleEdits === 0) {
  throw new Error('Expected at least one nested AGENTS.md final-gate correction');
}

const obsoleteSpecPath = path.join(rootDir, 'scripts/verify.spec.mjs');
if (!fs.existsSync(obsoleteSpecPath)) {
  throw new Error('scripts/verify.spec.mjs is missing');
}
fs.rmSync(obsoleteSpecPath);

const packagePath = path.join(rootDir, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

fs.rmSync(selfPath);
