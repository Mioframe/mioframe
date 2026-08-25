import { defineConfig, devices } from '@playwright/test';
import toolingConfig from './config/tooling.json' with { type: 'json' };

const host = toolingConfig.localServer.host;
const port = toolingConfig.release.artifactServer.port;
const basePath = toolingConfig.release.basePath;
const releaseBaseURL = `http://${host}:${port}${basePath}`;

// Reused by tests/e2e/helpers.ts's launchApp(), which reads this env var
// before falling back to the dev-server default. Setting it here (rather
// than duplicating helpers) lets release specs reuse the same user-facing
// helpers as tests/e2e/*.spec.ts, pointed at the production artifact server
// this config starts below.
process.env.PLAYWRIGHT_EXTERNAL_BASE_URL = releaseBaseURL;

// Set by scripts/release/runManagedReleaseDataCompatibilityProof.mjs for the
// managed-release publication preflight's staged compatibility run (see
// scripts/pages/lib/managedCompatibilityPreflight.mjs). That run serves its
// own staged Pages tree directly
// (managedReleaseDataCompatibility.e2e.spec.ts's startManagedArtifactServer)
// and must never trigger this config's own
// webServer, which runs a real `vite build` into the repository's real
// `dist/` — the candidate artifact this preflight exists to leave
// byte-for-byte unchanged. Every other release Playwright run (no
// MANAGED_COMPAT_WORK_DIR set) keeps building and serving its own artifact
// exactly as before.
const isManagedCompatibilityRun = process.env.MANAGED_COMPAT_WORK_DIR !== undefined;

export default defineConfig({
  testDir: '.',
  // Target productionArtifact/ E2E (see
  // docs/testing/verify-redesign-pass-d-implementation.md): structurally the
  // same pages/<Owner>/widgets/<Owner> target E2E as playwright.config.ts,
  // but requiring production/managed-release execution, so they stay
  // discovered here instead. The managed-update browser-integration corpus
  // lives at its truthful owner under src/shared/service/appUpdate (see
  // docs/testing/verify-redesign-pass-c-implementation.md). Both trees run
  // through this same fresh-container Playwright config/execution
  // infrastructure, which needs their built-artifact/cross-engine semantics.
  testMatch: [
    'tests/e2e/pages/**/productionArtifact/*.e2e.spec.ts',
    'tests/e2e/widgets/**/productionArtifact/*.e2e.spec.ts',
    'src/shared/service/appUpdate/*.browser-integration.spec.ts',
  ],
  // Release specs build a fresh production artifact and share its origin-bound
  // storage, so file-level parallelism is intentionally disabled (see playwright.config.ts).
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Retries collect diagnostics, but a flaky release proof must still fail the gate.
  failOnFlakyTests: !!process.env.CI,
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report-release' }]]
    : 'list',
  use: {
    baseURL: releaseBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: isManagedCompatibilityRun
    ? undefined
    : {
        command: [
          `node scripts/release/buildArtifact.mjs --base ${basePath}`,
          `node scripts/release/artifactServer.mjs --base ${basePath} --host ${host} --port ${port}`,
        ].join(' && '),
        url: releaseBaseURL,
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
        stdout: 'pipe',
        timeout: toolingConfig.playwright.webServerTimeoutMs,
      },
  workers: process.env.CI ? 1 : undefined,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
      },
      // The complete managed-update corpus is Chromium's authoritative
      // proof; the cross-engine spec below is Firefox/WebKit-only narrow
      // smoke and must not duplicate onto Chromium too.
      testIgnore: /managedUpdatesCrossEngineLifecycle\.browser-integration\.spec\.ts/,
    },
    // Narrow cross-engine lifecycle smoke only: these two projects are
    // scoped to a single spec so the complete managed-update corpus stays
    // Chromium-only, per the managed pinned application updates feature.
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /managedUpdatesCrossEngineLifecycle\.browser-integration\.spec\.ts/,
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /managedUpdatesCrossEngineLifecycle\.browser-integration\.spec\.ts/,
    },
  ],
});
