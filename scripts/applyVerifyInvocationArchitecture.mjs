import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.cwd();
const selfPath = fileURLToPath(import.meta.url);

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function write(relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}
function replaceOnce(relativePath, before, after) {
  const content = read(relativePath);
  const first = content.indexOf(before);
  if (first < 0)
    throw new Error(`Expected text not found in ${relativePath}: ${before.slice(0, 120)}`);
  if (content.indexOf(before, first + before.length) >= 0)
    throw new Error(`Expected text is not unique in ${relativePath}: ${before.slice(0, 120)}`);
  write(relativePath, content.slice(0, first) + after + content.slice(first + before.length));
}
function replaceAllExact(relativePath, before, after, expectedCount) {
  const content = read(relativePath);
  const actualCount = content.split(before).length - 1;
  if (actualCount !== expectedCount)
    throw new Error(
      `Expected ${expectedCount} matches in ${relativePath}, found ${actualCount}: ${before.slice(0, 120)}`,
    );
  write(relativePath, content.split(before).join(after));
}
function replaceBetween(relativePath, startMarker, endMarker, replacement) {
  const content = read(relativePath);
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Expected marker range not found in ${relativePath}`);
  if (content.indexOf(startMarker, start + startMarker.length) >= 0)
    throw new Error(`Start marker is not unique in ${relativePath}`);
  write(relativePath, content.slice(0, start) + replacement + content.slice(end));
}
function replaceFromMarker(relativePath, startMarker, replacement) {
  const content = read(relativePath);
  const start = content.indexOf(startMarker);
  if (start < 0) throw new Error(`Expected tail marker not found in ${relativePath}`);
  if (content.indexOf(startMarker, start + startMarker.length) >= 0)
    throw new Error(`Tail marker is not unique in ${relativePath}`);
  write(relativePath, content.slice(0, start) + replacement);
}

write(
  'scripts/lib/verifyInvocation.mjs',
  "import path from 'node:path';\n\nimport {\n  resolvePlaywrightContainerProfile,\n  VERIFY_PROFILE_ENV,\n} from '../playwrightContainer.mjs';\n\nexport const VERIFY_LABELS = [\n  'agent-environment',\n  'format',\n  'oxlint',\n  'eslint',\n  'type-check',\n  'unit-tests',\n  'e2e-install',\n  'e2e',\n  'storybook-behavior',\n  'visual',\n  'mutation',\n  'release-version',\n  'release-config',\n  'build',\n  'artifact',\n  'release-smoke',\n];\n\nconst VERIFY_PROFILES = new Set(['local', 'github-actions']);\nconst FIX_MODES = new Set(['none', 'fix', 'fix-only']);\n\nfunction toPosixPath(filePath) {\n  return filePath.split(path.sep).join(path.posix.sep);\n}\n\nfunction uniqSorted(values) {\n  return [...new Set(values)].sort((left, right) => left.localeCompare(right));\n}\n\nfunction getCliOption(argv, flag, missingMessage) {\n  for (let index = 0; index < argv.length; index += 1) {\n    const argument = argv[index];\n\n    if (argument === flag) {\n      const value = argv[index + 1];\n\n      if (!value || value.startsWith('--')) {\n        throw new Error(missingMessage);\n      }\n\n      return value;\n    }\n\n    if (argument.startsWith(`${flag}=`)) {\n      const value = argument.slice(flag.length + 1);\n\n      if (value.length === 0) {\n        throw new Error(missingMessage);\n      }\n\n      return value;\n    }\n  }\n\n  return null;\n}\n\nfunction getCliBaseRef(argv) {\n  return getCliOption(\n    argv,\n    '--base',\n    'Missing value for --base. Example: pnpm verify --base origin/develop',\n  );\n}\n\nfunction getCliOnlyLabel(argv) {\n  const value = getCliOption(\n    argv,\n    '--only',\n    `Missing value for --only. Accepted labels: ${VERIFY_LABELS.join(', ')}`,\n  );\n\n  if (value !== null && !VERIFY_LABELS.includes(value)) {\n    throw new Error(\n      [`Invalid value for --only: ${value}`, `Accepted labels: ${VERIFY_LABELS.join(', ')}`].join(\n        '\\n',\n      ),\n    );\n  }\n\n  return value;\n}\n\nfunction getCliProfile(argv) {\n  const value = getCliOption(\n    argv,\n    '--profile',\n    'Missing value for --profile. Accepted profiles: local, github-actions',\n  );\n\n  if (value !== null && !VERIFY_PROFILES.has(value)) {\n    throw new Error(\n      [`Invalid value for --profile: ${value}`, 'Accepted profiles: local, github-actions'].join(\n        '\\n',\n      ),\n    );\n  }\n\n  return value;\n}\n\n/**\n * Parse explicit file overrides from the verify CLI.\n * @param argv Raw CLI arguments after the script name.\n * @returns Explicit file list, or null when --files was not provided.\n */\nexport function getCliFilesOverride(argv) {\n  const explicitFiles = [];\n  let hasExplicitFilesFlag = false;\n\n  for (let index = 0; index < argv.length; index += 1) {\n    const argument = argv[index];\n\n    if (argument === '--files') {\n      hasExplicitFilesFlag = true;\n      let cursor = index + 1;\n\n      if (cursor >= argv.length || argv[cursor].startsWith('--')) {\n        throw new Error(\n          'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',\n        );\n      }\n\n      while (cursor < argv.length && !argv[cursor].startsWith('--')) {\n        explicitFiles.push(argv[cursor]);\n        cursor += 1;\n      }\n\n      index = cursor - 1;\n      continue;\n    }\n\n    if (argument.startsWith('--files=')) {\n      hasExplicitFilesFlag = true;\n      const value = argument.slice('--files='.length);\n\n      if (value.length === 0) {\n        throw new Error(\n          'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',\n        );\n      }\n\n      explicitFiles.push(\n        ...value\n          .split(',')\n          .map((item) => item.trim())\n          .filter(Boolean),\n      );\n    }\n  }\n\n  if (hasExplicitFilesFlag && explicitFiles.length === 0) {\n    throw new Error(\n      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',\n    );\n  }\n\n  return explicitFiles.length === 0\n    ? null\n    : uniqSorted(explicitFiles.map((filePath) => toPosixPath(filePath)));\n}\n\n/**\n * Resolve the complete verify invocation once. The returned scope is consumed by\n * changed-path planning and the same object is persisted for retry/resume output.\n * @param argv Raw verify CLI arguments.\n * @param [processEnv] Environment used for base and profile defaults.\n * @returns Structured effective invocation.\n */\nexport function resolveVerifyInvocation(argv, processEnv = process.env) {\n  const explicitBaseRef = getCliBaseRef(argv);\n  const explicitFiles = getCliFilesOverride(argv);\n  const onlyLabel = getCliOnlyLabel(argv);\n  const explicitProfile = getCliProfile(argv);\n  const hasFix = argv.includes('--fix');\n  const hasFixOnly = argv.includes('--fix-only');\n\n  if (hasFix && hasFixOnly) {\n    throw new Error('Use either --fix or --fix-only, not both.');\n  }\n\n  const profileEnv =\n    explicitProfile === null\n      ? processEnv\n      : {\n          ...processEnv,\n          [VERIFY_PROFILE_ENV]: explicitProfile,\n        };\n  const profile = resolvePlaywrightContainerProfile(profileEnv).name;\n  let scope;\n\n  if (explicitFiles !== null) {\n    scope = { kind: 'explicit-files', files: explicitFiles };\n  } else if (processEnv.GITHUB_BASE_REF) {\n    scope = { kind: 'github-base', baseRef: `origin/${processEnv.GITHUB_BASE_REF}` };\n  } else if (explicitBaseRef !== null) {\n    scope = { kind: 'local-base', baseRef: explicitBaseRef };\n  } else if (processEnv.VERIFY_BASE) {\n    scope = { kind: 'local-base', baseRef: processEnv.VERIFY_BASE };\n  } else {\n    scope = { kind: 'local' };\n  }\n\n  return {\n    version: 1,\n    scope,\n    profile,\n    onlyLabel,\n    full: argv.includes('--full'),\n    verbose: argv.includes('--verbose'),\n    fixMode: hasFix ? 'fix' : hasFixOnly ? 'fix-only' : 'none',\n  };\n}\n\nfunction isInvocationScope(scope) {\n  if (!scope || typeof scope !== 'object') {\n    return false;\n  }\n\n  if (scope.kind === 'local') {\n    return true;\n  }\n\n  if (scope.kind === 'local-base' || scope.kind === 'github-base') {\n    return typeof scope.baseRef === 'string' && scope.baseRef.length > 0;\n  }\n\n  return (\n    scope.kind === 'explicit-files' &&\n    Array.isArray(scope.files) &&\n    scope.files.length > 0 &&\n    scope.files.every((filePath) => typeof filePath === 'string' && filePath.length > 0)\n  );\n}\n\n/**\n * Validate persisted invocation metadata before rendering a retry command.\n * @param value Candidate invocation value.\n * @returns Whether the value matches the supported invocation contract.\n */\nexport function isResolvedVerifyInvocation(value) {\n  return (\n    value !== null &&\n    typeof value === 'object' &&\n    value.version === 1 &&\n    isInvocationScope(value.scope) &&\n    VERIFY_PROFILES.has(value.profile) &&\n    (value.onlyLabel === null || VERIFY_LABELS.includes(value.onlyLabel)) &&\n    typeof value.full === 'boolean' &&\n    typeof value.verbose === 'boolean' &&\n    FIX_MODES.has(value.fixMode)\n  );\n}\n\nfunction quoteShellArg(value) {\n  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {\n    return value;\n  }\n\n  return `'${value.replaceAll(\"'\", \"'\\\\''\")}'`;\n}\n\n/**\n * Render a structured verify invocation as a canonical shell-safe command.\n * @param invocation Resolved verify invocation.\n * @param [options] Display/rerun overrides.\n * @param [options.readOnly] Remove fix mode for a verification rerun.\n * @param [options.onlyLabel] Replace the focused label; null removes it.\n * @param [options.profile] Replace the runtime profile.\n * @returns Canonical pnpm verify command.\n */\nexport function formatVerifyInvocationCommand(invocation, options = {}) {\n  if (!isResolvedVerifyInvocation(invocation)) {\n    throw new Error('Invalid resolved verify invocation.');\n  }\n\n  const readOnly = options.readOnly ?? false;\n  const onlyLabel = Object.hasOwn(options, 'onlyLabel') ? options.onlyLabel : invocation.onlyLabel;\n  const profile = options.profile ?? invocation.profile;\n\n  if (onlyLabel !== null && !VERIFY_LABELS.includes(onlyLabel)) {\n    throw new Error(`Invalid value for --only: ${onlyLabel}`);\n  }\n\n  if (!VERIFY_PROFILES.has(profile)) {\n    throw new Error(`Invalid value for --profile: ${profile}`);\n  }\n\n  const args = [];\n\n  if (invocation.verbose) {\n    args.push('--verbose');\n  }\n\n  if (!readOnly && invocation.fixMode !== 'none') {\n    args.push(`--${invocation.fixMode}`);\n  }\n\n  if (invocation.full) {\n    args.push('--full');\n  }\n\n  if (invocation.scope.kind === 'explicit-files') {\n    args.push('--files', ...invocation.scope.files);\n  } else if (invocation.scope.kind === 'local-base' || invocation.scope.kind === 'github-base') {\n    args.push('--base', invocation.scope.baseRef);\n  }\n\n  args.push('--profile', profile);\n\n  if (onlyLabel !== null) {\n    args.push('--only', onlyLabel);\n  }\n\n  return ['pnpm', 'verify', ...args].map(quoteShellArg).join(' ');\n}\n",
);

