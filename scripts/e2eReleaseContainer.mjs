import { runPlaywrightInContainer } from './playwrightContainer.mjs';

const argv = process.argv.slice(2);
const labelFlagIndex = argv.indexOf('--label');
const label = labelFlagIndex !== -1 ? argv[labelFlagIndex + 1] : 'release';
const extraArgs =
  labelFlagIndex === -1
    ? argv
    : [...argv.slice(0, labelFlagIndex), ...argv.slice(labelFlagIndex + 2)];
// Forwarded into the container so the release Playwright webServer's
// buildArtifact call can reuse a `dist/` already built by an earlier
// `pnpm verify:release` `build` check instead of rebuilding (see
// scripts/verify.mjs and scripts/release/buildArtifact.mjs). The container
// only receives env vars explicitly listed here, not the full host env.
const extraEnv =
  process.env.RELEASE_ARTIFACT_SKIP_BUILD === '1' ? { RELEASE_ARTIFACT_SKIP_BUILD: '1' } : {};
if (label === 'release-smoke') extraEnv.MIOFRAME_MANAGED_STABLE_FIXTURE = '1';

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
