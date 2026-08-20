import path from 'node:path';

import { resolvePlaywrightContainerProfile, VERIFY_PROFILE_ENV } from '../playwrightContainer.ts';

export const VERIFY_INVOCATION_VERSION = 4;

/** Inclusive bounds for `--repeat`; keeps agent/CI stability reruns bounded. */
export const MIN_STORYBOOK_BEHAVIOR_REPEAT = 2;
export const MAX_STORYBOOK_BEHAVIOR_REPEAT = 20;

export const VERIFY_LABELS: readonly string[] = [
  'agent-environment',
  'format',
  'oxlint',
  'eslint',
  'type-check',
  'unit-tests',
  'e2e-install',
  'e2e',
  'storybook-behavior',
  'visual',
  'storybook-build',
  'mutation',
  'release-version',
  'release-config',
  'build',
  'publisher-node-import',
  'artifact',
  'release-smoke',
  'managed-updates',
];

export const FULL_ONLY_LABELS: ReadonlySet<string> = new Set([
  'release-version',
  'release-config',
  'build',
  'publisher-node-import',
  'artifact',
  'release-smoke',
  'managed-updates',
]);

export const FIX_ONLY_LABELS: ReadonlySet<string> = new Set([
  'agent-environment',
  'format',
  'oxlint',
  'eslint',
]);

const FULL_FORBIDDEN_LABELS: ReadonlySet<string> = new Set(['mutation']);

/** Runtime profile a verify invocation executes under. */
export type VerifyProfile = 'local' | 'github-actions';

/** Fix mode a verify invocation runs under. */
export type FixMode = 'none' | 'fix' | 'fix-only';

/** Changed-path scope a verify invocation resolves against. */
export type VerifyInvocationScope =
  | { kind: 'full' }
  | { kind: 'local' }
  | { kind: 'explicit-files'; files: string[] }
  | { kind: 'local-base'; baseRef: string }
  | { kind: 'github-base'; baseRef: string };

/** Fully resolved, structured verify invocation. */
export interface VerifyInvocation {
  version: number;
  scope: VerifyInvocationScope;
  profile: VerifyProfile;
  onlyLabel: string | null;
  verbose: boolean;
  fixMode: FixMode;
  /**
   * Narrow GitHub Actions fallback contract for the `storybook-build` label only (see
   * `.github/workflows/verify.yml`): requests the build only when the ordinary
   * `storybook-build` plan requires it and neither `storybook-behavior` nor `visual` will run.
   * Valid only with `--only storybook-build` and outside `--full`.
   */
  storybookBuildCiFallback: boolean;
  /**
   * Narrow repeated-execution stability contract for the `storybook-behavior`
   * label only: asks Playwright to repeat the selected tests this many times
   * within one Storybook behavior invocation, for deterministic flake
   * diagnosis. Valid only with `--only storybook-behavior`, `--files`, and
   * outside `--full`; bounded to
   * [{@link MIN_STORYBOOK_BEHAVIOR_REPEAT}, {@link MAX_STORYBOOK_BEHAVIOR_REPEAT}].
   * `null` for an ordinary invocation.
   */
  repeat: number | null;
}

function isVerifyProfile(value: unknown): value is VerifyProfile {
  return value === 'local' || value === 'github-actions';
}

