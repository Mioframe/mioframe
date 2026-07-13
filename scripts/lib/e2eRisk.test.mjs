import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.mjs', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.mjs';
import {
  APP_E2E_STANDALONE_SPECS,
  E2E_SCENARIO_SCOPES,
  isAppE2ESpecPath,
  isAppE2ESupportPath,
  isLowLevelE2EPath,
  isReleaseE2ESpecPath,
  isStorybookBehaviorPath,
  isUnmappedSourcePath,
  resolveAppE2EPlan,
  validateE2EScenarioRegistry,
} from './e2eRisk.mjs';

describe('isReleaseE2ESpecPath', () => {
  it('flags specs under tests/e2e/release/', () => {
    expect(isReleaseE2ESpecPath('tests/e2e/release/productionArtifactSmoke.spec.ts')).toBe(true);
  });

  it('does not flag regular app e2e specs', () => {
    expect(isReleaseE2ESpecPath('tests/e2e/appSmoke.spec.ts')).toBe(false);
  });
});

describe('isAppE2ESpecPath and isAppE2ESupportPath exclude release specs', () => {
  it('does not classify a release spec as an app e2e spec', () => {
    expect(isAppE2ESpecPath('tests/e2e/release/productionArtifactSmoke.spec.ts')).toBe(false);
  });

  it('does not classify a release spec as app e2e support', () => {
    expect(isAppE2ESupportPath('tests/e2e/release/productionArtifactSmoke.spec.ts')).toBe(false);
  });
});

describe('isStorybookBehaviorPath', () => {
  it('flags spec and support paths under tests/e2e/storybook/', () => {
    expect(isStorybookBehaviorPath('tests/e2e/storybook/storybook.smoke.spec.ts')).toBe(true);
    expect(isStorybookBehaviorPath('tests/e2e/storybook/storybook.testUtils.ts')).toBe(true);
    expect(isStorybookBehaviorPath('tests/e2e/storybook/reorder/reorder.spec.ts')).toBe(true);
  });

  it('does not flag app, visual, or release paths', () => {
    expect(isStorybookBehaviorPath('tests/e2e/appSmoke.spec.ts')).toBe(false);
    expect(isStorybookBehaviorPath('tests/e2e/visual/shared-ui.spec.ts')).toBe(false);
    expect(isStorybookBehaviorPath('tests/e2e/release/productionArtifactSmoke.spec.ts')).toBe(
      false,
    );
  });
});

describe('isAppE2ESpecPath and isAppE2ESupportPath exclude Storybook behavior paths', () => {
  it('does not classify a Storybook behavior spec as an app e2e spec', () => {
    expect(isAppE2ESpecPath('tests/e2e/storybook/storybook.smoke.spec.ts')).toBe(false);
  });

  it('does not classify a nested Storybook behavior spec as an app e2e spec', () => {
    expect(isAppE2ESpecPath('tests/e2e/storybook/reorder/reorder.spec.ts')).toBe(false);
  });

  it('does not classify a Storybook behavior support file as app e2e support', () => {
    expect(isAppE2ESupportPath('tests/e2e/storybook/storybook.testUtils.ts')).toBe(false);
  });
});

describe('isLowLevelE2EPath', () => {
  it('flags playwright config and verify tooling', () => {
    expect(isLowLevelE2EPath('playwright.config.ts')).toBe(true);
    expect(isLowLevelE2EPath('scripts/playwrightContainer.mjs')).toBe(true);
    expect(isLowLevelE2EPath('scripts/verify.mjs')).toBe(true);
    expect(isLowLevelE2EPath('scripts/lib/e2eRisk.mjs')).toBe(true);
    expect(isLowLevelE2EPath('pnpm-lock.yaml')).toBe(true);
    expect(isLowLevelE2EPath('tsconfig.app.json')).toBe(true);
  });

  it('does not unconditionally flag package.json; its e2e impact is resolved separately', () => {
    expect(isLowLevelE2EPath('package.json')).toBe(false);
  });

  it('flags app bootstrap, shared service, and shared UI prefixes', () => {
    expect(isLowLevelE2EPath('src/app/setupApp.ts')).toBe(true);
    expect(isLowLevelE2EPath('src/shared/service/serviceWorker.ts')).toBe(true);
    expect(
      isLowLevelE2EPath('src/shared/serviceClient/diagnostics/applyDiagnosticsPolicy.ts'),
    ).toBe(true);
    expect(isLowLevelE2EPath('src/shared/lib/automerge/index.ts')).toBe(true);
    expect(isLowLevelE2EPath('src/shared/ui/MDButton/MDButton.vue')).toBe(true);
  });

  it('ignores stories and test-only files even under low-level prefixes', () => {
    expect(isLowLevelE2EPath('src/shared/ui/MDButton/MDButton.stories.ts')).toBe(false);
    expect(isLowLevelE2EPath('src/shared/lib/automerge/index.test.ts')).toBe(false);
    expect(isLowLevelE2EPath('src/shared/lib/automerge/index.testUtils.ts')).toBe(false);
  });

  it('does not flag unrelated feature/entity paths', () => {
    expect(isLowLevelE2EPath('src/features/documentCreate/index.ts')).toBe(false);
  });
});

