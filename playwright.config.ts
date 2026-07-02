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

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['visual/**', 'release/**'],
  // Tests share origin-bound OPFS state, so file-level parallelism is intentionally disabled.
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
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
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
    },
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        channel: 'chromium',
      },
    },
  ],
});
