import path from 'node:path';

import {
  resolvePlaywrightContainerProfile,
  VERIFY_PROFILE_ENV,
} from '../playwrightContainer.mjs';

export const VERIFY_LABELS = [
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
  'mutation',
  'release-version',
  'release-config',
  'build',
  'artifact',
  'release-smoke',
];

const VERIFY_PROFILES = new Set(['local', 'github-actions']);
const FIX_MODES = new Set(['none', 'fix', 'fix-only']);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function uniqSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function getCliOption(argv, flag, missingMessage) {
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

function getCliBaseRef(argv) {
  return getCliOption(
    argv,
    '--base',
    'Missing value for --base. Example: pnpm verify --base origin/develop',
  );
}

function getCliOnlyLabel(argv) {
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

function getCliProfile(argv) {
  const value = getCliOption(
    argv,
    '--profile',
    'Missing value for --profile. Accepted profiles: local, github-actions',
  );

  if (value !== null && !VERIFY_PROFILES.has(value)) {
    throw new Error(
      [`Invalid value for --profile: ${value}`, 'Accepted profiles: local, github-actions'].join(
        '\n',
      ),
    );
  }

  return value;
}

/**
 * Parse explicit file overrides from the verify CLI.
 * @param argv Raw CLI arguments after the script name.
 * @returns Explicit file list, or null when --files was not provided.
 */
export function getCliFilesOverride(argv) {
  const explicitFiles = [];
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

/**
 * Resolve the complete verify invocation once. The returned scope is consumed by
 * changed-path planning and the same object is persisted for retry/resume output.
 * @param argv Raw verify CLI arguments.
 * @param [processEnv] Environment used for base and profile defaults.
 * @returns Structured effective invocation.
 */
export function resolveVerifyInvocation(argv, processEnv = process.env) {
  const explicitBaseRef = getCliBaseRef(argv);
  const explicitFiles = getCliFilesOverride(argv);
  const onlyLabel = getCliOnlyLabel(argv);
  const explicitProfile = getCliProfile(argv);
  const hasFix = argv.includes('--fix');
  const hasFixOnly = argv.includes('--fix-only');

  if (hasFix && hasFixOnly) {
    throw new Error('Use either --fix or --fix-only, not both.');
  }

  const profileEnv =
    explicitProfile === null
      ? processEnv
      : {
          ...processEnv,
          [VERIFY_PROFILE_ENV]: explicitProfile,
        };
  const profile = resolvePlaywrightContainerProfile(profileEnv).name;
  let scope;

  if (explicitFiles !== null) {
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

  return {
    version: 1,
    scope,
    profile,
    onlyLabel,
    full: argv.includes('--full'),
    verbose: argv.includes('--verbose'),
    fixMode: hasFix ? 'fix' : hasFixOnly ? 'fix-only' : 'none',
  };
}

function isInvocationScope(scope) {
  if (!scope || typeof scope !== 'object') {
    return false;
  }

  if (scope.kind === 'local') {
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

/**
 * Validate persisted invocation metadata before rendering a retry command.
 * @param value Candidate invocation value.
 * @returns Whether the value matches the supported invocation contract.
 */
export function isResolvedVerifyInvocation(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    value.version === 1 &&
    isInvocationScope(value.scope) &&
    VERIFY_PROFILES.has(value.profile) &&
    (value.onlyLabel === null || VERIFY_LABELS.includes(value.onlyLabel)) &&
    typeof value.full === 'boolean' &&
    typeof value.verbose === 'boolean' &&
    FIX_MODES.has(value.fixMode)
  );
}

function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return `'${value.replaceAll("'", "'\\''")}'`;
}

/**
 * Render a structured verify invocation as a canonical shell-safe command.
 * @param invocation Resolved verify invocation.
 * @param [options] Display/rerun overrides.
 * @param [options.readOnly] Remove fix mode for a verification rerun.
 * @param [options.onlyLabel] Replace the focused label; null removes it.
 * @param [options.profile] Replace the runtime profile.
 * @returns Canonical pnpm verify command.
 */
export function formatVerifyInvocationCommand(invocation, options = {}) {
  if (!isResolvedVerifyInvocation(invocation)) {
    throw new Error('Invalid resolved verify invocation.');
  }

  const readOnly = options.readOnly ?? false;
  const onlyLabel = Object.hasOwn(options, 'onlyLabel') ? options.onlyLabel : invocation.onlyLabel;
  const profile = options.profile ?? invocation.profile;

  if (onlyLabel !== null && !VERIFY_LABELS.includes(onlyLabel)) {
    throw new Error(`Invalid value for --only: ${onlyLabel}`);
  }

  if (!VERIFY_PROFILES.has(profile)) {
    throw new Error(`Invalid value for --profile: ${profile}`);
  }

  const args = [];

  if (invocation.verbose) {
    args.push('--verbose');
  }

  if (!readOnly && invocation.fixMode !== 'none') {
    args.push(`--${invocation.fixMode}`);
  }

  if (invocation.full) {
    args.push('--full');
  }

  if (invocation.scope.kind === 'explicit-files') {
    args.push('--files', ...invocation.scope.files);
  } else if (invocation.scope.kind === 'local-base' || invocation.scope.kind === 'github-base') {
    args.push('--base', invocation.scope.baseRef);
  }

  args.push('--profile', profile);

  if (onlyLabel !== null) {
    args.push('--only', onlyLabel);
  }

  return ['pnpm', 'verify', ...args].map(quoteShellArg).join(' ');
}
