import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import appConfig from './playwright.config';
import browserIntegrationConfig from './playwright.browserIntegration.config';
import releaseConfig from './playwright.release.config';
import storybookBehaviorConfig from './playwright.storybook.config';
import visualConfig from './playwright.visual.config';

describe('Playwright lane discovery stays disjoint', () => {
  it('gives application e2e its own physical testDir', () => {
    expect(appConfig.testDir).toBe('./tests/e2e');
  });

  it('discovers the remaining release E2E specs and the moved managed-update browser-integration corpus from repo root', () => {
    expect(releaseConfig.testDir).toBe('.');
    expect(releaseConfig.testMatch).toEqual([
      'tests/e2e/release/*.spec.ts',
      'src/shared/service/appUpdate/*.browser-integration.spec.ts',
    ]);
  });

  it('discovers owner-local storybook behavior specs from repo root via target testMatch', () => {
    expect(storybookBehaviorConfig.testDir).toBe('.');
    expect(storybookBehaviorConfig.testMatch).toEqual([
      'src/**/*.behavior.spec.ts',
      '.storybook/**/*.behavior.spec.ts',
    ]);
  });

  it('discovers the target browser-integration suffix from repo root', () => {
    expect(browserIntegrationConfig.testDir).toBe('.');
    expect(browserIntegrationConfig.testMatch).toEqual(['src/**/*.browser-integration.spec.ts']);
    expect(browserIntegrationConfig.respectGitIgnore).toBe(true);
  });

  it('discovers owner-local visual specs from repo root via target testMatch', () => {
    expect(visualConfig.testDir).toBe('.');
    expect(visualConfig.testMatch).toEqual(['src/**/*.visual.spec.ts']);
  });

  it('keeps root-scanning lanes from collecting tests out of ignored nested/local workspaces', () => {
    expect(storybookBehaviorConfig.respectGitIgnore).toBe(true);
    expect(visualConfig.respectGitIgnore).toBe(true);
  });

  it('makes every application e2e project ignore the storybook, visual, and release subtrees', () => {
    expect(appConfig.projects?.length).toBeGreaterThan(0);

    for (const project of appConfig.projects ?? []) {
      expect(project.testIgnore).toEqual(
        expect.arrayContaining(['storybook/**', 'visual/**', 'release/**']),
      );
    }
  });

  it('does not give the storybook behavior, visual, release, or browser-integration configs a testIgnore of their own subtree', () => {
    expect(storybookBehaviorConfig.testIgnore).toBeUndefined();
    expect(visualConfig.testIgnore).toBeUndefined();
    expect(releaseConfig.testIgnore).toBeUndefined();
    expect(browserIntegrationConfig.testIgnore).toBeUndefined();
  });

  it('finds every existing spec file in exactly one of the five logical lanes', () => {
    const applicationSpecs = listFiles('tests/e2e', '.spec.ts', { recursive: false });
    const behaviorSpecs = [
      ...listFiles('src', '.behavior.spec.ts'),
      ...listFiles('.storybook', '.behavior.spec.ts'),
    ];
    const visualSpecs = listFiles('src', '.visual.spec.ts');
    const releaseSpecs = listFiles('tests/e2e/release', '.spec.ts');
    const browserIntegrationSpecs = listFiles('src', '.browser-integration.spec.ts');

    expect(applicationSpecs.length).toBeGreaterThan(0);
    expect(behaviorSpecs.length).toBeGreaterThan(0);
    expect(visualSpecs.length).toBeGreaterThan(0);
    // Exactly the three remaining transitional release E2E specs (Pass D
    // moves them); the managed-update browser-integration corpus moved out.
    expect(releaseSpecs).toHaveLength(3);
    // Exactly the eleven managed-update/artifact specs moved in this pass.
    expect(browserIntegrationSpecs).toHaveLength(11);

    expect(intersection(applicationSpecs, behaviorSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, visualSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, releaseSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, browserIntegrationSpecs)).toEqual([]);
    expect(intersection(behaviorSpecs, visualSpecs)).toEqual([]);
    expect(intersection(behaviorSpecs, releaseSpecs)).toEqual([]);
    expect(intersection(behaviorSpecs, browserIntegrationSpecs)).toEqual([]);
    expect(intersection(visualSpecs, releaseSpecs)).toEqual([]);
    expect(intersection(visualSpecs, browserIntegrationSpecs)).toEqual([]);
    expect(intersection(releaseSpecs, browserIntegrationSpecs)).toEqual([]);

    const allSpecs = [
      ...applicationSpecs,
      ...behaviorSpecs,
      ...visualSpecs,
      ...releaseSpecs,
      ...browserIntegrationSpecs,
    ];

    expect(new Set(allSpecs).size).toBe(allSpecs.length);
  });
});

describe('target E2E owner-path discovery is executable before root E2E migration', () => {
  it('does not ignore a hypothetical tests/e2e/pages/<Owner> or tests/e2e/widgets/<Owner> subtree in any project', () => {
    expect(appConfig.projects?.length).toBeGreaterThan(0);

    for (const project of appConfig.projects ?? []) {
      expect(project.testIgnore).toEqual(expect.not.arrayContaining(['pages/**', 'widgets/**']));
    }
  });

  it('matches an *.e2e.spec.ts file under the target owner directory structure by default Playwright discovery, with no explicit testMatch narrowing it away', () => {
    // playwright.config.ts sets no testMatch of its own, so it keeps
    // Playwright's default pattern (any `*.spec.ts` file, including
    // `*.e2e.spec.ts`) under testDir. Confirmed here as a structural fact
    // about the config object, not by asserting on the *.e2e.spec.ts
    // literal string, since Playwright's default testMatch is not itself
    // exposed as a public config property.
    expect(appConfig.testMatch).toBeUndefined();
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
