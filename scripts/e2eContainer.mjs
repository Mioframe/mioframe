import { runPlaywrightInContainer } from './playwrightContainer.mjs';

try {
  await runPlaywrightInContainer({
    label: 'e2e',
    config: 'playwright.config.ts',
    extraArgs: process.argv.slice(2),
    missingPodmanMessage:
      'Podman is required for Playwright container e2e tests.\nInstall Podman and rerun `pnpm e2e:container`.',
    missingMetadataMessage:
      'Installed Playwright metadata is missing or invalid at `node_modules/@playwright/test/package.json`.\nRun `pnpm install` before Playwright container e2e tests.',
    missingBinaryMessage:
      'Local Playwright binary is missing at `node_modules/.bin/playwright`.\nRun `pnpm install` before Playwright container e2e tests.',
    podmanFailureMessage:
      'Podman is required for Playwright container e2e tests, but `podman --version` failed.',
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
