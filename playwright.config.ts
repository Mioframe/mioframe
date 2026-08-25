import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };
import {
  DESKTOP_PROJECT_NAME,
  getProjectIgnoredSpecs,
  MOBILE_PROJECT_NAME,
} from './scripts/lib/e2eProjectApplicability.ts';

// A project-level `testIgnore` replaces (does not merge with) this config's
// own top-level `testIgnore`, so this exclusion must also be repeated in
// every project's own `testIgnore` array below to actually take effect.
const PRODUCTION_ARTIFACT_TEST_IGNORE = '**/productionArtifact/**';

const host = toolingConfig.localServer.host;
const port = toolingConfig.appPreview.port;
const externalBaseURL = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;
const viteBin = './node_modules/.bin/vite';
const escapedHost = host.replaceAll('.', '\\.');
const previewURLPattern = new RegExp(
  String.raw`Local:\s+https://${escapedHost}:(?<playwright_preview_port>\d+)/`,
);

export default defineConfig({
  testDir: './tests/e2e',
  // Structural E2E ownership (see
  // docs/testing/verify-redesign-pass-d-implementation.md): ordinary target
  // E2E lives only under tests/e2e/pages/<Owner>/**/*.e2e.spec.ts or
  // tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts. productionArtifact/ specs
  // are structurally the same target E2E, but require production/managed-
  // release execution (see playwright.release.config.ts), so this ordinary
  // dev-app config must never collect them.
  testMatch: ['pages/**/*.e2e.spec.ts', 'widgets/**/*.e2e.spec.ts'],
  testIgnore: [PRODUCTION_ARTIFACT_TEST_IGNORE],
  // Tests share origin-bound OPFS state, so file-level parallelism is intentionally disabled.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Retries stay enabled as diagnostics, but a flaky pass must still fail the run.
  failOnFlakyTests: !!process.env.CI,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: externalBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: `${viteBin} build && ${viteBin} preview --host ${host} --port ${port}`,
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
          VITE_DISABLE_PWA: '1',
        },
        ignoreHTTPSErrors: true,
        stdout: 'pipe',
        timeout: toolingConfig.playwright.webServerTimeoutMs,
        wait: {
          stdout: previewURLPattern,
        },
      },
  workers: process.env.CI ? 1 : undefined,
  projects: [
    {
      name: DESKTOP_PROJECT_NAME,
      testIgnore: [
        PRODUCTION_ARTIFACT_TEST_IGNORE,
        ...getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME),
      ],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
    {
      name: MOBILE_PROJECT_NAME,
      testIgnore: [PRODUCTION_ARTIFACT_TEST_IGNORE, ...getProjectIgnoredSpecs(MOBILE_PROJECT_NAME)],
      use: {
        ...devices['Pixel 5'],
        channel: 'chromium',
      },
    },
  ],
});