function isFixMode(value: unknown): value is FixMode {
  return value === 'none' || value === 'fix' || value === 'fix-only';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function toPosixPath(filePath: string): string {
  return filePath.split(path.sep).join(path.posix.sep);
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function findEqualsFlag(argument: string): string | null {
  return [...VALUE_FLAGS, '--files'].find((flag) => argument.startsWith(`${flag}=`)) ?? null;
}

function assertUniqueOption(seenOptions: Set<string>, flag: string): void {
  if (seenOptions.has(flag)) {
    throw new Error(`Duplicate verify option: ${flag}`);
  }

  seenOptions.add(flag);
}

const VERIFY_PROFILES: ReadonlySet<string> = new Set(['local', 'github-actions']);
const FIX_MODES: ReadonlySet<string> = new Set(['none', 'fix', 'fix-only']);
const BOOLEAN_FLAGS: ReadonlySet<string> = new Set([
  '--verbose',
  '--fix',
  '--fix-only',
  '--full',
  '--storybook-build-ci-fallback',
]);
const VALUE_FLAGS: readonly string[] = ['--base', '--only', '--profile', '--repeat'];

/**
 * Reject unknown, positional, or repeated verify arguments before any scope is resolved.
 * A typo must never silently downgrade a full or explicitly scoped verification run.
 * @param argv Raw CLI arguments after the script name.
 */
function assertRecognizedCliArgs(argv: readonly string[]): void {
  const seenOptions = new Set<string>();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (BOOLEAN_FLAGS.has(argument)) {
      assertUniqueOption(seenOptions, argument);
      continue;
    }

    const equalsFlag = findEqualsFlag(argument);

    if (equalsFlag !== null) {
      assertUniqueOption(seenOptions, equalsFlag);
      continue;
    }

    if (VALUE_FLAGS.includes(argument)) {
      assertUniqueOption(seenOptions, argument);
      index += 1;
      continue;
    }

    if (argument === '--files') {
      assertUniqueOption(seenOptions, argument);
      let cursor = index + 1;

      while (cursor < argv.length && !argv[cursor].startsWith('--')) {
        cursor += 1;
      }

      index = cursor - 1;
      continue;
    }

    throw new Error(`Unknown verify argument: ${argument}`);
  }
}

function getCliOption(
  argv: readonly string[],
  flag: string,
  missingMessage: string,
): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === flag) {
      const value = argv[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(missingMessage);
      }

      return value;
    }

    if (argument.startsWith(`${flag}=`)) {
      const value = argument.slice(flag.length + 1);

      if (value.length === 0) {
        throw new Error(missingMessage);
      }

      return value;
    }
  }

  return null;
}

function getCliBaseRef(argv: readonly string[]): string | null {
  return getCliOption(
    argv,
    '--base',
    'Missing value for --base. Example: pnpm verify --base origin/develop',
  );
}

function getCliOnlyLabel(argv: readonly string[]): string | null {
  const value = getCliOption(
    argv,
    '--only',
    `Missing value for --only. Accepted labels: ${VERIFY_LABELS.join(', ')}`,
  );

  if (value !== null && !VERIFY_LABELS.includes(value)) {
    throw new Error(
      [`Invalid value for --only: ${value}`, `Accepted labels: ${VERIFY_LABELS.join(', ')}`].join(
        '\n',
      ),
    );
  }

  return value;
}

function getCliProfile(argv: readonly string[]): VerifyProfile | null {
  const value = getCliOption(
    argv,
    '--profile',
    'Missing value for --profile. Accepted profiles: local, github-actions',
  );

  if (value !== null && !isVerifyProfile(value)) {
    throw new Error(
      [`Invalid value for --profile: ${value}`, 'Accepted profiles: local, github-actions'].join(
        '\n',
      ),
    );
  }

  return value;
}

/**
 * Parse and range-validate `--repeat` from the verify CLI. Combination rules
 * (requires `--only storybook-behavior`, requires `--files`, rejects `--full`)
 * are enforced separately by {@link assertModeCombination}, since they depend
 * on other resolved fields.
 * @param argv Raw CLI arguments after the script name.
 * @returns Parsed repeat count, or null when `--repeat` was not provided.
 */
function getCliRepeat(argv: readonly string[]): number | null {
  const value = getCliOption(
    argv,
    '--repeat',
    'Missing value for --repeat. Example: pnpm verify --only storybook-behavior --files <spec> --repeat 10',
  );

  if (value === null) {
    return null;
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error(
      `Invalid value for --repeat: ${value}. Must be an integer between ${MIN_STORYBOOK_BEHAVIOR_REPEAT} and ${MAX_STORYBOOK_BEHAVIOR_REPEAT}.`,
    );
  }

  const parsed = Number(value);

  if (parsed < MIN_STORYBOOK_BEHAVIOR_REPEAT || parsed > MAX_STORYBOOK_BEHAVIOR_REPEAT) {
    throw new Error(
      `Invalid value for --repeat: ${value}. Must be an integer between ${MIN_STORYBOOK_BEHAVIOR_REPEAT} and ${MAX_STORYBOOK_BEHAVIOR_REPEAT}.`,
    );
  }

  return parsed;
}

