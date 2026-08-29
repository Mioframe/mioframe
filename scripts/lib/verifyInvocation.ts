import path from 'node:path';

import { resolvePlaywrightContainerProfile, VERIFY_PROFILE_ENV } from '../playwrightContainer.ts';

export const VERIFY_INVOCATION_VERSION = 5;

/** Inclusive bounds for `--repeat`; keeps agent/CI stability reruns bounded. */
export const MIN_STORYBOOK_BEHAVIOR_REPEAT = 2;
export const MAX_STORYBOOK_BEHAVIOR_REPEAT = 20;

/**
 * The eight canonical public verification types from the accepted unified
 * `pnpm verify` architecture (see docs/testing/verify-redesign-architecture.md).
 * This is the complete public `--only` contract: low-level runner/check
 * labels (format, Oxlint, ESLint, type-check, Storybook build, individual
 * release-runtime checks, and so on) are private verifier implementation
 * identifiers only and are never accepted through public `--only`.
 */
export const VERIFICATION_TYPES = [
  'static',
  'unit',
  'behavior',
  'visual',
  'browser-integration',
  'performance',
  'mutation',
  'e2e',
] as const;

/** One of the eight canonical verification types. See {@link VERIFICATION_TYPES}. */
export type VerificationType = (typeof VERIFICATION_TYPES)[number];

const VERIFICATION_TYPE_SET: ReadonlySet<string> = new Set(VERIFICATION_TYPES);

/**
 * Type guard for a canonical verification type.
 * @param value Candidate value.
 * @returns Whether `value` is one of {@link VERIFICATION_TYPES}.
 */
export function isVerificationType(value: unknown): value is VerificationType {
  return typeof value === 'string' && VERIFICATION_TYPE_SET.has(value);
}

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
  /** Selected public verification type, or `null` for the default (all types). */
  onlyType: VerificationType | null;
  verbose: boolean;
  fixMode: FixMode;
  /**
   * Narrow repeated-execution stability contract for the `behavior`
   * verification type only: asks Playwright to repeat the selected tests
   * this many times within one behavior invocation, for deterministic flake
   * diagnosis. Valid only with `--only behavior`, `--files`, and outside
   * `--full`; bounded to
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
const BOOLEAN_FLAGS: ReadonlySet<string> = new Set(['--verbose', '--fix', '--fix-only', '--full']);
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

function getCliOnlyType(argv: readonly string[]): VerificationType | null {
  const value = getCliOption(
    argv,
    '--only',
    `Missing value for --only. Accepted types: ${VERIFICATION_TYPES.join(', ')}`,
  );

  if (value !== null && !isVerificationType(value)) {
    throw new Error(
      [
        `Invalid value for --only: ${value}`,
        `Accepted types: ${VERIFICATION_TYPES.join(', ')}`,
      ].join('\n'),
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
 * (requires `--only behavior`, requires `--files`, rejects `--full`) are
 * enforced separately by {@link assertModeCombination}, since they depend on
 * other resolved fields.
 * @param argv Raw CLI arguments after the script name.
 * @returns Parsed repeat count, or null when `--repeat` was not provided.
 */
function getCliRepeat(argv: readonly string[]): number | null {
  const value = getCliOption(
    argv,
    '--repeat',
    'Missing value for --repeat. Example: pnpm verify --only behavior --files <spec> --repeat 10',
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
          'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
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
          'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
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
      'Missing value for --files. Example: pnpm verify --only static --files src/foo.ts',
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
  onlyType: VerificationType | null;
  fixMode: FixMode;
  repeat: number | null;
}

function assertModeCombination({ scope, onlyType, fixMode, repeat }: ModeCombinationInput): void {
  if (!isInvocationScope(scope)) {
    throw new Error('Invalid verify scope.');
  }

  if (onlyType !== null && !isVerificationType(onlyType)) {
    throw new Error(`Invalid value for --only: ${String(onlyType)}`);
  }

  if (!FIX_MODES.has(fixMode)) {
    throw new Error(`Invalid verify fix mode: ${fixMode}`);
  }

  if (scope.kind === 'full') {
    if (onlyType !== null) {
      throw new Error('--full cannot be combined with --only.');
    }

    if (fixMode === 'fix-only') {
      throw new Error('--full cannot be combined with --fix-only.');
    }
  }

  if (fixMode !== 'none' && onlyType !== null && onlyType !== 'static') {
    throw new Error(
      `--${fixMode} --only ${onlyType} is unsupported. Fix modes are supported only with --only static.`,
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

    if (onlyType !== 'behavior') {
      throw new Error('--repeat requires --only behavior.');
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
  const onlyType = getCliOnlyType(argv);
  const explicitProfile = getCliProfile(argv);
  const hasFix = argv.includes('--fix');
  const hasFixOnly = argv.includes('--fix-only');
  const full = argv.includes('--full');
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
    onlyType,
    verbose: argv.includes('--verbose'),
    fixMode: hasFix ? 'fix' : hasFixOnly ? 'fix-only' : 'none',
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

  if (value.onlyType !== null && !isVerificationType(value.onlyType)) {
    return false;
  }

  if (!isFixMode(value.fixMode)) {
    return false;
  }

  if (value.repeat !== null && typeof value.repeat !== 'number') {
    return false;
  }

  try {
    assertModeCombination({
      scope: value.scope,
      onlyType: value.onlyType,
      fixMode: value.fixMode,
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
  /** Replace the focused type; null removes it. */
  onlyType?: VerificationType | null;
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
    onlyType: Object.hasOwn(options, 'onlyType') ? (options.onlyType ?? null) : invocation.onlyType,
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

  if (candidate.onlyType !== null) {
    args.push('--only', candidate.onlyType);
  }

  if (candidate.repeat !== null) {
    args.push('--repeat', String(candidate.repeat));
  }

  return formatShellCommand('pnpm', ['verify', ...args]);
}
