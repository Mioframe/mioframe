import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.appPreview.port;
const externalBaseURL = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;
const viteBin = './node_modules/.bin/vite';
const escapedHost = host.replaceAll('.', '\\.');
const previewURLPattern = new RegExp(
  String.raw`Local:\s+https://${escapedHost}:(?<playwright_preview_port>\d+)/`,
);

// Target browser-integration discovery (see
// docs/testing/verify-redesign-implementation-preflight.md's "Target suffix
// migration"): colocated `src/**/*.browser-integration.spec.ts` verifies an
// isolated browser/runtime contract of a concrete module against a real
// running application build, without exercising a complete product flow.
// No spec currently uses this suffix; Pass C migrates the managed-update
// runtime specs here from their current tests/e2e/release compatibility
// location (see playwright.release.config.ts), where they keep running
// unchanged until that move.
export default defineConfig({
  testDir: '.',
  testMatch: ['src/**/*.browser-integration.spec.ts'],
  respectGitIgnore: true,
  // Tests may share origin-bound browser storage state, so file-level
  // parallelism is intentionally disabled, matching every other Playwright
  // lane that exercises a real running application build.
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
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
  ],
});
