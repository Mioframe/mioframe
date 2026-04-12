import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const host = '127.0.0.1';
const defaultBaseURL = `https://${host}:${port}`;
const externalBaseURL = process.env.PLAYWRIGHT_EXTERNAL_BASE_URL;
const baseURL = externalBaseURL ?? defaultBaseURL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
  },
  webServer: externalBaseURL
    ? undefined
    : {
        command: `pnpm build && pnpm exec vite preview --host ${host} --strictPort --port ${port}`,
        url: defaultBaseURL,
        reuseExistingServer: true,
        timeout: 240_000,
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
