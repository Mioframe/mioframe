import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { release } from 'node:os';
import { join } from 'node:path';
import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { runGuardedExpensiveLocalCommand } from './lib/localCommandGuard.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { runLocalCommand } from './lib/runLocalCommand.mjs';

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
const PLAYWRIGHT_CONTAINER_LIMITS = [
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
const defaultDeps = {
  applyProcessResult,
  ensureLocalPlaywrightBinary,
  ensurePodmanAvailable,
  getInstalledPlaywrightVersion,
  runGuardedExpensiveLocalCommand,
  runLocalCommand,
  spawnSync,
};

const PLAYWRIGHT_CONTAINER_PROFILE_KEYS = PLAYWRIGHT_CONTAINER_LIMITS.map(({ key, label }) => ({
  key,
  label: label ?? key,
}));

/**
 * Run Playwright tests inside the repo's Podman wrapper with local safety limits.
 * @param options Container runner options.
 * @param [options.label] Verification label for the expensive lock.
 * @param options.config Playwright config file path inside the repo.
 * @param [options.extraArgs] Additional Playwright CLI arguments.
 * @param [options.extraEnv] Extra environment variables passed into the container.
 * @param [options.imageEnvAliases] Environment variable aliases for the container image.
 * @param [options.podmanUsernsEnvAliases] Environment variable aliases for `--userns`.
 * @param [options.volumeLabelEnvAliases] Environment variable aliases for SELinux relabel mode.
 * @param options.missingPodmanMessage Error shown when Podman is unavailable.
 * @param options.missingMetadataMessage Error shown when Playwright package metadata is unavailable.
 * @param options.missingBinaryMessage Error shown when the local Playwright binary is unavailable.
 * @param options.podmanFailureMessage Error shown when `podman --version` fails.
 * @param [options.updateSnapshots] Whether to add `--update-snapshots`.
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
  },
  deps = defaultDeps,
) {
  const repositoryPath = process.cwd();
  const result = await deps.runGuardedExpensiveLocalCommand(
    {
      label,
      command: `podman run playwright test --config ${config}`,
      run: async (lockEnv) => {
        let image;

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

        const podmanArgs = [
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
          podmanArgs.push('--env', `${key}=${String(value)}`);
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

        let child;
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

/**
 * Parse the visual runner mode from CLI arguments.
 * @param argv Raw CLI arguments after the script name.
 * @returns Parsed visual mode state.
 */
export function parseVisualMode(argv) {
  const [mode, ...passthroughArgs] = argv;

  if (mode !== 'test' && mode !== 'update') {
    return {
      error: 'Expected visual mode: test or update.',
      passthroughArgs: [],
      updateSnapshots: false,
    };
  }

  return {
    passthroughArgs,
    updateSnapshots: mode === 'update',
  };
}

function ensurePodmanAvailable(missingPodmanMessage, podmanFailureMessage) {
  const podmanCheck = spawnSync('podman', ['--version'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (podmanCheck.error) {
    if (podmanCheck.error.code === 'ENOENT') {
      throw new Error(missingPodmanMessage);
    }

    throw new Error(`Failed to check Podman availability.\n${podmanCheck.error.message}`);
  }

  if (podmanCheck.status !== 0) {
    const extra = podmanCheck.stderr.trim();
    throw new Error(extra ? `${podmanFailureMessage}\n${extra}` : podmanFailureMessage);
  }
}

function ensureLocalPlaywrightBinary(repositoryPath, missingBinaryMessage) {
  const localPlaywrightBin = join(repositoryPath, 'node_modules', '.bin', 'playwright');

  if (!existsSync(localPlaywrightBin)) {
    throw new Error(missingBinaryMessage);
  }
}

function getInstalledPlaywrightVersion(repositoryRoot, missingMetadataMessage) {
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

  let packageJson;

  try {
    packageJson = JSON.parse(readFileSync(playwrightPackageJsonPath, 'utf8'));
  } catch (parseError) {
    throw new Error(
      `${missingMetadataMessage}\n${parseError instanceof Error ? parseError.message : String(parseError)}`,
      { cause: parseError },
    );
  }

  if (typeof packageJson.version !== 'string' || packageJson.version.trim() === '') {
    throw new Error(missingMetadataMessage);
  }

  return packageJson.version;
}

/**
 * Resolve the effective Playwright container profile for the current environment.
 * @param [processEnv] Environment object used for profile and override resolution.
 * @returns Effective profile name and resource limits.
 */
export function resolvePlaywrightContainerProfile(processEnv = process.env) {
  const requestedProfile = processEnv[VERIFY_PROFILE_ENV]?.trim();
  let profileName;

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

  return Object.fromEntries([
    ['name', profileName],
    ['source', source],
    ...PLAYWRIGHT_CONTAINER_LIMITS.map(({ envName, key }) => [
      key,
      getFirstDefinedEnvValue([envName], processEnv) ?? String(profileDefaults[key]),
    ]),
  ]);
}

/**
 * Compare two resolved Playwright container profiles using the canonical
 * comparable fields owned by this module.
 * @param left Active Playwright container profile.
 * @param right Target Playwright container profile.
 * @returns Structured profile differences with printable labels.
 */
export function comparePlaywrightContainerProfiles(left, right) {
  const differences = [];

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

function printPlaywrightContainerFailureDiagnostic({
  config,
  label,
  resourceLimits,
  signal,
  status,
}) {
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

function printPlaywrightContainerProfile({ config, label, resourceLimits }) {
  console.log('Playwright container limits:');
  console.log(`label: ${label}`);
  console.log(`config: ${config}`);
  console.log(`profile: ${resourceLimits.name}`);

  for (const limit of PLAYWRIGHT_CONTAINER_LIMITS) {
    const limitLabel = limit.label ?? limit.key;
    console.log(`  ${limitLabel}: ${resourceLimits[limit.key]}  override: ${limit.envName}`);
  }
}

function getVolumeLabelSuffix(volumeLabelEnvAliases) {
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

function shouldUseSelinuxRelabel() {
  if (isWsl()) {
    return false;
  }

  return existsSync('/sys/fs/selinux/enforce');
}

function isWsl() {
  return Boolean(process.env.WSL_DISTRO_NAME) || release().toLowerCase().includes('microsoft');
}

function getFirstDefinedEnvValue(names, processEnv) {
  for (const name of names) {
    const value = processEnv[name];

    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}
