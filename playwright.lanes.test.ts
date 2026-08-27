import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import appConfig from './playwright.config';
import browserIntegrationConfig from './playwright.browserIntegration.config';
import releaseConfig from './playwright.release.config';
import storybookBehaviorConfig from './playwright.storybook.config';
import visualConfig from './playwright.visual.config';

describe('Playwright lane discovery stays disjoint', () => {
  it('gives application e2e its own physical testDir, scoped to the structural owner tree, excluding productionArtifact/', () => {
    expect(appConfig.testDir).toBe('./tests/e2e');
    expect(appConfig.testMatch).toEqual(['pages/**/*.e2e.spec.ts', 'widgets/**/*.e2e.spec.ts']);
    expect(appConfig.testIgnore).toEqual(['**/productionArtifact/**']);
  });

  it('discovers only productionArtifact/ target E2E and the moved managed-update browser-integration corpus from repo root', () => {
    expect(releaseConfig.testDir).toBe('.');
    expect(releaseConfig.testMatch).toEqual([
      'tests/e2e/pages/**/productionArtifact/*.e2e.spec.ts',
      'tests/e2e/widgets/**/productionArtifact/*.e2e.spec.ts',
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

  it('discovers the target browser-integration suffix from repo root, excluding the appUpdate special corpus', () => {
    expect(browserIntegrationConfig.testDir).toBe('.');
    expect(browserIntegrationConfig.testMatch).toEqual(['src/**/*.browser-integration.spec.ts']);
    expect(browserIntegrationConfig.testIgnore).toEqual([
      'src/shared/service/appUpdate/*.browser-integration.spec.ts',
    ]);
    expect(browserIntegrationConfig.respectGitIgnore).toBe(true);
  });

  it('cannot collect any appUpdate managed-update browser-integration spec', () => {
    const appUpdateSpecs = listFiles(
      'src/shared/service/appUpdate',
      '.browser-integration.spec.ts',
    );
    const testIgnore = browserIntegrationConfig.testIgnore;
    const testIgnorePattern = Array.isArray(testIgnore) ? testIgnore[0] : testIgnore;

    expect(appUpdateSpecs.length).toBeGreaterThan(0);
    expect(testIgnorePattern).toBe('src/shared/service/appUpdate/*.browser-integration.spec.ts');

    // The `*` in the registered testIgnore pattern matches a single path
    // segment, so it excludes every direct appUpdate browser-integration
    // spec (there are no nested subdirectories in this owner tree).
    for (const specPath of appUpdateSpecs) {
      const relativeToAppUpdate = specPath.replace('src/shared/service/appUpdate/', '');
      expect(relativeToAppUpdate.includes('/')).toBe(false);
    }
  });

  it('discovers owner-local visual specs from repo root via target testMatch', () => {
    expect(visualConfig.testDir).toBe('.');
    expect(visualConfig.testMatch).toEqual(['src/**/*.visual.spec.ts']);
  });

  it('keeps root-scanning lanes from collecting tests out of ignored nested/local workspaces', () => {
    expect(storybookBehaviorConfig.respectGitIgnore).toBe(true);
    expect(visualConfig.respectGitIgnore).toBe(true);
  });

  it('does not give the storybook behavior, visual, or release configs a testIgnore of their own subtree', () => {
    expect(storybookBehaviorConfig.testIgnore).toBeUndefined();
    expect(visualConfig.testIgnore).toBeUndefined();
    expect(releaseConfig.testIgnore).toBeUndefined();
  });

  it('does not let per-project mobile/desktop applicability filtering blanket-exclude the pages/widgets owner tree', () => {
    expect(appConfig.projects?.length).toBeGreaterThan(0);

    for (const project of appConfig.projects ?? []) {
      expect(project.testIgnore ?? []).toEqual(
        expect.not.arrayContaining(['pages/**', 'widgets/**']),
      );
    }
  });

  it('finds every existing spec file in exactly one of the four logical lanes', () => {
    const applicationSpecs = [
      ...listFiles('tests/e2e/pages', '.e2e.spec.ts'),
      ...listFiles('tests/e2e/widgets', '.e2e.spec.ts'),
    ];
    const behaviorSpecs = [
      ...listFiles('src', '.behavior.spec.ts'),
      ...listFiles('.storybook', '.behavior.spec.ts'),
    ];
    const visualSpecs = listFiles('src', '.visual.spec.ts');
    const browserIntegrationSpecs = listFiles('src', '.browser-integration.spec.ts');

    expect(applicationSpecs.length).toBeGreaterThan(0);
    expect(behaviorSpecs.length).toBeGreaterThan(0);
    expect(visualSpecs.length).toBeGreaterThan(0);
    // Exactly the twenty-four target E2E specs (see
    // scripts/lib/e2eProjectApplicability.ts's E2E_PROJECT_APPLICABILITY),
    // including the three productionArtifact/ specs.
    expect(applicationSpecs).toHaveLength(24);
    // Exactly the eleven appUpdate managed-update/artifact specs plus the one
    // generic owner-local browser-integration spec.
    expect(browserIntegrationSpecs).toHaveLength(12);

    expect(intersection(applicationSpecs, behaviorSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, visualSpecs)).toEqual([]);
    expect(intersection(applicationSpecs, browserIntegrationSpecs)).toEqual([]);
    expect(intersection(behaviorSpecs, visualSpecs)).toEqual([]);
    expect(intersection(behaviorSpecs, browserIntegrationSpecs)).toEqual([]);
    expect(intersection(visualSpecs, browserIntegrationSpecs)).toEqual([]);

    const allSpecs = [
      ...applicationSpecs,
      ...behaviorSpecs,
      ...visualSpecs,
      ...browserIntegrationSpecs,
    ];

    expect(new Set(allSpecs).size).toBe(allSpecs.length);
  });

  it('splits target E2E into exactly three productionArtifact/ specs and the remaining ordinary specs', () => {
    const allApplicationSpecs = [
      ...listFiles('tests/e2e/pages', '.e2e.spec.ts'),
      ...listFiles('tests/e2e/widgets', '.e2e.spec.ts'),
    ];
    const productionArtifactSpecs = allApplicationSpecs.filter((filePath) =>
      filePath.includes('/productionArtifact/'),
    );
    const ordinarySpecs = allApplicationSpecs.filter(
      (filePath) => !filePath.includes('/productionArtifact/'),
    );

    expect(ordinarySpecs.length).toBeGreaterThan(0);
    expect(productionArtifactSpecs).toHaveLength(3);
  });
});

function listFiles(
  dir: string,
  suffix: string,
  { recursive = true }: { recursive?: boolean } = {},
) {
  let entries: fs.Dirent[];

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true, recursive });
  } catch {
    return [];
  }

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(suffix))
    .map((entry) => `${entry.parentPath}/${entry.name}`);
}

function intersection(a: readonly string[], b: readonly string[]) {
  const setB = new Set(b);
  return a.filter((item) => setB.has(item));
}
