import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { release } from 'node:os';
import { join } from 'node:path';
import toolingConfig from '../config/tooling.json' with { type: 'json' };
import {
  runGuardedExpensiveLocalCommand,
  type LocalCommandGuardDeps,
} from './lib/localCommandGuard.ts';
import { applyProcessResult, type ProcessResult } from './lib/processResult.ts';
import { runLocalCommand } from './lib/runLocalCommand.ts';

const CONTAINER_WORKDIR = '/work';
const GENERIC_IMAGE_ENV = 'PLAYWRIGHT_CONTAINER_IMAGE';
const GENERIC_PODMAN_USERNS_ENV = 'PLAYWRIGHT_CONTAINER_PODMAN_USERNS';
const GENERIC_VOLUME_LABEL_ENV = 'PLAYWRIGHT_CONTAINER_VOLUME_LABEL';
const GENERIC_CPUS_ENV = 'PLAYWRIGHT_CONTAINER_CPUS';
const GENERIC_MEMORY_ENV = 'PLAYWRIGHT_CONTAINER_MEMORY';
const GENERIC_MEMORY_SWAP_ENV = 'PLAYWRIGHT_CONTAINER_MEMORY_SWAP';
const GENERIC_PIDS_LIMIT_ENV = 'PLAYWRIGHT_CONTAINER_PIDS_LIMIT';
const GENERIC_TIMEOUT_ENV = 'PLAYWRIGHT_CONTAINER_TIMEOUT';
const GENERIC_WORKERS_ENV = 'PLAYWRIGHT_CONTAINER_WORKERS';
export const VERIFY_PROFILE_ENV = 'MIOFRAME_VERIFY_PROFILE';
// One canonical resource profile is shared by local and GitHub Actions so the
// two environments cannot drift independently; `profileName` below still
// distinguishes them for reporting purposes only.
const canonicalContainerProfile = toolingConfig.verification.playwrightContainer;

/** Profile name a resolved Playwright container profile runs under. */
export type PlaywrightContainerProfileName = 'local' | 'github-actions';

/** Resource-limit fields shared by every Playwright container profile. */
export type PlaywrightContainerLimitKey =
  | 'cpus'
  | 'memory'
  | 'memorySwap'
  | 'pidsLimit'
  | 'timeoutSeconds'
  | 'workers';

/** Effective Playwright container profile: resolved name plus resource limits. */
export interface PlaywrightContainerProfile extends Record<PlaywrightContainerLimitKey, string> {
  name: PlaywrightContainerProfileName;
  source: string;
}

interface PlaywrightContainerLimitDefinition {
  envName: string;
  key: PlaywrightContainerLimitKey;
  podmanFlag: string;
  label?: string;
}

const PLAYWRIGHT_CONTAINER_LIMITS: readonly PlaywrightContainerLimitDefinition[] = [
  {
    envName: GENERIC_CPUS_ENV,
    key: 'cpus',
    podmanFlag: '--cpus',
  },
  {
    envName: GENERIC_MEMORY_ENV,
    key: 'memory',
    podmanFlag: '--memory',
  },
  {
    envName: GENERIC_MEMORY_SWAP_ENV,
    key: 'memorySwap',
    label: 'memory-swap',
    podmanFlag: '--memory-swap',
  },
  {
    envName: GENERIC_PIDS_LIMIT_ENV,
    key: 'pidsLimit',
    label: 'pids-limit',
    podmanFlag: '--pids-limit',
  },
  {
    envName: GENERIC_TIMEOUT_ENV,
    key: 'timeoutSeconds',
    label: 'timeout',
    podmanFlag: '--timeout',
  },
  {
    envName: GENERIC_WORKERS_ENV,
    key: 'workers',
    podmanFlag: '--workers',
  },
];

/**
 * Dependency seam for {@link runPlaywrightInContainer}. The whole `deps`
 * object is forwarded as-is to `runGuardedExpensiveLocalCommand`, so callers
 * (typically tests) may also supply any {@link LocalCommandGuardDeps}
 * override, such as `assertNoActiveVerifyLock`.
 */
export type RunPlaywrightInContainerDeps = {
  applyProcessResult: typeof applyProcessResult;
  ensureLocalPlaywrightBinary: typeof ensureLocalPlaywrightBinary;
  ensurePodmanAvailable: typeof ensurePodmanAvailable;
  getInstalledPlaywrightVersion: typeof getInstalledPlaywrightVersion;
  runGuardedExpensiveLocalCommand: typeof runGuardedExpensiveLocalCommand;
  runLocalCommand: typeof runLocalCommand;
  spawnSync: typeof spawnSync;
} & Partial<LocalCommandGuardDeps>;

const defaultDeps: RunPlaywrightInContainerDeps = {
  applyProcessResult,
  ensureLocalPlaywrightBinary,
  ensurePodmanAvailable,
  getInstalledPlaywrightVersion,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
  spawnSync,
};

