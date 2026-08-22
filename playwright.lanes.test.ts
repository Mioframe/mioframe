import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import appConfig from './playwright.config';
import releaseConfig from './playwright.release.config';
import storybookBehaviorConfig from './playwright.storybook.config';
import visualConfig from './playwright.visual.config';
import {
  DESKTOP_PROJECT_NAME,
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

  it('makes both application e2e projects ignore the storybook, visual, and release subtrees', () => {
    // The shared subtree ignores live on projects[*].testIgnore, not a
    // top-level appConfig.testIgnore (playwright.config.ts sets testIgnore
    // per-project, mixing SHARED_TEST_IGNORE with each project's own
    // getProjectIgnoredSpecs(...) applicability ignores) -- resolve each real
    // project by name rather than duplicating E2E_PROJECT_APPLICABILITY's own
    // registry contract, which is e2eProjectApplicability.test.ts's job.
    const desktopProject = appConfig.projects?.find(
      (project) => project.name === DESKTOP_PROJECT_NAME,
    );
    const mobileProject = appConfig.projects?.find(
      (project) => project.name === MOBILE_PROJECT_NAME,
    );

    expect(desktopProject?.testIgnore).toEqual(
      expect.arrayContaining(['storybook/**', 'visual/**', 'release/**']),
    );
    expect(mobileProject?.testIgnore).toEqual(
      expect.arrayContaining(['storybook/**', 'visual/**', 'release/**']),
    );
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
