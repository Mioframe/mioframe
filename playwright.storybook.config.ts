import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.storybook.testPreview.port;
const storybookStaticDir = toolingConfig.storybook.staticDir;
const storybookURL = `http://${host}:${port}`;
const viteBin = './node_modules/.bin/vite';

// Narrow Firefox capability gate: `docs/database-virtualization-capability-preflight.md`
// requires Firefox proof only for the two virtualization capability specs (Firefox dynamic
// table-row measurement is a confirmed risk), not the whole Storybook behavior suite.
const VIRTUALIZATION_CAPABILITY_SPECS = [
  'src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts',
  'src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts',
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
      testMatch: ['tests/e2e/storybook/**/*.spec.ts', 'src/**/*.browser.spec.ts'],
      use: { ...devices['Desktop Chrome'], ...sharedUse, channel: 'chromium' },
    },
    {
      name: 'firefox-virtualization-capability',
      testMatch: VIRTUALIZATION_CAPABILITY_SPECS,
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
