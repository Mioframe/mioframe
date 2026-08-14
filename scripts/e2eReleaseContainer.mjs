import { fileURLToPath } from 'node:url';

import { runPlaywrightInContainer } from './playwrightContainer.ts';

/** The complete staged managed-release data-compatibility proof env set (see `scripts/release/runManagedReleaseDataCompatibilityProof.mjs`). */
const MANAGED_COMPAT_ENV_KEYS = [
  'MANAGED_COMPAT_WORK_DIR',
  'MANAGED_COMPAT_CHANNEL',
  'MANAGED_COMPAT_PREVIOUS_RELEASES',
  'MANAGED_COMPAT_CANDIDATE_RELEASE',
];

/**
 * Builds the explicit env allowlist forwarded into the Playwright container:
 * `RELEASE_ARTIFACT_SKIP_BUILD` when set to `'1'`, and the complete
 * `MANAGED_COMPAT_*` staged-compatibility-proof set when
 * `MANAGED_COMPAT_WORK_DIR` is present. The container only receives env vars
 * explicitly listed here, never the full host env.
 * @param env Source environment, e.g. `process.env`.
 * @returns The container's explicit extra env.
 */
export function buildContainerExtraEnv(env) {
  const extraEnv =
    env.RELEASE_ARTIFACT_SKIP_BUILD === '1' ? { RELEASE_ARTIFACT_SKIP_BUILD: '1' } : {};

  if (env.MANAGED_COMPAT_WORK_DIR !== undefined) {
    for (const key of MANAGED_COMPAT_ENV_KEYS) {
      extraEnv[key] = env[key];
    }
  }

  return extraEnv;
}

/**
 * Parses this script's own CLI args into the Playwright `--label` value and
 * the remaining spec/pass-through args.
 * @param argv `process.argv.slice(2)`-style raw CLI args.
 * @returns The resolved `label` and the remaining `extraArgs`.
 */
export function parseArgs(argv) {
  const labelFlagIndex = argv.indexOf('--label');
  const label = labelFlagIndex !== -1 ? argv[labelFlagIndex + 1] : 'release';
  const extraArgs =
    labelFlagIndex === -1
      ? argv
      : [...argv.slice(0, labelFlagIndex), ...argv.slice(labelFlagIndex + 2)];
  return { label, extraArgs };
}

async function main() {
  const { label, extraArgs } = parseArgs(process.argv.slice(2));
  const extraEnv = buildContainerExtraEnv(process.env);

  try {
    await runPlaywrightInContainer({
      label,
      config: 'playwright.release.config.ts',
      extraArgs,
      extraEnv,
      missingPodmanMessage:
        'Podman is required for release artifact/smoke tests.\nInstall Podman and rerun `pnpm e2e:release`.',
      missingMetadataMessage:
        'Installed Playwright metadata is missing or invalid at `node_modules/@playwright/test/package.json`.\nRun `pnpm install` before release artifact/smoke tests.',
      missingBinaryMessage:
        'Local Playwright binary is missing at `node_modules/.bin/playwright`.\nRun `pnpm install` before release artifact/smoke tests.',
      podmanFailureMessage:
        'Podman is required for release artifact/smoke tests, but `podman --version` failed.',
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
