import { parseVisualMode, runPlaywrightInContainer } from './playwrightContainer.mjs';

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
    extraEnv: {
      PLAYWRIGHT_VISUAL_CONTAINER: '1',
    },
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
