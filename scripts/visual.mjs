import { fileURLToPath } from 'node:url';

import { parseVisualMode, runPlaywrightInContainer } from './playwrightContainer.ts';

/**
 * Builds the explicit env allowlist forwarded into the Playwright container:
 * the fixed container marker, plus `STORYBOOK_STATIC_SKIP_BUILD` forwarded only when the
 * parent process received exactly `'1'` (set by `scripts/verify.ts` once a prior
 * `storybook-build` check has already passed in the same run).
 * @param env Source environment, e.g. `process.env`.
 * @returns The container's explicit extra env.
 */
export function buildContainerExtraEnv(env) {
  return {
    PLAYWRIGHT_VISUAL_CONTAINER: '1',
    ...(env.STORYBOOK_STATIC_SKIP_BUILD === '1' ? { STORYBOOK_STATIC_SKIP_BUILD: '1' } : {}),
  };
}

async function main() {
  const { error, passthroughArgs, updateSnapshots } = parseVisualMode(process.argv.slice(2));

  if (error) {
    console.error(error);
    process.exit(1);
  }

  try {
    await runPlaywrightInContainer({
      label: updateSnapshots ? 'visual-update' : 'visual',
      config: 'playwright.visual.config.ts',
      extraArgs: passthroughArgs,
      extraEnv: buildContainerExtraEnv(process.env),
      imageEnvAliases: ['PLAYWRIGHT_VISUAL_IMAGE'],
      podmanUsernsEnvAliases: ['PLAYWRIGHT_VISUAL_PODMAN_USERNS'],
      volumeLabelEnvAliases: ['PLAYWRIGHT_VISUAL_VOLUME_LABEL'],
      missingPodmanMessage:
        'Podman is required for visual regression tests.\nInstall Podman and rerun `pnpm test:visual` or `pnpm test:visual:update`.',
      missingMetadataMessage:
        'Installed Playwright metadata is missing or invalid at `node_modules/@playwright/test/package.json`.\nRun `pnpm install` before visual regression tests.',
      missingBinaryMessage:
        'Local Playwright binary is missing at `node_modules/.bin/playwright`.\nRun `pnpm install` before visual regression tests.',
      podmanFailureMessage:
        'Podman is required for visual regression tests, but `podman --version` failed.',
      updateSnapshots,
    });
  } catch (runError) {
    console.error(runError instanceof Error ? runError.message : String(runError));
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
