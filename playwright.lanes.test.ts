import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import appConfig from './playwright.config';
import releaseConfig from './playwright.release.config';
import storybookBehaviorConfig from './playwright.storybook.config';
import visualConfig from './playwright.visual.config';
import {
  DESKTOP_PROJECT_NAME,
  getProjectIgnoredSpecs,
  MOBILE_PROJECT_NAME,
} from './scripts/lib/e2eProjectApplicability.ts';

describe('Playwright lane discovery stays disjoint', () => {
  it('gives application e2e and release lanes their own physical testDir', () => {
    expect(appConfig.testDir).toBe('./tests/e2e');
    expect(releaseConfig.testDir).toBe('./tests/e2e/release');
  });

  it('discovers storybook behavior specs from repo root via mixed legacy and colocated testMatch', () => {
    expect(storybookBehaviorConfig.testDir).toBe('.');
    expect(storybookBehaviorConfig.testMatch).toEqual([
      'tests/e2e/storybook/**/*.spec.ts',
      'src/**/*.browser.spec.ts',
    ]);
  });

  it('discovers visual specs from repo root via mixed legacy and colocated testMatch', () => {
    expect(visualConfig.testDir).toBe('.');
    expect(visualConfig.testMatch).toEqual([
      'tests/e2e/visual/**/*.spec.ts',
      'src/**/*.visual.spec.ts',
    ]);
  });

  it('keeps root-scanning lanes from collecting tests out of ignored nested/local workspaces', () => {
    expect(storybookBehaviorConfig.respectGitIgnore).toBe(true);
    expect(visualConfig.respectGitIgnore).toBe(true);
  });

  it('keeps both application e2e projects testIgnore applicability-only, with no redundant storybook/visual/release subtree ignores', () => {
    // docs/testing/verify-app-e2e-discovery-correction.md: once the top-level
    // root-only testMatch owns the application/Storybook/visual/release lane
    // boundary, projects[*].testIgnore must remain solely for desktop/mobile
    // applicability exclusions -- it must not regain a second physical
    // lane-boundary mechanism (a SHARED_TEST_IGNORE-shaped subtree list).
    // Resolve each real project by name rather than duplicating
    // E2E_PROJECT_APPLICABILITY's own registry contract, which is
    // e2eProjectApplicability.test.ts's job.
    const desktopProject = appConfig.projects?.find(
      (project) => project.name === DESKTOP_PROJECT_NAME,
    );
    const mobileProject = appConfig.projects?.find(
      (project) => project.name === MOBILE_PROJECT_NAME,
    );

    expect(desktopProject?.testIgnore).toEqual(getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME));
    expect(mobileProject?.testIgnore).toEqual(getProjectIgnoredSpecs(MOBILE_PROJECT_NAME));
  });

  it('does not give the storybook behavior, visual, or release configs a testIgnore of their own subtree', () => {
    expect(storybookBehaviorConfig.testIgnore).toBeUndefined();
    expect(visualConfig.testIgnore).toBeUndefined();
    expect(releaseConfig.testIgnore).toBeUndefined();
  });

  it('finds every existing spec file in exactly one of the four logical lanes', () => {
    const applicationSpecs = listFiles('tests/e2e', '.spec.ts', { recursive: false });
    const storybookLegacySpecs = listFiles('tests/e2e/storybook', '.spec.ts');
    const storybookColocatedSpecs = listFiles('src', '.browser.spec.ts');
    const visualLegacySpecs = listFiles('tests/e2e/visual', '.spec.ts');
    const visualColocatedSpecs = listFiles('src', '.visual.spec.ts');
    const releaseSpecs = listFiles('tests/e2e/release', '.spec.ts');

    expect(applicationSpecs.length).toBeGreaterThan(0);
    expect(storybookLegacySpecs.length).toBeGreaterThan(0);
    expect(storybookColocatedSpecs.length).toBeGreaterThan(0);
    expect(visualLegacySpecs.length).toBeGreaterThan(0);
    expect(visualColocatedSpecs.length).toBeGreaterThan(0);
    expect(releaseSpecs.length).toBeGreaterThan(0);

    // Both storybook groups are the same logical lane: legacy-central specs
    // under tests/e2e/storybook and owner-local specs colocated under src.
    const storybookSpecs = [...storybookLegacySpecs, ...storybookColocatedSpecs];
    // Both visual groups are the same logical lane: legacy-central specs
    // under tests/e2e/visual and owner-local specs colocated under src.
    const visualSpecs = [...visualLegacySpecs, ...visualColocatedSpecs];

    expect(intersection(applicationSpecs, storybookSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, visualSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, releaseSpecs)).toEqual([]);
    expect(intersection(storybookSpecs, visualSpecs)).toEqual([]);
    expect(intersection(storybookSpecs, releaseSpecs)).toEqual([]);
    expect(intersection(visualSpecs, releaseSpecs)).toEqual([]);

    const allSpecs = [...applicationSpecs, ...storybookSpecs, ...visualSpecs, ...releaseSpecs];

    expect(new Set(allSpecs).size).toBe(allSpecs.length);
  });
});

