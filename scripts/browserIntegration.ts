import { runPlaywrightInContainer } from './playwrightContainer.ts';

try {
  await runPlaywrightInContainer({
    label: 'browser-integration-local',
    config: 'playwright.browserIntegration.config.ts',
    extraArgs: process.argv.slice(2),
    missingPodmanMessage:
      'Podman is required for Playwright container browser-integration tests.\nInstall Podman and rerun `pnpm test:browser-integration`.',
    missingMetadataMessage:
      'Installed Playwright metadata is missing or invalid at `node_modules/@playwright/test/package.json`.\nRun `pnpm install` before Playwright container browser-integration tests.',
    missingBinaryMessage:
      'Local Playwright binary is missing at `node_modules/.bin/playwright`.\nRun `pnpm install` before Playwright container browser-integration tests.',
    podmanFailureMessage:
      'Podman is required for Playwright container browser-integration tests, but `podman --version` failed.',
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