describe('isUnmappedSourcePath', () => {
  it('flags src paths with no low-level or scenario classification', () => {
    expect(isUnmappedSourcePath('src/entities/googleSession/index.ts')).toBe(true);
  });

  it('does not flag low-level paths', () => {
    expect(isUnmappedSourcePath('src/app/setupApp.ts')).toBe(false);
  });

  it('does not flag scenario-mapped paths', () => {
    expect(isUnmappedSourcePath('src/entities/databaseData/index.ts')).toBe(false);
  });

  it('does not flag non src paths or test-only files', () => {
    expect(isUnmappedSourcePath('tests/e2e/helpers.ts')).toBe(false);
    expect(isUnmappedSourcePath('src/entities/googleSession/index.test.ts')).toBe(false);
  });

  it('does not flag unmapped spec/test files under src/** as unmapped product source', () => {
    expect(isUnmappedSourcePath('src/entities/googleSession/example.spec.ts')).toBe(false);
    expect(isUnmappedSourcePath('src/entities/googleSession/example.test.mjs')).toBe(false);
    expect(isUnmappedSourcePath('src/entities/googleSession/example.spec.mjs')).toBe(false);
  });
});

describe('validateE2EScenarioRegistry', () => {
  it('passes for the current registry and standalone exception list', () => {
    const validation = validateE2EScenarioRegistry();

    expect(validation).toEqual({ valid: true, errors: [] });
  });

  it('covers every existing app e2e spec via the registry or the standalone list', () => {
    const registrySpecs = new Set(E2E_SCENARIO_SCOPES.flatMap((scenario) => scenario.specs));
    const coveredSpecs = new Set([...registrySpecs, ...APP_E2E_STANDALONE_SPECS]);

    expect(coveredSpecs.has('tests/e2e/appSmoke.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/browserStoragePersistenceSmoke.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/databaseItemFlows.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/databasePersistenceSmoke.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/databasePropertyFlows.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/databaseViewsAndQueryFlows.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/repoExplorerScreen.spec.ts')).toBe(true);
    expect(coveredSpecs.has('tests/e2e/repositoryFlows.spec.ts')).toBe(true);
  });

  it('never includes a visual spec in the registry or standalone list', () => {
    const registrySpecs = E2E_SCENARIO_SCOPES.flatMap((scenario) => scenario.specs);

    for (const spec of [...registrySpecs, ...APP_E2E_STANDALONE_SPECS]) {
      expect(spec.startsWith('tests/e2e/visual/')).toBe(false);
    }
  });

  it('fails when a scenario references a spec missing from disk', () => {
    const validation = validateE2EScenarioRegistry({
      scenarios: [
        {
          name: 'stale scenario',
          sourcePrefixes: ['src/entities/doesNotExist/'],
          specs: ['tests/e2e/doesNotExist.spec.ts'],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('missing spec tests/e2e/doesNotExist.spec.ts'),
      ),
    ).toBe(true);
  });

  it('fails when a scenario references a visual spec', () => {
    const validation = validateE2EScenarioRegistry({
      scenarios: [
        {
          name: 'bad scenario',
          sourcePrefixes: ['src/entities/whatever/'],
          specs: ['tests/e2e/visual/shared-ui.spec.ts'],
        },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) => error.includes('must not reference visual spec')),
    ).toBe(true);
  });

  it('fails when an existing app e2e spec is not covered by the registry or standalone list', () => {
    const validation = validateE2EScenarioRegistry({ scenarios: [], standaloneSpecs: [] });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('tests/e2e/appSmoke.spec.ts is not covered'),
      ),
    ).toBe(true);
  });
});