describe('real Playwright collector boundary (application config)', () => {
  // docs/testing/verify-app-e2e-discovery-correction.md: the application
  // ownership model is root-only `tests/e2e/*.spec.ts`, enforced by the real
  // `playwright.config.ts`'s top-level `testMatch: '**/tests/e2e/*.spec.ts'`.
  // This proof exercises the real installed Playwright collector against the
  // real config -- not a reimplementation of glob matching -- so it stays
  // truthful to the physical lane boundary independently of whether
  // validateE2EScenarioRegistry()/validateE2EProjectApplicability()/this
  // file's own listFiles() scan agree with each other.
  it('collects the real root app spec, but rejects nested/default-shape probes and existing reserved-lane specs', () => {
    const createdProbeFiles: string[] = [];
    let nestedProbeDir: string | undefined;
    const probeId = randomUUID();

    try {
      nestedProbeDir = fs.mkdtempSync(path.join('tests/e2e', `playwright-lanes-proof-${probeId}-`));
      const nestedProbeSpec = path.join(nestedProbeDir, 'nested.spec.ts');
      const defaultShapeProbeSpec = path.join(
        'tests/e2e',
        `playwright-lanes-proof-${probeId}.test.mjs`,
      );

      createExclusiveCollectorProbe(
        nestedProbeSpec,
        'nested probe must not be collected by the application config',
        createdProbeFiles,
      );
      createExclusiveCollectorProbe(
        defaultShapeProbeSpec,
        'default test-shape probe must not be collected by the application config',
        createdProbeFiles,
      );

      const collectorArgs = [
        'node_modules/@playwright/test/cli.js',
        'test',
        '--list',
        '--config=playwright.config.ts',
      ];
      const collectorOptions = {
        cwd: process.cwd(),
        encoding: 'utf8' as const,
        env: {
          ...process.env,
          // Any placeholder external base URL resolves appConfig's
          // webServer to undefined (see playwright.config.ts), so
          // collection stays browser/server-free.
          PLAYWRIGHT_EXTERNAL_BASE_URL: 'http://127.0.0.1:1',
        },
      };
      const result = spawnSync(process.execPath, collectorArgs, collectorOptions);

      expect(result.status).toBe(0);
      expect(result.stderr).toBe('');

      const listing = result.stdout;
      const nestedProbeListingPath = path.relative('tests/e2e', nestedProbeSpec);

      // 1. A real root application spec is collected.
      expect(listing).toContain('appSmoke.spec.ts');

      // 2 & 3. Must reject: the root-only testMatch
      // (`**/tests/e2e/*.spec.ts`) must exclude both a nested spec and a
      // root default-Playwright `*.test.*` shape from the listing.
      expect(listing).not.toContain(nestedProbeListingPath);
      expect(listing).not.toContain(path.basename(defaultShapeProbeSpec));

      // Supplying both a real root path and a nested path as Playwright CLI
      // filters narrows the real collector; it cannot make the nested path
      // bypass the configured testMatch.
      const filteredResult = spawnSync(
        process.execPath,
        [...collectorArgs, 'tests/e2e/appSmoke.spec.ts', nestedProbeSpec],
        collectorOptions,
      );

      expect(filteredResult.status).toBe(0);
      expect(filteredResult.stderr).toBe('');
      expect(filteredResult.stdout).toContain('appSmoke.spec.ts');
      expect(filteredResult.stdout).not.toContain(nestedProbeListingPath);

      // 4, 5, 6. Existing nested Storybook/visual/release specs must never
      // be collected by the application config either.
      expect(listing).not.toContain('storybook/colorOwnership.spec.ts');
      expect(listing).not.toContain('visual/shared-ui.spec.ts');
      expect(listing).not.toContain('release/productionArtifactSmoke.spec.ts');
    } finally {
      for (const probeFile of [...createdProbeFiles].reverse()) {
        fs.unlinkSync(probeFile);
      }

      if (nestedProbeDir) {
        fs.rmdirSync(nestedProbeDir);
      }
    }
  });
});

function createExclusiveCollectorProbe(
  filePath: string,
  testName: string,
  createdProbeFiles: string[],
): void {
  const fileDescriptor = fs.openSync(filePath, 'wx');
  createdProbeFiles.push(filePath);

  try {
    fs.writeFileSync(
      fileDescriptor,
      `import { test } from '@playwright/test';\n\ntest('${testName}', () => {});\n`,
    );
  } finally {
    fs.closeSync(fileDescriptor);
  }
}

function listFiles(
  dir: string,
  suffix: string,
  { recursive = true }: { recursive?: boolean } = {},
) {
  return fs
    .readdirSync(dir, { withFileTypes: true, recursive })
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => `${entry.parentPath}/${entry.name}`);
}

function intersection(a: readonly string[], b: readonly string[]) {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}
