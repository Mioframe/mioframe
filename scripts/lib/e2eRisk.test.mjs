import { describe, expect, it } from 'vitest';

import { isLowLevelE2EPath, isUnmappedSourcePath, resolveAppE2EPlan } from './e2eRisk.mjs';

describe('isLowLevelE2EPath', () => {
  it('flags playwright config and verify tooling', () => {
    expect(isLowLevelE2EPath('playwright.config.ts')).toBe(true);
    expect(isLowLevelE2EPath('scripts/verify.mjs')).toBe(true);
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
});

describe('resolveAppE2EPlan', () => {
  it('runs full app e2e for playwright config changes', () => {
    const plan = resolveAppE2EPlan(['playwright.config.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('low-level path playwright.config.ts');
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
