import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.storybook.visualPreview.port;
const storybookStaticDir = toolingConfig.storybook.staticDir;
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
      'node scripts/storybook.mjs build && ' +
      'pnpm exec vite preview ' +
      '--config .storybook/vite.preview.config.ts ' +
      `--outDir ${storybookStaticDir}`,
    url: storybookURL,
    reuseExistingServer: !process.env.CI,
    timeout: toolingConfig.playwright.webServerTimeoutMs,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
