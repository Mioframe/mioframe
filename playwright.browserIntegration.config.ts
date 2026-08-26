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

// Target browser-integration discovery: colocated
// `src/**/*.browser-integration.spec.ts` verifies an isolated browser/runtime
// contract of a concrete module against a real running application build,
// without exercising a complete product flow. This is a generic
// Chromium-only execution path for ordinary (non-managed-update)
// browser-integration specs. The managed-update/artifact corpus under
// `src/shared/service/appUpdate/` requires playwright.release.config.ts's
// fresh-container, built-artifact, and cross-engine execution instead (see
// docs/testing/verify-redesign-pass-c-implementation.md's "Managed-update
// execution semantics"), so this generic config structurally excludes it —
// bare `pnpm test:browser-integration` must never be able to collect the
// appUpdate special corpus (see
// docs/testing/verify-redesign-final-review-correction.md's "Decision 4").
export default defineConfig({
  testDir: '.',
  testMatch: ['src/**/*.browser-integration.spec.ts'],
  testIgnore: ['src/shared/service/appUpdate/*.browser-integration.spec.ts'],
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
