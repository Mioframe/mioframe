import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import appConfig from './playwright.config';
import releaseConfig from './playwright.release.config';
import storybookBehaviorConfig from './playwright.storybook.config';
import visualConfig from './playwright.visual.config';

describe('Playwright lane discovery stays disjoint', () => {
  it('gives application e2e, visual, and release lanes their own physical testDir', () => {
    expect(appConfig.testDir).toBe('./tests/e2e');
    expect(visualConfig.testDir).toBe('./tests/e2e/visual');
    expect(releaseConfig.testDir).toBe('./tests/e2e/release');
  });

  it('discovers storybook behavior specs from repo root via mixed legacy and colocated testMatch', () => {
    expect(storybookBehaviorConfig.testDir).toBe('.');
    expect(storybookBehaviorConfig.testMatch).toEqual([
      'tests/e2e/storybook/**/*.spec.ts',
      'src/**/*.browser.spec.ts',
    ]);
  });

  it('makes application e2e ignore the storybook, visual, and release subtrees', () => {
    expect(appConfig.testIgnore).toEqual(
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
    const visualSpecs = listFiles('tests/e2e/visual', '.spec.ts');
    const releaseSpecs = listFiles('tests/e2e/release', '.spec.ts');

    expect(applicationSpecs.length).toBeGreaterThan(0);
    expect(storybookLegacySpecs.length).toBeGreaterThan(0);
    expect(storybookColocatedSpecs.length).toBeGreaterThan(0);
    expect(visualSpecs.length).toBeGreaterThan(0);
    expect(releaseSpecs.length).toBeGreaterThan(0);

    // Both storybook groups are the same logical lane: legacy-central specs
    // under tests/e2e/storybook and owner-local specs colocated under src.
    const storybookSpecs = [...storybookLegacySpecs, ...storybookColocatedSpecs];

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
