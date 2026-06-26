import { describe, expect, it } from 'vitest';

import {
  APP_E2E_STANDALONE_SPECS,
  E2E_SCENARIO_SCOPES,
  isLowLevelE2EPath,
  isUnmappedSourcePath,
  resolveAppE2EPlan,
  validateE2EScenarioRegistry,
} from './e2eRisk.mjs';

describe('isLowLevelE2EPath', () => {
  it('flags playwright config and verify tooling', () => {
    expect(isLowLevelE2EPath('playwright.config.ts')).toBe(true);
    expect(isLowLevelE2EPath('scripts/verify.mjs')).toBe(true);
    expect(isLowLevelE2EPath('scripts/lib/e2eRisk.mjs')).toBe(true);
    expect(isLowLevelE2EPath('package.json')).toBe(true);
    expect(isLowLevelE2EPath('tsconfig.app.json')).toBe(true);
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
    ]);
  });

  it('skips app e2e when there are no relevant changes', () => {
    const plan = resolveAppE2EPlan(['README.md']);

    expect(plan.mode).toBe('skip');
  });
});
