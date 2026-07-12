import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.storybook.testPreview.port;
const storybookStaticDir = toolingConfig.storybook.staticDir;
const storybookURL = `http://${host}:${port}`;
const viteBin = './node_modules/.bin/vite';

export default defineConfig({
  testDir: './tests/e2e/storybook',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Retries stay enabled as diagnostics, but a flaky pass must still fail the run.
  failOnFlakyTests: !!process.env.CI,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  workers: 1,
  use: {
    baseURL: storybookURL,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
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
  webServer: {
    command:
      'node scripts/storybook.mjs build && ' +
      `${viteBin} preview ` +
      '--config .storybook/vite.preview.config.ts ' +
      `--outDir ${storybookStaticDir}`,
    url: storybookURL,
    reuseExistingServer: !process.env.CI,
    timeout: toolingConfig.playwright.webServerTimeoutMs,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
