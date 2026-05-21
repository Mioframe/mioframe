import { existsSync } from 'node:fs';
import { release } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import playwrightPackageJson from '../node_modules/@playwright/test/package.json' with { type: 'json' };

const PLAYWRIGHT_VERSION = playwrightPackageJson.version;
const DEFAULT_IMAGE = `mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`;
const VOLUME_MODE = '/work';
const CONTAINER_WORKDIR = '/work';
const PODMAN_USERNS_ENV = 'PLAYWRIGHT_VISUAL_PODMAN_USERNS';
const PODMAN_IMAGE_ENV = 'PLAYWRIGHT_VISUAL_IMAGE';
const PODMAN_VOLUME_LABEL_ENV = 'PLAYWRIGHT_VISUAL_VOLUME_LABEL';

const [mode, ...passthroughArgs] = process.argv.slice(2);

if (mode !== 'test' && mode !== 'update') {
  console.error('Expected visual mode: test or update.');
  process.exit(1);
}

const podmanCheck = spawnSync('podman', ['--version'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
});

if (podmanCheck.error) {
  if (podmanCheck.error.code === 'ENOENT') {
    console.error('Podman is required for visual regression tests.');
    console.error('Install Podman and rerun `pnpm test:visual` or `pnpm test:visual:update`.');
    process.exit(1);
  }

  console.error('Failed to check Podman availability.');
  console.error(podmanCheck.error.message);
  process.exit(1);
}

if (podmanCheck.status !== 0) {
  console.error('Podman is required for visual regression tests, but `podman --version` failed.');
  if (podmanCheck.stderr.trim()) {
    console.error(podmanCheck.stderr.trim());
  }
  process.exit(podmanCheck.status ?? 1);
}

const repositoryPath = process.cwd();
const localPlaywrightBin = join(repositoryPath, 'node_modules', '.bin', 'playwright');

if (!existsSync(localPlaywrightBin)) {
  console.error('Local Playwright binary is missing at `node_modules/.bin/playwright`.');
  console.error('Run `pnpm install` before visual regression tests.');
  process.exit(1);
}

const image = process.env[PODMAN_IMAGE_ENV] || DEFAULT_IMAGE;
const podmanArgs = [
  'run',
  '--rm',
  '--init',
  '--ipc=host',
  '--workdir',
  CONTAINER_WORKDIR,
  '--env',
  'CI=1',
  '--env',
  'PLAYWRIGHT_VISUAL_CONTAINER=1',
  '--volume',
  `${repositoryPath}:${VOLUME_MODE}${getVolumeLabelSuffix()}`,
];

const usernsMode = process.env[PODMAN_USERNS_ENV] || 'keep-id';
if (usernsMode !== 'off') {
  podmanArgs.push('--userns', usernsMode);
}

podmanArgs.push(
  image,
  './node_modules/.bin/playwright',
  'test',
  '--config',
  'playwright.visual.config.ts',
);

if (mode === 'update') {
  podmanArgs.push('--update-snapshots');
}

podmanArgs.push(...passthroughArgs);

const child = spawnSync('podman', podmanArgs, {
  stdio: 'inherit',
  env: process.env,
});

if (child.error) {
  console.error('Failed to start Podman for visual regression tests.');
  console.error(child.error.message);
  process.exit(1);
}

if (child.signal) {
  process.kill(process.pid, child.signal);
}

process.exit(child.status ?? 1);

function getVolumeLabelSuffix() {
  const configured = process.env[PODMAN_VOLUME_LABEL_ENV];

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
