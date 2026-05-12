import { defineConfig, devices } from '@playwright/test';

const port = 6007;
const host = '127.0.0.1';
const storybookURL = `http://${host}:${port}`;

export default defineConfig({
  testDir: './tests/e2e/visual',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  workers: 1,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chromium',
    baseURL: storybookURL,
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  webServer: {
    command:
      'pnpm storybook:build && ' +
      'pnpm exec vite preview ' +
      '--config .storybook/vite.preview.config.ts ' +
      `--host ${host} --port ${port} --strictPort --outDir storybook-static`,
    url: storybookURL,
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
