import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.release.artifactServer.port;
const basePath = toolingConfig.release.basePath;
const releaseBaseURL = `http://${host}:${port}${basePath}`;

// Reused by tests/e2e/helpers.ts's launchApp(), which reads this env var
// before falling back to the dev-server default. Setting it here (rather
// than duplicating helpers) lets release specs reuse the same user-facing
// helpers as tests/e2e/*.spec.ts, pointed at the production artifact server
// this config starts below.
process.env.PLAYWRIGHT_EXTERNAL_BASE_URL = releaseBaseURL;

export default defineConfig({
  testDir: './tests/e2e/release',
  // Release specs build a fresh production artifact and share its origin-bound
  // storage, so file-level parallelism is intentionally disabled (see playwright.config.ts).
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-release' }]]
    : 'list',
  use: {
    baseURL: releaseBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: [
      `node scripts/release/buildArtifact.mjs --base ${basePath}`,
      `node scripts/release/artifactServer.mjs --base ${basePath} --host ${host} --port ${port}`,
    ].join(' && '),
    url: releaseBaseURL,
    env: {
      ...process.env,
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
    stdout: 'pipe',
    timeout: toolingConfig.playwright.webServerTimeoutMs,
  },
  workers: process.env.CI ? 1 : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
  ],
});