write(
  'scripts/lib/verifyInvocation.test.mjs',
  "import { describe, expect, it } from 'vitest';\n\nimport {\n  formatVerifyInvocationCommand,\n  isResolvedVerifyInvocation,\n  resolveVerifyInvocation,\n} from './verifyInvocation.mjs';\n\ndescribe('resolveVerifyInvocation', () => {\n  it('makes GitHub base and profile explicit in one structured invocation', () => {\n    expect(\n      resolveVerifyInvocation(['--only', 'unit-tests'], {\n        GITHUB_ACTIONS: 'true',\n        GITHUB_BASE_REF: 'develop',\n      }),\n    ).toEqual({\n      version: 1,\n      scope: { kind: 'github-base', baseRef: 'origin/develop' },\n      profile: 'github-actions',\n      onlyLabel: 'unit-tests',\n      full: false,\n      verbose: false,\n      fixMode: 'none',\n    });\n  });\n\n  it('uses VERIFY_BASE for a local invocation', () => {\n    expect(\n      resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false', VERIFY_BASE: 'origin/parent' }).scope,\n    ).toEqual({ kind: 'local-base', baseRef: 'origin/parent' });\n  });\n\n  it('treats explicit files as the effective scope and does not retain an ignored base', () => {\n    const invocation = resolveVerifyInvocation(\n      ['--base', 'origin/wrong', '--files', 'src/path with space.ts', '--only', 'eslint'],\n      { GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'develop' },\n    );\n\n    expect(invocation.scope).toEqual({\n      kind: 'explicit-files',\n      files: ['src/path with space.ts'],\n    });\n    expect(formatVerifyInvocationCommand(invocation)).toBe(\n      \"pnpm verify --files 'src/path with space.ts' --profile github-actions --only eslint\",\n    );\n  });\n\n  it('rejects mutually exclusive fix modes', () => {\n    expect(() => resolveVerifyInvocation(['--fix', '--fix-only'], {})).toThrow(\n      'Use either --fix or --fix-only, not both.',\n    );\n  });\n});\n\ndescribe('formatVerifyInvocationCommand', () => {\n  it('preserves full, verbose, files, profile, and label while removing fix mode for reruns', () => {\n    const invocation = resolveVerifyInvocation(\n      [\n        '--fix-only',\n        '--verbose',\n        '--full',\n        '--profile',\n        'local',\n        '--only',\n        'visual',\n        '--files',\n        'tests/e2e/visual/path with space.spec.ts',\n      ],\n      {},\n    );\n\n    expect(\n      formatVerifyInvocationCommand(invocation, {\n        readOnly: true,\n        onlyLabel: 'artifact',\n        profile: 'github-actions',\n      }),\n    ).toBe(\n      \"pnpm verify --verbose --full --files 'tests/e2e/visual/path with space.spec.ts' --profile github-actions --only artifact\",\n    );\n  });\n\n  it('single-quotes substitutions, backticks, and embedded single quotes', () => {\n    const backtick = String.fromCharCode(96);\n    const unsafePath =\n      'src/$(touch unsafe) ' + backtick + 'echo unsafe' + backtick + \" and 'quote.ts\";\n    const invocation = resolveVerifyInvocation(['--files', unsafePath], {});\n    const command = formatVerifyInvocationCommand(invocation);\n\n    expect(command).toContain(\"--files 'src/$(touch unsafe)\");\n    expect(command).toContain(backtick);\n    expect(command).toContain(\"'\\\\''\");\n  });\n});\n\ndescribe('isResolvedVerifyInvocation', () => {\n  it('rejects corrupted persisted metadata', () => {\n    expect(isResolvedVerifyInvocation({ version: 1, scope: { kind: 'local' } })).toBe(false);\n  });\n});\n",
);

