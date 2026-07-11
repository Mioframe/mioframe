import { runPlaywrightInContainer } from './playwrightContainer.mjs';

try {
  await runPlaywrightInContainer({
    label: 'storybook-behavior',
    config: 'playwright.storybook.config.ts',
    extraArgs: process.argv.slice(2),
    extraEnv: {
      PLAYWRIGHT_STORYBOOK_BEHAVIOR_CONTAINER: '1',
    },
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
