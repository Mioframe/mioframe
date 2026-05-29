import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { release } from 'node:os';
import { join } from 'node:path';

const CONTAINER_WORKDIR = '/work';
const GENERIC_IMAGE_ENV = 'PLAYWRIGHT_CONTAINER_IMAGE';
const GENERIC_PODMAN_USERNS_ENV = 'PLAYWRIGHT_CONTAINER_PODMAN_USERNS';
const GENERIC_VOLUME_LABEL_ENV = 'PLAYWRIGHT_CONTAINER_VOLUME_LABEL';

export function runPlaywrightInContainer({
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

  for (const [key, value] of Object.entries(extraEnv)) {
    podmanArgs.push('--env', `${key}=${value}`);
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
}

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
