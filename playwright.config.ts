import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const host = '127.0.0.1';
const externalBaseURL = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;
const escapedHost = host.replaceAll('.', '\\.');
const previewURLPattern = new RegExp(
  String.raw`Local:\s+https://${escapedHost}:(?<playwright_preview_port>\d+)/`,
);

export default defineConfig({
  testDir: './tests/e2e',
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
    serviceWorkers: 'block',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: `pnpm build && pnpm exec vite preview --host ${host} --port ${port}`,
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
        ignoreHTTPSErrors: true,
        stdout: 'pipe',
        timeout: 240_000,
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
