import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { release } from 'node:os';
import { join } from 'node:path';
import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { withExpensiveCommandLock } from './lib/commandLock.mjs';

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
const containerDefaults = toolingConfig.verification.playwrightContainer;

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
 * @returns Resolves after the Podman command exits.
 */
export async function runPlaywrightInContainer({
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
}) {
  const repositoryPath = process.cwd();

  ensurePodmanAvailable(missingPodmanMessage, podmanFailureMessage);
  ensureLocalPlaywrightBinary(repositoryPath, missingBinaryMessage);

  const image =
    getFirstDefinedEnvValue([...imageEnvAliases, GENERIC_IMAGE_ENV]) ||
    `mcr.microsoft.com/playwright:v${getInstalledPlaywrightVersion(repositoryPath, missingMetadataMessage)}-noble`;
  const run = async (lockEnv) => {
    const podmanArgs = [
      'run',
      '--rm',
      '--init',
      '--ipc=host',
      '--cpus',
      getFirstDefinedEnvValue([GENERIC_CPUS_ENV]) ?? containerDefaults.cpus,
      '--memory',
      getFirstDefinedEnvValue([GENERIC_MEMORY_ENV]) ?? containerDefaults.memory,
      '--memory-swap',
      getFirstDefinedEnvValue([GENERIC_MEMORY_SWAP_ENV]) ?? containerDefaults.memorySwap,
      '--pids-limit',
      getFirstDefinedEnvValue([GENERIC_PIDS_LIMIT_ENV]) ?? containerDefaults.pidsLimit,
      '--timeout',
      getFirstDefinedEnvValue([GENERIC_TIMEOUT_ENV]) ?? containerDefaults.timeoutSeconds,
      '--workdir',
      CONTAINER_WORKDIR,
      '--env',
      'CI=1',
    ];

    for (const [key, value] of Object.entries({ ...extraEnv, ...lockEnv })) {
      podmanArgs.push('--env', `${key}=${String(value)}`);
    }

    podmanArgs.push(
      '--volume',
      `${repositoryPath}:${CONTAINER_WORKDIR}${getVolumeLabelSuffix(volumeLabelEnvAliases)}`,
    );

    const usernsMode =
      getFirstDefinedEnvValue([...podmanUsernsEnvAliases, GENERIC_PODMAN_USERNS_ENV]) || 'keep-id';

    if (usernsMode !== 'off') {
      podmanArgs.push('--userns', usernsMode);
    }

    podmanArgs.push(image, './node_modules/.bin/playwright', 'test', '--config', config);

    if (updateSnapshots) {
      podmanArgs.push('--update-snapshots');
    }

    if (!extraArgs.some((arg) => arg === '--workers' || arg.startsWith('--workers='))) {
      podmanArgs.push(
        '--workers',
        getFirstDefinedEnvValue([GENERIC_WORKERS_ENV]) ?? containerDefaults.workers,
      );
    }

    podmanArgs.push(...extraArgs);

    const child = spawnSync('podman', podmanArgs, {
      stdio: 'inherit',
      env: process.env,
    });

    if (child.error) {
      console.error('Failed to start Podman for Playwright container tests.');
      console.error(child.error.message);
      process.exit(1);
    }

    if (child.signal) {
      process.kill(process.pid, child.signal);
    } else {
      process.exit(child.status ?? 1);
    }
  };

  await withExpensiveCommandLock(
    {
      label,
      command: `podman run playwright test --config ${config}`,
    },
    run,
  );
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
      console.error(missingPodmanMessage);
      process.exit(1);
    }

    console.error('Failed to check Podman availability.');
    console.error(podmanCheck.error.message);
    process.exit(1);
  }

  if (podmanCheck.status !== 0) {
    console.error(podmanFailureMessage);
    if (podmanCheck.stderr.trim()) {
      console.error(podmanCheck.stderr.trim());
    }
    process.exit(podmanCheck.status ?? 1);
  }
}

function ensureLocalPlaywrightBinary(repositoryPath, missingBinaryMessage) {
  const localPlaywrightBin = join(repositoryPath, 'node_modules', '.bin', 'playwright');

  if (existsSync(localPlaywrightBin)) {
    return;
  }

  console.error(missingBinaryMessage);
  process.exit(1);
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
    console.error(missingMetadataMessage);
    process.exit(1);
  }

  let packageJson;

  try {
    packageJson = JSON.parse(readFileSync(playwrightPackageJsonPath, 'utf8'));
  } catch (error) {
    console.error(missingMetadataMessage);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (typeof packageJson.version !== 'string' || packageJson.version.trim() === '') {
    console.error(missingMetadataMessage);
    process.exit(1);
  }

  return packageJson.version;
}

function getVolumeLabelSuffix(volumeLabelEnvAliases) {
  const configured = getFirstDefinedEnvValue([...volumeLabelEnvAliases, GENERIC_VOLUME_LABEL_ENV]);

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

function getFirstDefinedEnvValue(names) {
  for (const name of names) {
    const value = process.env[name];

    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}
