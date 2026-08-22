import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };
import { APP_E2E_SPEC_DIR, APP_E2E_TEST_MATCH } from './scripts/lib/appE2EPaths.ts';
import {
  DESKTOP_PROJECT_NAME,
  getProjectIgnoredSpecs,
  MOBILE_PROJECT_NAME,
} from './scripts/lib/e2eProjectApplicability.ts';

const host = toolingConfig.localServer.host;
const port = toolingConfig.appPreview.port;
const externalBaseURL = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;
const viteBin = './node_modules/.bin/vite';
const escapedHost = host.replaceAll('.', '\\.');
const previewURLPattern = new RegExp(
  String.raw`Local:\s+https://${escapedHost}:(?<playwright_preview_port>\d+)/`,
);

export default defineConfig({
  testDir: `./${APP_E2E_SPEC_DIR}`,
  // Root-only application collection: direct tests/e2e/*.spec.ts files only.
  // See docs/testing/verify-app-e2e-discovery-correction.md -- this replaces
  // the former SHARED_TEST_IGNORE subtree-exclusion mechanism as the single
  // physical lane boundary between application e2e and the Storybook,
  // visual, and release lanes.
  testMatch: APP_E2E_TEST_MATCH,
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
      testIgnore: getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME),
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
    {
      name: MOBILE_PROJECT_NAME,
      testIgnore: getProjectIgnoredSpecs(MOBILE_PROJECT_NAME),
      use: {
        ...devices['Pixel 5'],
        channel: 'chromium',
      },
    },
  ],
});