const PLAYWRIGHT_CONTAINER_PROFILE_KEYS: readonly {
  key: PlaywrightContainerLimitKey;
  label: string;
}[] = PLAYWRIGHT_CONTAINER_LIMITS.map(({ key, label }) => ({
  key,
  label: label ?? key,
}));

/** Options for {@link runPlaywrightInContainer}. */
export interface RunPlaywrightInContainerOptions {
  /** Verification label for the expensive lock. */
  label?: string;
  /** Playwright config file path inside the repo. */
  config: string;
  /** Additional Playwright CLI arguments. */
  extraArgs?: readonly string[];
  /** Extra environment variables passed into the container. */
  extraEnv?: Record<string, string>;
  /** Environment variable aliases for the container image. */
  imageEnvAliases?: readonly string[];
  /** Environment variable aliases for `--userns`. */
  podmanUsernsEnvAliases?: readonly string[];
  /** Environment variable aliases for SELinux relabel mode. */
  volumeLabelEnvAliases?: readonly string[];
  /** Error shown when Podman is unavailable. */
  missingPodmanMessage: string;
  /** Error shown when Playwright package metadata is unavailable. */
  missingMetadataMessage: string;
  /** Error shown when the local Playwright binary is unavailable. */
  missingBinaryMessage: string;
  /** Error shown when `podman --version` fails. */
  podmanFailureMessage: string;
  /** Whether to add `--update-snapshots`. */
  updateSnapshots?: boolean;
}

/**
 * Run Playwright tests inside the repo's Podman wrapper with local safety limits.
 * @param options Container runner options.
 * @param [deps] Test seams for Podman execution and lock/result handling.
 * @returns Resolves after the Podman command exits.
 */
export async function runPlaywrightInContainer(
  {
    label = 'playwright-container',
    config,
    extraArgs = [],
    extraEnv = {},
    imageEnvAliases = [],
    podmanUsernsEnvAliases = [],
    volumeLabelEnvAliases = [],
    missingPodmanMessage,
    missingMetadataMessage,
    missingBinaryMessage,
    podmanFailureMessage,
    updateSnapshots = false,
  }: RunPlaywrightInContainerOptions,
  deps: RunPlaywrightInContainerDeps = defaultDeps,
): Promise<void> {
  const repositoryPath = process.cwd();
  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      label,
      command: `podman run playwright test --config ${config}`,
      run: async (lockEnv): Promise<ProcessResult> => {
        let image: string;

        try {
          deps.ensurePodmanAvailable(missingPodmanMessage, podmanFailureMessage);
          deps.ensureLocalPlaywrightBinary(repositoryPath, missingBinaryMessage);
          image =
            getFirstDefinedEnvValue([...imageEnvAliases, GENERIC_IMAGE_ENV], process.env) ||
            `mcr.microsoft.com/playwright:v${deps.getInstalledPlaywrightVersion(repositoryPath, missingMetadataMessage)}-noble`;
        } catch (setupError) {
          console.error(setupError instanceof Error ? setupError.message : String(setupError));
          return { signal: null, status: 1 };
        }

        const resourceLimits = resolvePlaywrightContainerProfile();

        printPlaywrightContainerProfile({
          config,
          label,
          resourceLimits,
        });

        const podmanArgs: string[] = [
          'run',
          '--rm',
          '--init',
          '--ipc=host',
          '--workdir',
          CONTAINER_WORKDIR,
          '--env',
          'CI=1',
        ];

        for (const limit of PLAYWRIGHT_CONTAINER_LIMITS) {
          if (limit.podmanFlag === '--workers') {
            continue;
          }

          podmanArgs.push(limit.podmanFlag, resourceLimits[limit.key]);
        }

        for (const [key, value] of Object.entries({ ...extraEnv, ...lockEnv })) {
          podmanArgs.push('--env', `${key}=${value}`);
        }

        podmanArgs.push(
          '--volume',
          `${repositoryPath}:${CONTAINER_WORKDIR}${getVolumeLabelSuffix(volumeLabelEnvAliases)}`,
        );

        const usernsMode =
          getFirstDefinedEnvValue(
            [...podmanUsernsEnvAliases, GENERIC_PODMAN_USERNS_ENV],
            process.env,
          ) || 'keep-id';

        if (usernsMode !== 'off') {
          podmanArgs.push('--userns', usernsMode);
        }

        podmanArgs.push(image, './node_modules/.bin/playwright', 'test', '--config', config);

        if (updateSnapshots) {
          podmanArgs.push('--update-snapshots');
        }

        if (!extraArgs.some((arg) => arg === '--workers' || arg.startsWith('--workers='))) {
          podmanArgs.push('--workers', resourceLimits.workers);
        }

        podmanArgs.push(...extraArgs);

        let child: ProcessResult;

        try {
          child = await deps.runLocalCommand({
            args: podmanArgs,
            command: 'podman',
            env: process.env,
          });
        } catch (error) {
          console.error('Failed to start Podman for Playwright container tests.');
          console.error(error instanceof Error ? error.message : String(error));
          return {
            signal: null,
            status: 1,
          };
        }

        if (child.status !== 0 || child.signal) {
          printPlaywrightContainerFailureDiagnostic({
            config,
            label,
            resourceLimits,
            signal: child.signal ?? null,
            status: child.status ?? 1,
          });
        }

        return {
          signal: child.signal ?? null,
          status: child.status ?? 1,
        };
      },
    },
    deps,
  );

  deps.applyProcessResult(result);
}

