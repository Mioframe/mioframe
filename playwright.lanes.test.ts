import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import appConfig from './playwright.config';
import releaseConfig from './playwright.release.config';
import storybookBehaviorConfig from './playwright.storybook.config';
import visualConfig from './playwright.visual.config';

describe('Playwright lane discovery stays disjoint', () => {
  it('gives each of the four lanes its own testDir', () => {
    expect(appConfig.testDir).toBe('./tests/e2e');
    expect(storybookBehaviorConfig.testDir).toBe('./tests/e2e/storybook');
    expect(visualConfig.testDir).toBe('./tests/e2e/visual');
    expect(releaseConfig.testDir).toBe('./tests/e2e/release');
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

  it('finds every existing spec file under exactly one of the four lane directories', () => {
    const appSpecs = listSpecFiles('tests/e2e', { recursive: false });
    const storybookSpecs = listSpecFiles('tests/e2e/storybook');
    const visualSpecs = listSpecFiles('tests/e2e/visual');
    const releaseSpecs = listSpecFiles('tests/e2e/release');

    expect(appSpecs.length).toBeGreaterThan(0);
    expect(storybookSpecs.length).toBeGreaterThan(0);
    expect(visualSpecs.length).toBeGreaterThan(0);
    expect(releaseSpecs.length).toBeGreaterThan(0);

    const allSpecs = [...appSpecs, ...storybookSpecs, ...visualSpecs, ...releaseSpecs];

    expect(new Set(allSpecs).size).toBe(allSpecs.length);
  });
});

function listSpecFiles(dir: string, { recursive = true }: { recursive?: boolean } = {}) {
  return fs
    .readdirSync(dir, { withFileTypes: true, recursive })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.spec.ts'))
    .map((entry) => `${entry.parentPath}/${entry.name}`);
}