replaceOnce(
  'scripts/lib/changedPaths.mjs',
  '/**\n * Read the verify base ref from the current process environment.\n * @param [processEnv] Environment object to read from.\n * @returns Base ref value, or `null` when `VERIFY_BASE` is unset.\n */\nexport function getVerifyBaseRef(processEnv = process.env) {\n  return processEnv.VERIFY_BASE ?? null;\n}\n\n',
  '',
);

replaceBetween(
  'scripts/lib/changedPaths.mjs',
  '/**\n * Resolve the current verify changed-path scope:',
  '/**\n * Project a changed-path scope input',
  "/**\n * Execute changed-path planning from the already resolved verify invocation scope.\n * Base/environment precedence is owned by verifyInvocation.mjs and is not repeated here.\n * @param [options] Scope execution inputs.\n * @param [options.invocationScope] Resolved invocation scope.\n * @param [options.cwd] Repository working directory; defaults to process.cwd().\n * @returns Scope with an explicit git-diff or explicit-files input, a human-readable\n * scope label, resolved base ref, and packageJsonOldRef.\n */\nexport function resolveChangedPathsScope({ invocationScope, cwd = process.cwd() } = {}) {\n  if (!invocationScope || typeof invocationScope !== 'object') {\n    throw new Error('Resolved verify invocation scope is required.');\n  }\n\n  if (invocationScope.kind === 'explicit-files') {\n    return {\n      input: {\n        kind: 'explicit-files',\n        files: uniqSortedStrings(invocationScope.files.map(toPosixPath)),\n      },\n      scope: 'explicit-files',\n      baseRef: null,\n      packageJsonOldRef: null,\n    };\n  }\n\n  if (invocationScope.kind === 'github-base') {\n    const { baseRef } = invocationScope;\n    const mergeBase = getMergeBase('HEAD', baseRef, cwd);\n    const changes = diffNameStatus([mergeBase, 'HEAD'], cwd);\n\n    return toGitDiffScope(changes, `github-base ${baseRef}`, baseRef, mergeBase);\n  }\n\n  if (invocationScope.kind === 'local-base') {\n    const { baseRef } = invocationScope;\n    ensureBaseRefExists(baseRef, cwd);\n    const forkPoint = getForkPoint(baseRef, cwd);\n    const changes = [...diffNameStatus([forkPoint], cwd), ...listUntrackedFiles(cwd)];\n\n    return toGitDiffScope(changes, `local-base ${baseRef}`, baseRef, forkPoint);\n  }\n\n  if (invocationScope.kind !== 'local') {\n    throw new Error(`Unsupported resolved verify invocation scope: ${JSON.stringify(invocationScope)}`);\n  }\n\n  const rawChanges = [...diffNameStatus(['HEAD'], cwd), ...listUntrackedFiles(cwd)];\n\n  if (rawChanges.length === 0 && hasHeadParent(cwd)) {\n    const fallbackChanges = diffNameStatus(['HEAD~1..HEAD'], cwd);\n\n    return toGitDiffScope(fallbackChanges, 'local-last-commit', null, 'HEAD~1');\n  }\n\n  return toGitDiffScope(rawChanges, 'local-changes', null, 'HEAD');\n}\n\n",
);