/**
 * Parse explicit file overrides from the verify CLI.
 * @param argv Raw CLI arguments after the script name.
 * @returns Explicit file list, or null when --files was not provided.
 */
export function getCliFilesOverride(argv: readonly string[]): string[] | null {
  const explicitFiles: string[] = [];
  let hasExplicitFilesFlag = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--files') {
      hasExplicitFilesFlag = true;
      let cursor = index + 1;

      if (cursor >= argv.length || argv[cursor].startsWith('--')) {
        throw new Error(
          'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
        );
      }

      while (cursor < argv.length && !argv[cursor].startsWith('--')) {
        explicitFiles.push(argv[cursor]);
        cursor += 1;
      }

      index = cursor - 1;
      continue;
    }

    if (argument.startsWith('--files=')) {
      hasExplicitFilesFlag = true;
      const value = argument.slice('--files='.length);

      if (value.length === 0) {
        throw new Error(
          'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
        );
      }

      explicitFiles.push(
        ...value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }
  }

  if (hasExplicitFilesFlag && explicitFiles.length === 0) {
    throw new Error(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  }

  return explicitFiles.length === 0
    ? null
    : uniqSorted(explicitFiles.map((filePath) => toPosixPath(filePath)));
}

function isInvocationScope(scope: unknown): scope is VerifyInvocationScope {
  if (!isRecord(scope)) {
    return false;
  }

  if (scope.kind === 'full' || scope.kind === 'local') {
    return true;
  }

  if (scope.kind === 'local-base' || scope.kind === 'github-base') {
    return typeof scope.baseRef === 'string' && scope.baseRef.length > 0;
  }

  return (
    scope.kind === 'explicit-files' &&
    Array.isArray(scope.files) &&
    scope.files.length > 0 &&
    scope.files.every((filePath) => typeof filePath === 'string' && filePath.length > 0)
  );
}

/** Fields validated together by {@link assertModeCombination}. */
interface ModeCombinationInput {
  scope: VerifyInvocationScope;
  onlyLabel: string | null;
  fixMode: FixMode;
  storybookBuildCiFallback: boolean;
  repeat: number | null;
}

function assertModeCombination({
  scope,
  onlyLabel,
  fixMode,
  storybookBuildCiFallback,
  repeat,
}: ModeCombinationInput): void {
  if (!isInvocationScope(scope)) {
    throw new Error('Invalid verify scope.');
  }

  if (onlyLabel !== null && !VERIFY_LABELS.includes(onlyLabel)) {
    throw new Error(`Invalid value for --only: ${onlyLabel}`);
  }

  if (!FIX_MODES.has(fixMode)) {
    throw new Error(`Invalid verify fix mode: ${fixMode}`);
  }

  if (scope.kind === 'full') {
    if (onlyLabel !== null && FULL_FORBIDDEN_LABELS.has(onlyLabel)) {
      throw new Error(`--only ${onlyLabel} is not available with --full.`);
    }
  } else if (onlyLabel !== null && FULL_ONLY_LABELS.has(onlyLabel)) {
    throw new Error(
      `--only ${onlyLabel} requires --full. Run: pnpm verify --full --only ${onlyLabel}`,
    );
  }

  if (fixMode !== 'none' && onlyLabel !== null && !FIX_ONLY_LABELS.has(onlyLabel)) {
    throw new Error(
      `--${fixMode} --only ${onlyLabel} is unsupported. Accepted ${fixMode} labels: ${[
        ...FIX_ONLY_LABELS,
      ].join(', ')}`,
    );
  }

  if (storybookBuildCiFallback && (scope.kind === 'full' || onlyLabel !== 'storybook-build')) {
    throw new Error(
      '--storybook-build-ci-fallback requires --only storybook-build and cannot be combined with --full.',
    );
  }

  if (repeat !== null) {
    if (
      !Number.isInteger(repeat) ||
      repeat < MIN_STORYBOOK_BEHAVIOR_REPEAT ||
      repeat > MAX_STORYBOOK_BEHAVIOR_REPEAT
    ) {
      throw new Error(
        `Invalid --repeat: ${repeat}. Must be an integer between ${MIN_STORYBOOK_BEHAVIOR_REPEAT} and ${MAX_STORYBOOK_BEHAVIOR_REPEAT}.`,
      );
    }

    if (scope.kind === 'full') {
      throw new Error('--repeat cannot be combined with --full.');
    }

    if (onlyLabel !== 'storybook-behavior') {
      throw new Error('--repeat requires --only storybook-behavior.');
    }

    if (scope.kind !== 'explicit-files') {
      throw new Error('--repeat requires --files.');
    }
  }
}

