import { fileURLToPath } from 'node:url';

import { runPlaywrightInContainer } from './playwrightContainer.ts';

/**
 * Builds the explicit env allowlist forwarded into the Playwright container:
 * the fixed container marker, plus `STORYBOOK_STATIC_SKIP_BUILD` forwarded only when the
 * parent process received exactly `'1'`. Automatic local verification supplies it after a
 * successful prior `storybook-build` in the same invocation. GitHub CI never supplies it:
 * this lane runs as a self-contained job there and always builds its own Storybook when
 * selected (see `.github/workflows/verify.yml`).
 * @param env Source environment, e.g. `process.env`.
 * @returns The container's explicit extra env.
 */
export function buildContainerExtraEnv(env) {
  return {
    PLAYWRIGHT_STORYBOOK_BEHAVIOR_CONTAINER: '1',
    ...(env.STORYBOOK_STATIC_SKIP_BUILD === '1' ? { STORYBOOK_STATIC_SKIP_BUILD: '1' } : {}),
  };
}

async function main() {
  try {
    await runPlaywrightInContainer({
      label: 'storybook-behavior',
      config: 'playwright.storybook.config.ts',
      extraArgs: process.argv.slice(2),
      extraEnv: buildContainerExtraEnv(process.env),
      imageEnvAliases: ['PLAYWRIGHT_STORYBOOK_BEHAVIOR_IMAGE'],
      podmanUsernsEnvAliases: ['PLAYWRIGHT_STORYBOOK_BEHAVIOR_PODMAN_USERNS'],
      volumeLabelEnvAliases: ['PLAYWRIGHT_STORYBOOK_BEHAVIOR_VOLUME_LABEL'],
      missingPodmanMessage:
        'Podman is required for Storybook behavior tests.\nInstall Podman and rerun `pnpm test:storybook-behavior`.',
      missingMetadataMessage:
        'Installed Playwright metadata is missing or invalid at `node_modules/@playwright/test/package.json`.\nRun `pnpm install` before Storybook behavior tests.',
      missingBinaryMessage:
        'Local Playwright binary is missing at `node_modules/.bin/playwright`.\nRun `pnpm install` before Storybook behavior tests.',
      podmanFailureMessage:
        'Podman is required for Storybook behavior tests, but `podman --version` failed.',
    });
  } catch (runError) {
    console.error(runError instanceof Error ? runError.message : String(runError));
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