replaceOnce(
  'scripts/lib/changedPaths.test.mjs',
  '  getChangedFileProjection,\n  getVerifyBaseRef,\n  parseGitDiffStatusOutput,',
  '  getChangedFileProjection,\n  parseGitDiffStatusOutput,',
);

replaceBetween(
  'scripts/lib/changedPaths.test.mjs',
  "describe('getVerifyBaseRef', () => {",
  "describe('resolveChangedPathsScope explicit-files mode', () => {",
  '',
);

replaceOnce(
  'scripts/lib/changedPaths.test.mjs',
  "resolveChangedPathsScope({ cliFilesOverride: ['b.ts', 'a.ts'] })",
  "resolveChangedPathsScope({ invocationScope: { kind: 'explicit-files', files: ['b.ts', 'a.ts'] } })",
);

replaceAllExact(
  'scripts/lib/changedPaths.test.mjs',
  'resolveChangedPathsScope({ cwd: dir, processEnv: {} })',
  "resolveChangedPathsScope({ invocationScope: { kind: 'local' }, cwd: dir })",
  6,
);

replaceOnce(
  'scripts/lib/changedPaths.test.mjs',
  "resolveChangedPathsScope({ cliBaseRef: 'main', cwd: dir, processEnv: {} })",
  "resolveChangedPathsScope({ invocationScope: { kind: 'local-base', baseRef: 'main' }, cwd: dir })",
);