/**
 * Resolve the complete verify invocation once. Full mode owns an unconditional
 * full-project scope; changed-path inputs are rejected instead of being retained
 * or evaluated. The same structured invocation is used by execution and resume.
 * @param argv Raw verify CLI arguments.
 * @param [processEnv] Environment used for base and profile defaults.
 * @returns Structured effective invocation.
 */
export function resolveVerifyInvocation(
  argv: readonly string[],
  processEnv: NodeJS.ProcessEnv = process.env,
): VerifyInvocation {
  assertRecognizedCliArgs(argv);
  const explicitBaseRef = getCliBaseRef(argv);
  const explicitFiles = getCliFilesOverride(argv);
  const onlyLabel = getCliOnlyLabel(argv);
  const explicitProfile = getCliProfile(argv);
  const hasFix = argv.includes('--fix');
  const hasFixOnly = argv.includes('--fix-only');
  const full = argv.includes('--full');
  const storybookBuildCiFallback = argv.includes('--storybook-build-ci-fallback');
  const repeat = getCliRepeat(argv);

  if (hasFix && hasFixOnly) {
    throw new Error('Use either --fix or --fix-only, not both.');
  }

  if (full && explicitBaseRef !== null) {
    throw new Error('--full cannot be combined with --base; full mode ignores changed-file scope.');
  }

  if (full && explicitFiles !== null) {
    throw new Error(
      '--full cannot be combined with --files; full mode ignores changed-file scope.',
    );
  }

  const profileEnv: NodeJS.ProcessEnv =
    explicitProfile === null
      ? processEnv
      : {
          ...processEnv,
          [VERIFY_PROFILE_ENV]: explicitProfile,
        };
  const profile = resolvePlaywrightContainerProfile(profileEnv).name;
  let scope: VerifyInvocationScope;

  if (full) {
    scope = { kind: 'full' };
  } else if (explicitFiles !== null) {
    scope = { kind: 'explicit-files', files: explicitFiles };
  } else if (processEnv.GITHUB_BASE_REF) {
    scope = { kind: 'github-base', baseRef: `origin/${processEnv.GITHUB_BASE_REF}` };
  } else if (explicitBaseRef !== null) {
    scope = { kind: 'local-base', baseRef: explicitBaseRef };
  } else if (processEnv.VERIFY_BASE) {
    scope = { kind: 'local-base', baseRef: processEnv.VERIFY_BASE };
  } else {
    scope = { kind: 'local' };
  }

  const invocation: VerifyInvocation = {
    version: VERIFY_INVOCATION_VERSION,
    scope,
    profile,
    onlyLabel,
    verbose: argv.includes('--verbose'),
    fixMode: hasFix ? 'fix' : hasFixOnly ? 'fix-only' : 'none',
    storybookBuildCiFallback,
    repeat,
  };
  assertModeCombination(invocation);
  return invocation;
}

/**
 * Validate persisted invocation metadata before rendering a retry command.
 * @param value Candidate invocation value.
 * @returns Whether the value matches the supported invocation contract.
 */