/** Parsed result of {@link parseVisualMode}. */
export type ParsedVisualMode =
  | { error: string; passthroughArgs: string[]; updateSnapshots: false }
  | { error: null; passthroughArgs: string[]; updateSnapshots: boolean };

/**
 * Parse the visual runner mode from CLI arguments.
 * @param argv Raw CLI arguments after the script name.
 * @returns Parsed visual mode state.
 */
export function parseVisualMode(argv: readonly string[]): ParsedVisualMode {
  const [mode, ...passthroughArgs] = argv;

  if (mode !== 'test' && mode !== 'update') {
    return {
      error: 'Expected visual mode: test or update.',
      passthroughArgs: [],
      updateSnapshots: false,
    };
  }

  return {
    error: null,
    passthroughArgs,
    updateSnapshots: mode === 'update',
  };
}

function ensurePodmanAvailable(missingPodmanMessage: string, podmanFailureMessage: string): void {
  const podmanCheck = spawnSync('podman', ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (podmanCheck.error) {
    if ('code' in podmanCheck.error && podmanCheck.error.code === 'ENOENT') {
      throw new Error(missingPodmanMessage);
    }

    throw new Error(`Failed to check Podman availability.\n${podmanCheck.error.message}`);
  }

  if (podmanCheck.status !== 0) {
    const extra = podmanCheck.stderr.trim();
    throw new Error(extra ? `${podmanFailureMessage}\n${extra}` : podmanFailureMessage);
  }
}

function ensureLocalPlaywrightBinary(repositoryPath: string, missingBinaryMessage: string): void {
  const localPlaywrightBin = join(repositoryPath, 'node_modules', '.bin', 'playwright');

  if (!existsSync(localPlaywrightBin)) {
    throw new Error(missingBinaryMessage);
  }
}

function getInstalledPlaywrightVersion(
  repositoryRoot: string,
  missingMetadataMessage: string,
): string {
  const playwrightPackageJsonPath = join(
    repositoryRoot,
    'node_modules',
    '@playwright',
    'test',
    'package.json',
  );

  if (!existsSync(playwrightPackageJsonPath)) {
    throw new Error(missingMetadataMessage);
  }

  let packageJson: unknown;

  try {
    packageJson = JSON.parse(readFileSync(playwrightPackageJsonPath, 'utf8'));
  } catch (parseError) {
    throw new Error(
      `${missingMetadataMessage}\n${parseError instanceof Error ? parseError.message : String(parseError)}`,
      { cause: parseError },
    );
  }

  const version =
    packageJson !== null && typeof packageJson === 'object' && 'version' in packageJson
      ? packageJson.version
      : undefined;

  if (typeof version !== 'string' || version.trim() === '') {
    throw new Error(missingMetadataMessage);
  }

  return version;
}

/**
 * Resolve the effective Playwright container profile for the current environment.
 * @param [processEnv] Environment object used for profile and override resolution.
 * @returns Effective profile name and resource limits.
 */
export function resolvePlaywrightContainerProfile(
  processEnv: NodeJS.ProcessEnv = process.env,
): PlaywrightContainerProfile {
  const requestedProfile = processEnv[VERIFY_PROFILE_ENV]?.trim();
  let profileName: PlaywrightContainerProfileName;

  if (requestedProfile) {
    if (requestedProfile !== 'local' && requestedProfile !== 'github-actions') {
      throw new Error(
        `Unsupported ${VERIFY_PROFILE_ENV} value: ${requestedProfile}. Expected one of: local, github-actions.`,
      );
    }

    profileName = requestedProfile;
  } else {
    profileName = processEnv.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local';
  }

  const profileDefaults = canonicalContainerProfile;
  const source =
    requestedProfile !== undefined && requestedProfile !== ''
      ? VERIFY_PROFILE_ENV
      : processEnv.GITHUB_ACTIONS === 'true'
        ? 'GITHUB_ACTIONS'
        : 'default-local';

  return {
    name: profileName,
    source,
    cpus: getFirstDefinedEnvValue([GENERIC_CPUS_ENV], processEnv) ?? profileDefaults.cpus,
    memory: getFirstDefinedEnvValue([GENERIC_MEMORY_ENV], processEnv) ?? profileDefaults.memory,
    memorySwap:
      getFirstDefinedEnvValue([GENERIC_MEMORY_SWAP_ENV], processEnv) ?? profileDefaults.memorySwap,
    pidsLimit:
      getFirstDefinedEnvValue([GENERIC_PIDS_LIMIT_ENV], processEnv) ?? profileDefaults.pidsLimit,
    timeoutSeconds:
      getFirstDefinedEnvValue([GENERIC_TIMEOUT_ENV], processEnv) ?? profileDefaults.timeoutSeconds,
    workers: getFirstDefinedEnvValue([GENERIC_WORKERS_ENV], processEnv) ?? profileDefaults.workers,
  };
}

/** One resource-limit difference between two compared container profiles. */
export interface PlaywrightContainerProfileDifference {
  key: PlaywrightContainerLimitKey;
  label: string;
  left: string;
  right: string;
}

/**
 * Compare two resolved Playwright container profiles using the canonical
 * comparable fields owned by this module.
 * @param left Active Playwright container profile.
 * @param right Target Playwright container profile.
 * @returns Structured profile differences with printable labels.
 */
export function comparePlaywrightContainerProfiles(
  left: PlaywrightContainerProfile,
  right: PlaywrightContainerProfile,
): PlaywrightContainerProfileDifference[] {
  const differences: PlaywrightContainerProfileDifference[] = [];

  for (const { key, label } of PLAYWRIGHT_CONTAINER_PROFILE_KEYS) {
    if (left[key] === right[key]) {
      continue;
    }

    differences.push({
      key,
      label,
      left: left[key],
      right: right[key],
    });
  }

  return differences;
}

interface PlaywrightContainerDiagnosticInput {
  config: string;
  label: string;
  resourceLimits: PlaywrightContainerProfile;
  signal: NodeJS.Signals | null;
  status: number;
}

function printPlaywrightContainerFailureDiagnostic({
  config,
  label,
  resourceLimits,
  signal,
  status,
}: PlaywrightContainerDiagnosticInput): void {
  console.error('Playwright container command failed.');
  console.error(`label: ${label}`);
  console.error(`profile: ${resourceLimits.name}`);
  console.error(`operation: Playwright tests in a Podman container`);
  if (signal) {
    console.error(`signal: ${signal}`);
  } else {
    console.error(`exit status: ${status}`);
  }
  console.error(`config: ${config}`);
  console.error('resource limits:');

  for (const limit of PLAYWRIGHT_CONTAINER_LIMITS) {
    const limitLabel = limit.label ?? limit.key;
    console.error(`  ${limitLabel}: ${resourceLimits[limit.key]}  override: ${limit.envName}`);
  }

  console.error(
    'If Podman reports an unsupported resource option, rerun with the matching override or adjust config/tooling.json.',
  );
  console.error('Raw Podman output is printed above.');
}

interface PlaywrightContainerProfilePrintInput {
  config: string;
  label: string;
  resourceLimits: PlaywrightContainerProfile;
}

function printPlaywrightContainerProfile({
  config,
  label,
  resourceLimits,
}: PlaywrightContainerProfilePrintInput): void {
  console.log('Playwright container limits:');
  console.log(`label: ${label}`);
  console.log(`config: ${config}`);
  console.log(`profile: ${resourceLimits.name}`);

  for (const limit of PLAYWRIGHT_CONTAINER_LIMITS) {
    const limitLabel = limit.label ?? limit.key;
    console.log(`  ${limitLabel}: ${resourceLimits[limit.key]}  override: ${limit.envName}`);
  }
}

function getVolumeLabelSuffix(volumeLabelEnvAliases: readonly string[]): string {
  const configured = getFirstDefinedEnvValue(
    [...volumeLabelEnvAliases, GENERIC_VOLUME_LABEL_ENV],
    process.env,
  );

  if (configured === 'none') {
    return '';
  }

  if (configured === 'shared') {
    return ':z';
  }

  if (configured === 'private') {
    return ':Z';
  }

  return shouldUseSelinuxRelabel() ? ':Z' : '';
}

function shouldUseSelinuxRelabel(): boolean {
  if (isWsl()) {
    return false;
  }

  return existsSync('/sys/fs/selinux/enforce');
}

function isWsl(): boolean {
  return Boolean(process.env.WSL_DISTRO_NAME) || release().toLowerCase().includes('microsoft');
}

function getFirstDefinedEnvValue(
  names: readonly string[],
  processEnv: NodeJS.ProcessEnv,
): string | undefined {
  for (const name of names) {
    const value = processEnv[name];

    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}