replaceOnce(
  'scripts/lib/changedPaths.test.mjs',
  "resolveChangedPathsScope({ cliBaseRef: 'origin/does-not-exist', cwd: dir, processEnv: {} })",
  "resolveChangedPathsScope({ invocationScope: { kind: 'local-base', baseRef: 'origin/does-not-exist' }, cwd: dir })",
);

replaceOnce(
  'scripts/lib/changedPaths.test.mjs',
  "    const scope = resolveChangedPathsScope({\n      processEnv: { GITHUB_BASE_REF: 'develop' },\n      cwd: dir,\n    });",
  "    const scope = resolveChangedPathsScope({\n      invocationScope: { kind: 'github-base', baseRef: 'origin/develop' },\n      cwd: dir,\n    });",
);

replaceOnce(
  'scripts/verify.mjs',
  "import {\n  getChangedFileProjection,\n  getVerifyBaseRef,\n  resolveChangedPathsScope,\n} from './lib/changedPaths.mjs';",
  "import { getChangedFileProjection, resolveChangedPathsScope } from './lib/changedPaths.mjs';\nimport {\n  formatVerifyInvocationCommand,\n  getCliFilesOverride,\n  resolveVerifyInvocation,\n  VERIFY_LABELS,\n} from './lib/verifyInvocation.mjs';",
);

