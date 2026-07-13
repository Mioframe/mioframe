import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.mjs', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.mjs';
import {
  findStorybookBehaviorSpecFiles,
  isFullStorybookBehaviorLanePath,
  isStorybookBehaviorSpecPath,
  isStorybookBehaviorSupportPath,
  resolveStorybookBehaviorPlan,
  STORYBOOK_BEHAVIOR_SCENARIO_SCOPES,
  STORYBOOK_BEHAVIOR_STANDALONE_SPECS,
  validateStorybookBehaviorScenarioRegistry,
} from './storybookBehaviorRisk.mjs';

describe('isStorybookBehaviorSpecPath', () => {
  it('flags specs under tests/e2e/storybook/', () => {
    expect(isStorybookBehaviorSpecPath('tests/e2e/storybook/storybook.smoke.spec.ts')).toBe(true);
  });

  it('does not flag visual or app e2e specs', () => {
    expect(isStorybookBehaviorSpecPath('tests/e2e/visual/shared-ui.spec.ts')).toBe(false);
    expect(isStorybookBehaviorSpecPath('tests/e2e/appSmoke.spec.ts')).toBe(false);
  });
});

describe('isStorybookBehaviorSupportPath', () => {
  it('flags non-spec .ts helpers under tests/e2e/storybook/', () => {
    expect(isStorybookBehaviorSupportPath('tests/e2e/storybook/storybook.testUtils.ts')).toBe(true);
  });

  it('does not flag the spec files themselves', () => {
    expect(isStorybookBehaviorSupportPath('tests/e2e/storybook/storybook.smoke.spec.ts')).toBe(
      false,
    );
  });

  it('does not flag files outside tests/e2e/storybook/', () => {
    expect(isStorybookBehaviorSupportPath('tests/e2e/visual/storybook.ts')).toBe(false);
  });
});

describe('isFullStorybookBehaviorLanePath', () => {
  it('flags the behavior Playwright config and shared runner infrastructure', () => {
    expect(isFullStorybookBehaviorLanePath('playwright.storybook.config.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/playwrightContainer.mjs')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/storybookBehavior.mjs')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/storybook.mjs')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/lib/storybookBehaviorRisk.mjs')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('config/tooling.json')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('tsconfig.storybook.json')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('pnpm-lock.yaml')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/verify.mjs')).toBe(true);
  });

  it('flags any path under .storybook/', () => {
    expect(isFullStorybookBehaviorLanePath('.storybook/main.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('.storybook/vite.preview.config.ts')).toBe(true);
  });

  it('does not flag unrelated source paths', () => {
    expect(isFullStorybookBehaviorLanePath('src/features/documentCreate/index.ts')).toBe(false);
  });
});

describe('validateStorybookBehaviorScenarioRegistry', () => {
  it('passes for the current registry and standalone exception list', () => {
    expect(validateStorybookBehaviorScenarioRegistry()).toEqual({ valid: true, errors: [] });
  });

  it('covers every existing storybook behavior spec via the registry or the standalone list', () => {
    const registrySpecs = new Set(
      STORYBOOK_BEHAVIOR_SCENARIO_SCOPES.flatMap((scenario) => scenario.specs),
    );
    const coveredSpecs = new Set([...registrySpecs, ...STORYBOOK_BEHAVIOR_STANDALONE_SPECS]);

    expect(coveredSpecs.has('tests/e2e/storybook/storybook.smoke.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/storybook/reorder.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/storybook/reorder.autoscroll.spec.ts')).toBe(true);
  });

  it('fails when a scenario references a spec missing from disk', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [
        {
          name: 'stale scenario',
          sourcePrefixes: [],
          specs: ['tests/e2e/storybook/doesNotExist.spec.ts'],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('missing spec tests/e2e/storybook/doesNotExist.spec.ts'),
      ),
    ).toBe(true);
  });

  it('fails when an existing spec is not covered by the registry or standalone list', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [],
      standaloneSpecs: [],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('tests/e2e/storybook/storybook.smoke.spec.ts is not covered'),
      ),
    ).toBe(true);
  });

  it('fails when a scenario references an application e2e spec', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [
        {
          name: 'bad scenario',
          sourcePrefixes: [],
          specs: ['tests/e2e/appSmoke.spec.ts'],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('must only reference specs under tests/e2e/storybook/'),
      ),
    ).toBe(true);
  });

  it('fails when a scenario references a visual spec', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [
        {
          name: 'bad scenario',
          sourcePrefixes: [],
          specs: ['tests/e2e/visual/shared-ui.spec.ts'],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('must only reference specs under tests/e2e/storybook/'),
      ),
    ).toBe(true);
  });

  it('fails when a scenario references a release spec', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [
        {
          name: 'bad scenario',
          sourcePrefixes: [],
          specs: ['tests/e2e/release/productionArtifactSmoke.spec.ts'],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('must only reference specs under tests/e2e/storybook/'),
      ),
    ).toBe(true);
  });

  it('fails when a standalone entry references a non-.spec.ts file inside the lane', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [],
      standaloneSpecs: ['tests/e2e/storybook/storybook.testUtils.ts'],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes(
          'STORYBOOK_BEHAVIOR_STANDALONE_SPECS must only reference specs under tests/e2e/storybook/',
        ),
      ),
    ).toBe(true);
  });
});

describe('findStorybookBehaviorSpecFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'storybook-behavior-risk-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('recursively discovers nested .spec.ts files under an OS temporary directory', () => {
    fs.mkdirSync(path.join(tmpDir, 'nested'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'nested', 'example.spec.ts'), '');
    fs.writeFileSync(path.join(tmpDir, 'nested', 'example.ts'), '');
    fs.writeFileSync(path.join(tmpDir, 'top.spec.ts'), '');

    const specFiles = findStorybookBehaviorSpecFiles(tmpDir);

    expect(specFiles).toEqual(
      [
        path.posix.join(tmpDir, 'nested/example.spec.ts'),
        path.posix.join(tmpDir, 'top.spec.ts'),
      ].sort((left, right) => left.localeCompare(right)),
    );
  });
});

describe('validateStorybookBehaviorScenarioRegistry deterministic spec injection', () => {
  const nestedSpecPath = 'tests/e2e/storybook/reorder/reorder.spec.ts';

  it('detects a nested discovered spec that is not registered or standalone as invalid', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [],
      standaloneSpecs: [],
      specFiles: [nestedSpecPath],
      fileExists: () => true,
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) => error.includes(`${nestedSpecPath} is not covered`)),
    ).toBe(true);
  });

  it('accepts the same nested spec when registered via a scenario', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [{ name: 'reorder', sourcePrefixes: [], specs: [nestedSpecPath] }],
      standaloneSpecs: [],
      specFiles: [nestedSpecPath],
      fileExists: () => true,
    });

    expect(validation).toEqual({ valid: true, errors: [] });
  });

  it('accepts the same nested spec when registered as standalone', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [],
      standaloneSpecs: [nestedSpecPath],
      specFiles: [nestedSpecPath],
      fileExists: () => true,
    });

    expect(validation).toEqual({ valid: true, errors: [] });
  });

  it('detects a scenario that references a missing nested spec as invalid', () => {
    const validation = validateStorybookBehaviorScenarioRegistry({
      scenarios: [{ name: 'reorder', sourcePrefixes: [], specs: [nestedSpecPath] }],
      standaloneSpecs: [],
      specFiles: [],
      fileExists: () => false,
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes(`scenario registry references missing spec ${nestedSpecPath}`),
      ),
    ).toBe(true);
  });
});

describe('resolveStorybookBehaviorPlan', () => {
  it('runs the full lane for the behavior Playwright config', () => {
    const plan = resolveStorybookBehaviorPlan(['playwright.storybook.config.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path');
  });

  it('runs the full lane for any .storybook/ path change', () => {
    const plan = resolveStorybookBehaviorPlan(['.storybook/main.ts']);

    expect(plan.mode).toBe('full');
  });

  it('runs the full lane for a behavior support file change', () => {
    const plan = resolveStorybookBehaviorPlan(['tests/e2e/storybook/storybook.testUtils.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('behavior support file');
  });

  it('runs the changed behavior spec directly', () => {
    const plan = resolveStorybookBehaviorPlan(['tests/e2e/storybook/storybook.smoke.spec.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/storybook/storybook.smoke.spec.ts']);
  });

  it('does not run the full lane for an arbitrary unrelated src change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/features/documentCreate/index.ts']);

    expect(plan.mode).toBe('none');
  });

  it('runs the full lane for a pnpm-lock.yaml change', () => {
    const plan = resolveStorybookBehaviorPlan(['pnpm-lock.yaml']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path pnpm-lock.yaml');
  });

  it('runs the full lane for a scripts/verify.mjs change', () => {
    const plan = resolveStorybookBehaviorPlan(['scripts/verify.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain(
      'Storybook/Playwright infrastructure path scripts/verify.mjs',
    );
  });

  it('focuses the smoke spec for an MDButton story change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Button/MDButton.stories.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/storybook/storybook.smoke.spec.ts']);
  });

  it('focuses the smoke spec for an MDButton component change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Button/MDButton.vue']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/storybook/storybook.smoke.spec.ts']);
  });

  it('does not run the full lane for an unrelated src/shared/ui change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Button/MDFab.vue']);

    expect(plan.mode).toBe('none');
  });

  it('focuses both reorder specs for a reorder library source change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/lib/reorder/scrollChain.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorder.spec.ts',
    ]);
  });

  it('focuses both reorder specs for a reorder story change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/lib/reorder/Reorder.stories.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorder.spec.ts',
    ]);
  });

  it('focuses both reorder specs for a reorder story harness change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/lib/reorder/ReorderStoryHarness.vue']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorder.spec.ts',
    ]);
  });

  it('runs the changed reorder behavior spec directly when only the general spec changed', () => {
    const plan = resolveStorybookBehaviorPlan(['tests/e2e/storybook/reorder.spec.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorder.spec.ts',
    ]);
  });

  it('runs both reorder specs when only the autoscroll spec changed', () => {
    const plan = resolveStorybookBehaviorPlan(['tests/e2e/storybook/reorder.autoscroll.spec.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/storybook/reorder.autoscroll.spec.ts',
      'tests/e2e/storybook/reorder.spec.ts',
    ]);
  });

  it('runs the full lane for a change to the shared reorder Playwright test helper', () => {
    const plan = resolveStorybookBehaviorPlan(['tests/e2e/storybook/reorder.testUtils.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('behavior support file');
  });

  it('reports none for an empty changed-file scope', () => {
    const plan = resolveStorybookBehaviorPlan(['README.md']);

    expect(plan.mode).toBe('none');
  });
});

describe('resolveStorybookBehaviorPlan package.json impact', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('reports none for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveStorybookBehaviorPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('none');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs the full lane when the package.json change is runtime-relevant (e.g. a Storybook/Playwright dependency bump)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveStorybookBehaviorPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('runtime-relevant package.json change');
  });

  it('runs the full lane when the old package.json ref is missing (fails closed)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveStorybookBehaviorPlan(['package.json'], { packageJsonOldRef: null });

    expect(plan.mode).toBe('full');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: null });
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    resolveStorybookBehaviorPlan(['src/app/setupApp.ts']);

    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});