export function isResolvedVerifyInvocation(value: unknown): value is VerifyInvocation {
  if (!isRecord(value)) {
    return false;
  }

  if (value.version !== VERIFY_INVOCATION_VERSION) {
    return false;
  }

  if (!isVerifyProfile(value.profile)) {
    return false;
  }

  if (typeof value.verbose !== 'boolean') {
    return false;
  }

  if (!isInvocationScope(value.scope)) {
    return false;
  }

  if (
    value.onlyLabel !== null &&
    !(typeof value.onlyLabel === 'string' && VERIFY_LABELS.includes(value.onlyLabel))
  ) {
    return false;
  }

  if (!isFixMode(value.fixMode)) {
    return false;
  }

  if (typeof value.storybookBuildCiFallback !== 'boolean') {
    return false;
  }

  if (value.repeat !== null && typeof value.repeat !== 'number') {
    return false;
  }

  const onlyLabel = value.onlyLabel === null ? null : value.onlyLabel;

  try {
    assertModeCombination({
      scope: value.scope,
      onlyLabel,
      fixMode: value.fixMode,
      storybookBuildCiFallback: value.storybookBuildCiFallback,
      repeat: value.repeat,
    });
    return true;
  } catch {
    return false;
  }
}

function quoteShellArg(value: string): string {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}

/**
 * Format a command and its arguments as one shell-safe display string.
 * @param command Executable or command name.
 * @param [args] Command arguments.
 * @returns Shell-safe command text for logs and retry instructions.
 */
export function formatShellCommand(command: string, args: readonly string[] = []): string {
  return [command, ...args].map(quoteShellArg).join(' ');
}

/** Display/rerun overrides for {@link formatVerifyInvocationCommand}. */
export interface FormatVerifyInvocationCommandOptions {
  /** Remove fix mode for a verification rerun. */
  readOnly?: boolean;
  /** Replace the focused label; null removes it. */
  onlyLabel?: string | null;
  /** Replace the runtime profile. */
  profile?: VerifyProfile;
}

/**
 * Render a structured verify invocation as a canonical shell-safe command.
 * @param invocation Resolved verify invocation.
 * @param [options] Display/rerun overrides.
 * @returns Canonical pnpm verify command.
 */
export function formatVerifyInvocationCommand(
  invocation: VerifyInvocation,
  options: FormatVerifyInvocationCommandOptions = {},
): string {
  if (!isResolvedVerifyInvocation(invocation)) {
    throw new Error('Invalid resolved verify invocation.');
  }

  const candidate: VerifyInvocation = {
    ...invocation,
    profile: options.profile ?? invocation.profile,
    onlyLabel: Object.hasOwn(options, 'onlyLabel')
      ? (options.onlyLabel ?? null)
      : invocation.onlyLabel,
    fixMode: options.readOnly ? 'none' : invocation.fixMode,
  };

  if (!VERIFY_PROFILES.has(candidate.profile)) {
    throw new Error(`Invalid value for --profile: ${candidate.profile}`);
  }

  assertModeCombination(candidate);
  const args: string[] = [];

  if (candidate.verbose) {
    args.push('--verbose');
  }

  if (candidate.fixMode !== 'none') {
    args.push(`--${candidate.fixMode}`);
  }

  if (candidate.scope.kind === 'full') {
    args.push('--full');
  } else if (candidate.scope.kind === 'explicit-files') {
    args.push('--files', ...candidate.scope.files);
  } else if (candidate.scope.kind === 'local-base' || candidate.scope.kind === 'github-base') {
    args.push('--base', candidate.scope.baseRef);
  }

  args.push('--profile', candidate.profile);

  if (candidate.onlyLabel !== null) {
    args.push('--only', candidate.onlyLabel);
  }

  if (candidate.repeat !== null) {
    args.push('--repeat', String(candidate.repeat));
  }

  if (candidate.storybookBuildCiFallback) {
    args.push('--storybook-build-ci-fallback');
  }

  return formatShellCommand('pnpm', ['verify', ...args]);
}