replaceOnce(
  'scripts/verify.mjs',
  "const rawCliArgs = process.argv.slice(2);\nconst isHelpMode = process.argv.includes('--help') || rawCliArgs.includes('help');\nconst cliArgs = isHelpMode ? rawCliArgs : getEffectiveVerifyArgs(rawCliArgs);\nconst isFixMode = cliArgs.includes('--fix');\nconst isFixOnlyMode = cliArgs.includes('--fix-only');\nconst isVerboseMode = cliArgs.includes('--verbose');\nconst isFullMode = cliArgs.includes('--full');\nconst shouldApplyFixers = isFixMode || isFixOnlyMode;\nconst cliFilesOverride = isHelpMode ? null : getCliFilesOverride(cliArgs);\nconst VERIFY_LABELS = [\n  'agent-environment',\n  'format',\n  'oxlint',\n  'eslint',\n  'type-check',\n  'unit-tests',\n  'e2e-install',\n  'e2e',\n  'storybook-behavior',\n  'visual',\n  'mutation',\n  'release-version',\n  'release-config',\n  'build',\n  'artifact',\n  'release-smoke',\n];",
  "const rawCliArgs = process.argv.slice(2);\nconst isHelpMode = process.argv.includes('--help') || rawCliArgs.includes('help');\nconst currentVerifyInvocation = isHelpMode\n  ? null\n  : resolveVerifyInvocation(rawCliArgs, process.env);\nconst isFixMode = currentVerifyInvocation?.fixMode === 'fix';\nconst isFixOnlyMode = currentVerifyInvocation?.fixMode === 'fix-only';\nconst isVerboseMode = currentVerifyInvocation?.verbose ?? false;\nconst isFullMode = currentVerifyInvocation?.full ?? false;\nconst shouldApplyFixers = isFixMode || isFixOnlyMode;",
);

replaceOnce(
  'scripts/verify.mjs',
  'const cliBaseRef = isHelpMode ? null : getCliBaseRef(cliArgs);\nconst cliOnlyLabel = isHelpMode ? null : getCliOnlyLabel(cliArgs);\nconst cliProfile = isHelpMode ? null : getCliProfile(cliArgs);',
  'const cliOnlyLabel = currentVerifyInvocation?.onlyLabel ?? null;\nconst cliProfile = currentVerifyInvocation?.profile ?? null;',
);

replaceBetween(
  'scripts/verify.mjs',
  '\nfunction getCliBaseRef(argv) {',
  '\nfunction isTypeCheckTarget(filePath) {',
  '\nexport { getCliFilesOverride };\n',
);

replaceBetween(
  'scripts/verify.mjs',
  '\nfunction stripVerifyArg(argv, index, flag) {',
  '\n/**\n * Build the `action required` lines',
  '\n/**\n * Build a supported read-only verify command from the resolved invocation.\n * @param invocation Resolved verify invocation.\n * @param [overrides] Optional profile and label overrides.\n * @returns Canonical shell-safe pnpm verify command.\n */\nexport function getVerifyRerunCommand(invocation, overrides = {}) {\n  return formatVerifyInvocationCommand(invocation, {\n    ...overrides,\n    readOnly: true,\n  });\n}\n\n',
);

replaceAllExact(
  'scripts/verify.mjs',
  '@param [options.verifyArgs] Original verify CLI arguments.',
  '@param [options.invocation] Resolved verify invocation.',
  2,
);

replaceOnce(
  'scripts/verify.mjs',
  '  const { ciProfileRisk = null, verifyArgs = [] } = options;',
  '  const { ciProfileRisk = null, invocation = currentVerifyInvocation } = options;',
);

replaceAllExact(
  'scripts/verify.mjs',
  'getVerifyRerunCommand(verifyArgs',
  'getVerifyRerunCommand(invocation',
  4,
);

replaceOnce(
  'scripts/verify.mjs',
  '  const actionRequired = getActionRequired(results, {\n    ciProfileRisk,\n    verifyArgs: options.verifyArgs ?? cliArgs,\n  });',
  '  const actionRequired = getActionRequired(results, {\n    ciProfileRisk,\n    invocation: options.invocation ?? currentVerifyInvocation,\n  });',
);