describe('resolveAppE2EPlan', () => {
  it('runs full app e2e for playwright config changes', () => {
    const plan = resolveAppE2EPlan(['playwright.config.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('low-level path playwright.config.ts');
  });

  it('runs full app e2e when e2eRisk.mjs itself changes', () => {
    const plan = resolveAppE2EPlan(['scripts/lib/e2eRisk.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('low-level path scripts/lib/e2eRisk.mjs');
  });

  it('runs full app e2e when playwrightContainer.mjs changes', () => {
    const plan = resolveAppE2EPlan(['scripts/playwrightContainer.mjs']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('low-level path scripts/playwrightContainer.mjs');
  });

  it('runs full app e2e for shared service changes', () => {
    const plan = resolveAppE2EPlan(['src/shared/service/serviceWorker.ts']);

    expect(plan.mode).toBe('full');
  });

  it('runs full app e2e for unclassified src paths', () => {
    const plan = resolveAppE2EPlan(['src/entities/googleSession/index.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('unclassified src path');
  });

  it('runs full app e2e for shared/low-level changes regardless of test-only changes elsewhere', () => {
    const plan = resolveAppE2EPlan(['src/shared/service/serviceWorker.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('low-level path src/shared/service/serviceWorker.ts');
  });

  it('does not run full app e2e for unmapped src spec/test files', () => {
    expect(resolveAppE2EPlan(['src/entities/googleSession/example.spec.ts']).mode).toBe('skip');
    expect(resolveAppE2EPlan(['src/entities/googleSession/example.test.mjs']).mode).toBe('skip');
    expect(resolveAppE2EPlan(['src/entities/googleSession/example.spec.mjs']).mode).toBe('skip');
  });

  it('runs full app e2e for non-spec e2e support file changes', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/helpers.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('e2e support file');
  });

  it('does not trigger app e2e for visual-only spec changes', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/visual/shared-ui.spec.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('does not trigger focused app e2e for release-only spec changes', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/release/productionArtifactSmoke.spec.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('does not trigger app e2e for a Storybook behavior spec-only change', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/storybook/storybook.smoke.spec.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('does not trigger a full app e2e plan for a Storybook behavior support-only change', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/storybook/storybook.testUtils.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('runs the mapped focused spec for a scenario source change', () => {
    const plan = resolveAppE2EPlan(['src/entities/databaseData/index.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/databasePersistenceSmoke.spec.ts']);
  });

  it('runs the changed app e2e spec directly', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/databasePersistenceSmoke.spec.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/databasePersistenceSmoke.spec.ts']);
  });

  it('merges focused specs across multiple scenario matches', () => {
    const plan = resolveAppE2EPlan([
      'src/widgets/RepositoryExplorerWidget/index.ts',
      'src/features/documentCreate/index.ts',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/repoExplorerScreen.spec.ts',
      'tests/e2e/repositoryFlows.spec.ts',
      'tests/e2e/zipActionFlows.spec.ts',
    ]);
  });

  it('includes the ZIP scenario spec for RepositoryExplorerWidget and RepoExplorer page changes', () => {
    expect(resolveAppE2EPlan(['src/widgets/RepositoryExplorerWidget/index.ts']).specs).toContain(
      'tests/e2e/zipActionFlows.spec.ts',
    );
    expect(resolveAppE2EPlan(['src/pages/RepoExplorer/index.ts']).specs).toContain(
      'tests/e2e/zipActionFlows.spec.ts',
    );
    expect(resolveAppE2EPlan(['src/features/entryManage/index.ts']).specs).toContain(
      'tests/e2e/zipActionFlows.spec.ts',
    );
    expect(resolveAppE2EPlan(['src/features/entryAdd/index.ts']).specs).toContain(
      'tests/e2e/zipActionFlows.spec.ts',
    );
  });

  it('skips app e2e when there are no relevant changes', () => {
    const plan = resolveAppE2EPlan(['README.md']);

    expect(plan.mode).toBe('skip');
  });
});

describe('resolveAppE2EPlan package.json impact', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('skips app e2e for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveAppE2EPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('skip');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs full app e2e when the package.json change is runtime-relevant', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveAppE2EPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('runtime-relevant package.json change');
  });

  it('runs full app e2e when the old package.json ref is missing (fails closed)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveAppE2EPlan(['package.json'], { packageJsonOldRef: null });

    expect(plan.mode).toBe('full');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: null });
  });

  it('runs full app e2e for a version-only package.json change alongside another full-e2e path', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveAppE2EPlan(['package.json', 'playwright.config.ts'], {
      packageJsonOldRef: 'HEAD~1',
    });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('low-level path playwright.config.ts');
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    resolveAppE2EPlan(['src/app/setupApp.ts']);

    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});
