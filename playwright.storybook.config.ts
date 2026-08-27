import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.storybook.testPreview.port;
const storybookStaticDir = toolingConfig.storybook.staticDir;
const storybookURL = `http://${host}:${port}`;
const viteBin = './node_modules/.bin/vite';

// Firefox is required only for the database native-table virtualization capability because dynamic
// table-row measurement is the confirmed engine-specific risk.
const DATABASE_VIRTUALIZATION_CAPABILITY_SPECS = [
  'src/entities/databaseData/DatabaseVirtualizationCapability.behavior.spec.ts',
];

const sharedUse = {
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
} as const;

export default defineConfig({
  testDir: '.',
  // Owner-local behavior discovery (see docs/testing/architecture.md):
  // `*.behavior.spec.ts` is colocated with its truthful UI owner under
  // `src/`, plus Storybook-infrastructure owners such as the router harness
  // under `.storybook/`. The legacy `*.browser.spec.ts` suffix and the
  // central `tests/e2e/storybook/**` spec location have no remaining
  // consumer.
  testMatch: ['src/**/*.behavior.spec.ts', '.storybook/**/*.behavior.spec.ts'],
  respectGitIgnore: true,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Retries stay enabled as diagnostics, but a flaky pass must still fail the run.
  failOnFlakyTests: !!process.env.CI,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  workers: 1,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], ...sharedUse, channel: 'chromium' },
    },
    {
      name: 'firefox-virtualization-capability',
      testMatch: DATABASE_VIRTUALIZATION_CAPABILITY_SPECS,
      use: { ...devices['Desktop Firefox'], ...sharedUse },
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