replaceOnce(
  'scripts/verify.mjs',
  "async function main(verifyLockEnv = {}, verifyLockController = { updateMetadata: () => {} }) {\n  if (isFixMode && isFixOnlyMode) {\n    throw new Error('Use either --fix or --fix-only, not both.');\n  }\n\n  const verifyProcessEnv = getVerifyProcessEnv(process.env);\n  const { input, scope, baseRef, packageJsonOldRef } = resolveChangedPathsScope({\n    cliFilesOverride,\n    cliBaseRef,\n    processEnv: process.env,\n  });",
  'async function main(verifyLockEnv = {}, verifyLockController = { updateMetadata: () => {} }) {\n  const verifyProcessEnv = getVerifyProcessEnv(process.env);\n  const { input, scope, baseRef, packageJsonOldRef } = resolveChangedPathsScope({\n    invocationScope: currentVerifyInvocation.scope,\n  });',
);

replaceOnce(
  'scripts/verify.mjs',
  '  const summary = printSummary(changedFiles, scope, results, {\n    baseRef,\n    processEnv: verifyProcessEnv,\n    verifyArgs: cliArgs,\n  });',
  '  const summary = printSummary(changedFiles, scope, results, {\n    baseRef,\n    processEnv: verifyProcessEnv,\n    invocation: currentVerifyInvocation,\n  });',
);

replaceOnce(
  'scripts/verify.mjs',
  "/**\n * Build the persisted metadata for the top-level verify lock.\n * @param argv Effective verify CLI arguments.\n * @returns Lock metadata with a shell-safe, scope-complete display command.\n */\nexport function getVerifyLockMetadata(argv) {\n  return {\n    command: formatCommand('pnpm', ['verify', ...argv]),\n    label: 'verify',\n    logPath: VERIFY_LOG_DIR,\n  };\n}",
  "/**\n * Build persisted metadata for the top-level verify lock.\n * The structured invocation is the retry source of truth; command is display-only.\n * @param invocation Resolved verify invocation.\n * @returns Lock metadata with structured scope and a shell-safe display command.\n */\nexport function getVerifyLockMetadata(invocation) {\n  return {\n    command: formatVerifyInvocationCommand(invocation),\n    verifyInvocation: invocation,\n    label: 'verify',\n    logPath: VERIFY_LOG_DIR,\n  };\n}",
);

replaceOnce(
  'scripts/verify.mjs',
  'export async function runVerifyCli(deps = {}) {\n  const { runMain = main, withVerifyLock = withVerifyCommandLock } = deps;',
  'export async function runVerifyCli(deps = {}) {\n  const {\n    invocation = currentVerifyInvocation,\n    runMain = main,\n    withVerifyLock = withVerifyCommandLock,\n  } = deps;',
);

replaceOnce(
  'scripts/verify.mjs',
  '  await withVerifyLock(getVerifyLockMetadata(cliArgs), (verifyLockEnv, verifyLockController) =>\n    runMain(verifyLockEnv, verifyLockController),\n  );',
  '  await withVerifyLock(getVerifyLockMetadata(invocation), (verifyLockEnv, verifyLockController) =>\n    runMain(verifyLockEnv, verifyLockController),\n  );',
);

replaceOnce(
  'scripts/verifyResume.mjs',
  "import { getMachineLockStatus, releaseOwnedLock } from './lib/commandLock.mjs';",
  "import { getMachineLockStatus, releaseOwnedLock } from './lib/commandLock.mjs';\nimport {\n  formatVerifyInvocationCommand,\n  isResolvedVerifyInvocation,\n} from './lib/verifyInvocation.mjs';",
);

replaceOnce(
  'scripts/verifyResume.mjs',
  "export function getRetryInstruction(metadata) {\n  const command = metadata?.command;\n\n  if (typeof command === 'string' && command.trim().length > 0) {\n    return `  Run \\`${command.trim()}\\` again.`;\n  }\n\n  return '  Re-run the original task-scope verify command; do not default to plain `pnpm verify`.';\n}",
  "export function getRetryInstruction(metadata) {\n  if (isResolvedVerifyInvocation(metadata?.verifyInvocation)) {\n    return `  Run \\`${formatVerifyInvocationCommand(metadata.verifyInvocation)}\\` again.`;\n  }\n\n  const legacyCommand = metadata?.command;\n\n  if (typeof legacyCommand === 'string' && legacyCommand.trim().length > 0) {\n    return `  Run \\`${legacyCommand.trim()}\\` again.`;\n  }\n\n  return '  Re-run the original task-scope verify command; do not default to plain `pnpm verify`.';\n}",
);

replaceOnce(
  'scripts/verify.test.mjs',
  '  getBlockingLogIssue,\n  getEffectiveVerifyArgs,\n  getCliFilesOverride,\n  getVerifyProcessEnv,\n  getVerifyRerunCommand,',
  '  getBlockingLogIssue,\n  getCliFilesOverride,\n  getVerifyProcessEnv,',
);

replaceFromMarker(
  'scripts/verify.test.mjs',
  "\ndescribe('effective verify retry scope', () => {",
  '\n',
);

replaceOnce(
  'scripts/verifyResume.test.mjs',
  "import { getEffectiveVerifyArgs, getVerifyLockMetadata } from './verify.mjs';\nimport { getRetryInstruction, resumeVerification } from './verifyResume.mjs';",
  "import { resolveVerifyInvocation } from './lib/verifyInvocation.mjs';\nimport { getVerifyLockMetadata, runVerifyCli } from './verify.mjs';\nimport { getRetryInstruction, resumeVerification } from './verifyResume.mjs';",
);

replaceOnce(
  'scripts/verifyResume.test.mjs',
  "  it('preserves the exact recorded verify invocation', () => {\n    expect(\n      getRetryInstruction({\n        command: 'pnpm verify --base origin/develop --profile github-actions --only e2e',\n      }),\n    ).toBe('  Run `pnpm verify --base origin/develop --profile github-actions --only e2e` again.');\n  });",
  "  it('renders the structured recorded verify invocation', () => {\n    const invocation = resolveVerifyInvocation(['--base', 'origin/develop', '--only', 'e2e'], {\n      GITHUB_ACTIONS: 'true',\n      GITHUB_BASE_REF: 'develop',\n    });\n\n    expect(getRetryInstruction(getVerifyLockMetadata(invocation))).toBe(\n      '  Run `pnpm verify --base origin/develop --profile github-actions --only e2e` again.',\n    );\n  });\n\n  it('keeps compatibility with legacy string-only lock metadata', () => {\n    expect(getRetryInstruction({ command: 'pnpm verify --base origin/develop' })).toBe(\n      '  Run `pnpm verify --base origin/develop` again.',\n    );\n  });",
);

replaceFromMarker(
  'scripts/verifyResume.test.mjs',
  "\ndescribe('effective retry metadata integration', () => {",
  "\ndescribe('effective retry metadata integration', () => {\n  it('round-trips the metadata emitted by runVerifyCli through resume guidance', async () => {\n    const invocation = resolveVerifyInvocation(['--only', 'e2e'], {\n      GITHUB_ACTIONS: 'true',\n      GITHUB_BASE_REF: 'develop',\n    });\n    const runMain = vi.fn();\n    let lockMetadata = null;\n\n    await runVerifyCli({\n      invocation,\n      runMain,\n      withVerifyLock: vi.fn(async (metadata, run) => {\n        lockMetadata = metadata;\n        await run({}, { updateMetadata: vi.fn() });\n      }),\n    });\n\n    expect(runMain).toHaveBeenCalledOnce();\n    expect(lockMetadata?.verifyInvocation).toEqual(invocation);\n    expect(getRetryInstruction(lockMetadata)).toBe(\n      '  Run `pnpm verify --base origin/develop --profile github-actions --only e2e` again.',\n    );\n  });\n});\n",
);

replaceOnce(
  'AGENTS.md',
  'After `pnpm verify:resume`, rerun the same task-scope command recorded by `verify:status`; do not silently replace it with plain `pnpm verify`.',
  'After `pnpm verify:resume`, rerun the exact task-scope command printed by the resume command; do not silently replace it with plain `pnpm verify`.',
);

replaceOnce(
  '.agents/skills/verification/SKILL.md',
  'After resume, rerun the exact original task-scope command recorded by status/metadata; plain `pnpm verify` is not an acceptable fallback when the original invocation had scope arguments.',
  'After resume, rerun the exact original task-scope command printed by `pnpm verify:resume` when structured metadata is available; plain `pnpm verify` is not an acceptable fallback when the original invocation had scope arguments.',
);

const packageJsonPath = path.join(root, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.scripts['ci:autofix'] = 'node scripts/verify.mjs --fix-only';
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');
fs.rmSync(selfPath);
console.log('Applied verify invocation architecture correction.');
