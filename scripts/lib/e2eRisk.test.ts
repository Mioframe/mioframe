import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import {
  APP_E2E_STANDALONE_SPECS,
  E2E_SCENARIO_SCOPES,
  isAppE2ERelevantPath,
  isAppE2ESpecPath,
  isAppE2ESupportPath,
  isFullLaneE2EInfrastructurePath,
  isReleaseE2ESpecPath,
  isStorybookBehaviorPath,
  isUnmappedAppE2ERelevantPath,
  resolveAppE2EPlan,
  validateE2EScenarioRegistry,
} from './e2eRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

const DATABASE_VIEWS_AND_QUERY_SPECS = [
  'tests/e2e/databaseViewsAndQueryFlows.spec.ts',
  'tests/e2e/reorderSurfaceBottomSheet.spec.ts',
  'tests/e2e/reorderSurfaceCancellation.spec.ts',
  'tests/e2e/reorderSurfaceMouse.spec.ts',
  'tests/e2e/reorderSurfacePersistence.spec.ts',
  'tests/e2e/reorderSurfaceTouch.spec.ts',
];

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

describe('isFullLaneE2EInfrastructurePath', () => {
  it('flags playwright config and verify tooling', () => {
    expect(isFullLaneE2EInfrastructurePath('playwright.config.ts')).toBe(true);
    expect(isFullLaneE2EInfrastructurePath('scripts/playwrightContainer.ts')).toBe(true);
    expect(isFullLaneE2EInfrastructurePath('scripts/verify.ts')).toBe(true);
    expect(isFullLaneE2EInfrastructurePath('scripts/lib/e2eRisk.ts')).toBe(true);
    expect(isFullLaneE2EInfrastructurePath('scripts/lib/e2eProjectApplicability.ts')).toBe(true);
    expect(isFullLaneE2EInfrastructurePath('pnpm-lock.yaml')).toBe(true);
    expect(isFullLaneE2EInfrastructurePath('tsconfig.app.json')).toBe(true);
  });

  it('flags GitHub Actions workflow changes', () => {
    expect(isFullLaneE2EInfrastructurePath('.github/workflows/ci.yml')).toBe(true);
  });

  it('does not unconditionally flag package.json; its e2e impact is resolved separately', () => {
    expect(isFullLaneE2EInfrastructurePath('package.json')).toBe(false);
  });

  it('does not flag app/shared source, even under formerly broad prefixes', () => {
    expect(isFullLaneE2EInfrastructurePath('src/app/setupApp.ts')).toBe(false);
    expect(isFullLaneE2EInfrastructurePath('src/shared/service/serviceWorker.ts')).toBe(false);
    expect(isFullLaneE2EInfrastructurePath('src/shared/ui/MDButton/MDButton.vue')).toBe(false);
  });

  it('does not flag unrelated feature/entity paths', () => {
    expect(isFullLaneE2EInfrastructurePath('src/features/documentCreate/index.ts')).toBe(false);
  });
});

describe('isAppE2ERelevantPath', () => {
  it.each([
    ['src/app/setupApp.ts'],
    ['src/shared/service/serviceWorker.ts'],
    ['src/shared/serviceClient/diagnostics/applyDiagnosticsPolicy.ts'],
    ['src/shared/lib/automerge/index.ts'],
    ['src/shared/ui/MDButton/MDButton.vue'],
  ])('flags TypeScript/Vue source under the broad app/shared domains: %s', (filePath) => {
    expect(isAppE2ERelevantPath(filePath)).toBe(true);
  });

  it.each([
    ['src/app/styles/styles.css'],
    ['src/shared/ui/MDButton/MDButton.css'],
    ['src/shared/lib/automerge/worker.json'],
  ])(
    'flags non-TypeScript/Vue runtime source under the broad app/shared domains: %s',
    (filePath) => {
      expect(isAppE2ERelevantPath(filePath)).toBe(true);
    },
  );

  it('flags TypeScript/Vue product source outside the broad domains', () => {
    expect(isAppE2ERelevantPath('src/features/documentCreate/index.ts')).toBe(true);
    expect(isAppE2ERelevantPath('src/entities/googleSession/index.ts')).toBe(true);
  });

  it('does not flag non-TypeScript/Vue source outside the broad domains', () => {
    expect(isAppE2ERelevantPath('src/features/documentCreate/styles.css')).toBe(false);
  });

  it('ignores stories and test-only files even under the broad domains', () => {
    expect(isAppE2ERelevantPath('src/shared/ui/MDButton/MDButton.stories.ts')).toBe(false);
    expect(isAppE2ERelevantPath('src/shared/lib/automerge/index.test.ts')).toBe(false);
    expect(isAppE2ERelevantPath('src/shared/lib/automerge/index.testUtils.ts')).toBe(false);
  });

  it('does not flag non-src paths', () => {
    expect(isAppE2ERelevantPath('tests/e2e/helpers.ts')).toBe(false);
    expect(isAppE2ERelevantPath('playwright.config.ts')).toBe(false);
  });
});

describe('isUnmappedAppE2ERelevantPath', () => {
  it('flags relevant broad-domain paths with no scenario mapping', () => {
    expect(isUnmappedAppE2ERelevantPath('src/shared/service/serviceWorker.ts')).toBe(true);
    expect(isUnmappedAppE2ERelevantPath('src/shared/lib/automerge/index.ts')).toBe(true);
    expect(isUnmappedAppE2ERelevantPath('src/shared/ui/MDButton/MDButton.vue')).toBe(true);
  });

  it('flags relevant product source with no low-level or scenario classification', () => {
    expect(isUnmappedAppE2ERelevantPath('src/entities/googleSession/index.ts')).toBe(true);
  });

  it('does not flag mapped broad-domain paths', () => {
    expect(
      isUnmappedAppE2ERelevantPath('src/widgets/DocumentView/Database/DatabaseViewsSheet.vue'),
    ).toBe(false);
    expect(isUnmappedAppE2ERelevantPath('src/shared/lib/sortable/useReorderSurface.ts')).toBe(
      false,
    );
    expect(isUnmappedAppE2ERelevantPath('src/shared/ui/Query/QueryRoot.vue')).toBe(false);
  });

  it('does not flag scenario-mapped product paths', () => {
    expect(isUnmappedAppE2ERelevantPath('src/entities/databaseData/index.ts')).toBe(false);
  });

  it('does not flag non-relevant paths', () => {
    expect(isUnmappedAppE2ERelevantPath('tests/e2e/helpers.ts')).toBe(false);
    expect(isUnmappedAppE2ERelevantPath('src/entities/googleSession/index.test.ts')).toBe(false);
  });

  it('does not flag unmapped spec/test files under src/** as unmapped product source', () => {
    expect(isUnmappedAppE2ERelevantPath('src/entities/googleSession/example.spec.ts')).toBe(false);
    expect(isUnmappedAppE2ERelevantPath('src/entities/googleSession/example.test.mjs')).toBe(false);
    expect(isUnmappedAppE2ERelevantPath('src/entities/googleSession/example.spec.mjs')).toBe(false);
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
    expect(plan.reasons[0]).toContain('full-lane infrastructure path playwright.config.ts');
  });

  it('runs full app e2e when e2eRisk.ts itself changes', () => {
    const plan = resolveAppE2EPlan(['scripts/lib/e2eRisk.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('full-lane infrastructure path scripts/lib/e2eRisk.ts');
  });

  it('runs full app e2e when playwrightContainer.ts changes', () => {
    const plan = resolveAppE2EPlan(['scripts/playwrightContainer.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain(
      'full-lane infrastructure path scripts/playwrightContainer.ts',
    );
  });

  it('runs full app e2e for a GitHub Actions workflow change', () => {
    const plan = resolveAppE2EPlan(['.github/workflows/ci.yml']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('full-lane infrastructure path .github/workflows/ci.yml');
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

describe('resolveAppE2EPlan full -> focused transitions (V2A)', () => {
  it('routes the virtualized Database table through its persistence, item, and view owners', () => {
    const plan = resolveAppE2EPlan(['src/entities/databaseData/DatabaseDataTable.vue']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([
      'tests/e2e/databaseItemFlows.spec.ts',
      'tests/e2e/databasePersistenceSmoke.spec.ts',
      'tests/e2e/databaseViewsAndQueryFlows.spec.ts',
    ]);
  });

  it.each([
    ['src/widgets/DocumentView/Database/DatabaseViewsSheet.vue', DATABASE_VIEWS_AND_QUERY_SPECS],
    [
      'src/widgets/DocumentView/Database/DatabaseToolbar.vue',
      ['tests/e2e/databaseItemFlows.spec.ts', 'tests/e2e/databaseViewsAndQueryFlows.spec.ts'],
    ],
    [
      'src/widgets/DocumentView/Database/useDatabaseInlineEditSession.ts',
      ['tests/e2e/databaseItemFlows.spec.ts', 'tests/e2e/databaseViewsAndQueryFlows.spec.ts'],
    ],
    [
      'src/shared/lib/sortable/useReorderSurface.ts',
      ['tests/e2e/databaseViewsAndQueryFlows.spec.ts'],
    ],
    ['src/shared/ui/Query/QueryRoot.vue', ['tests/e2e/databaseViewsAndQueryFlows.spec.ts']],
  ])('resolves %s to focused specs %j', (filePath, expectedSpecs) => {
    const plan = resolveAppE2EPlan([filePath]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(expectedSpecs);
  });

  it('resolves DatabaseViewsSheet.vue to exactly the six-spec database views/reorder set', () => {
    const plan = resolveAppE2EPlan(['src/widgets/DocumentView/Database/DatabaseViewsSheet.vue']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(DATABASE_VIEWS_AND_QUERY_SPECS);
  });

  it('resolves legacy sortable source to exactly databaseViewsAndQueryFlows.spec.ts, not any reorderSurface spec', () => {
    const plan = resolveAppE2EPlan(['src/shared/lib/sortable/useReorderSurface.ts']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/databaseViewsAndQueryFlows.spec.ts']);
    expect(plan.specs).not.toContain('tests/e2e/reorderSurfaceBottomSheet.spec.ts');
    expect(plan.specs).not.toContain('tests/e2e/reorderSurfaceCancellation.spec.ts');
    expect(plan.specs).not.toContain('tests/e2e/reorderSurfaceMouse.spec.ts');
    expect(plan.specs).not.toContain('tests/e2e/reorderSurfacePersistence.spec.ts');
    expect(plan.specs).not.toContain('tests/e2e/reorderSurfaceTouch.spec.ts');
  });

  it('resolves Query UI source to exactly databaseViewsAndQueryFlows.spec.ts', () => {
    const plan = resolveAppE2EPlan(['src/shared/ui/Query/QueryRoot.vue']);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/databaseViewsAndQueryFlows.spec.ts']);
  });
});

describe('resolveAppE2EPlan test/story exclusion at the mapping seam (V2A)', () => {
  it('does not select app e2e for a test-only file under the newly mapped legacy sortable directory', () => {
    const plan = resolveAppE2EPlan(['src/shared/lib/sortable/useReorderSurface.test.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('does not select app e2e for a story file under the newly mapped Query UI directory', () => {
    const plan = resolveAppE2EPlan(['src/shared/ui/Query/QueryRoot.stories.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('does not select app e2e for a spec file under the mapped Query UI directory', () => {
    const plan = resolveAppE2EPlan(['src/shared/ui/Query/QueryRoot.spec.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('does not select app e2e for a test-only file under a pre-existing mapped feature/entity prefix', () => {
    const plan = resolveAppE2EPlan(['src/entities/databaseData/index.test.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('returns only the mapped production source specs when combined with a mapped test-only file', () => {
    const plan = resolveAppE2EPlan([
      'src/shared/lib/sortable/useReorderSurface.ts',
      'src/shared/lib/sortable/useReorderSurface.test.ts',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(['tests/e2e/databaseViewsAndQueryFlows.spec.ts']);
  });
});

describe('resolveAppE2EPlan fail-closed unknown relevant source (V2A)', () => {
  it.each([
    ['src/app/setupApp.ts'],
    ['src/shared/ui/MDButton/MDButton.vue'],
    ['src/shared/lib/automerge/index.ts'],
    ['src/shared/service/serviceWorker.ts'],
    ['src/shared/serviceClient/diagnostics/applyDiagnosticsPolicy.ts'],
    ['src/entities/googleSession/index.ts'],
  ])('keeps unmapped relevant path %s full', (filePath) => {
    const plan = resolveAppE2EPlan([filePath]);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('unmapped application-E2E-relevant path');
  });

  it('keeps an unmapped non-TypeScript/Vue path under a broad app/shared domain full', () => {
    const plan = resolveAppE2EPlan(['src/app/styles/styles.css']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain(
      'unmapped application-E2E-relevant path src/app/styles/styles.css',
    );
  });
});

describe('resolveAppE2EPlan composition (V2A)', () => {
  it('unions and dedupes specs across two mapped sources with distinct spec sets', () => {
    const plan = resolveAppE2EPlan([
      'src/widgets/DocumentView/Database/DatabaseViewsSheet.vue',
      'src/entities/databaseData/index.ts',
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual(
      [...DATABASE_VIEWS_AND_QUERY_SPECS, 'tests/e2e/databasePersistenceSmoke.spec.ts'].sort(
        (left, right) => left.localeCompare(right),
      ),
    );
  });

  it('resolves full when a mapped V2A change is combined with an unmapped relevant change', () => {
    const plan = resolveAppE2EPlan([
      'src/widgets/DocumentView/Database/DatabaseViewsSheet.vue',
      'src/entities/googleSession/index.ts',
    ]);

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([]);
  });

  it('resolves full when a mapped V2A change is combined with true infrastructure', () => {
    const plan = resolveAppE2EPlan([
      'src/widgets/DocumentView/Database/DatabaseViewsSheet.vue',
      'playwright.config.ts',
    ]);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('full-lane infrastructure path playwright.config.ts');
  });
});

describe('resolveAppE2EPlan removed/renamed spec safety', () => {
  it('runs full app e2e for a nonexistent directly changed app e2e spec', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/removedFlow.spec.ts'], {
      fileExists: () => false,
    });

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([]);
    expect(plan.reasons[0]).toContain(
      'removed or renamed app e2e spec tests/e2e/removedFlow.spec.ts',
    );
  });

  it('runs full app e2e for a rename-like input where the old spec no longer exists', () => {
    const plan = resolveAppE2EPlan(
      ['tests/e2e/oldFlow.spec.ts', 'tests/e2e/databasePersistenceSmoke.spec.ts'],
      { fileExists: (filePath) => filePath !== 'tests/e2e/oldFlow.spec.ts' },
    );

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([]);
    expect(plan.reasons[0]).toContain('removed or renamed app e2e spec tests/e2e/oldFlow.spec.ts');
  });

  it('never returns a missing spec in focused specs', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/removedFlow.spec.ts'], {
      fileExists: () => false,
    });

    expect(plan.specs).not.toContain('tests/e2e/removedFlow.spec.ts');
  });

  it('keeps an existing directly changed app e2e spec focused', () => {
    const plan = resolveAppE2EPlan(['tests/e2e/databasePersistenceSmoke.spec.ts']);

    expect(plan).toEqual({
      mode: 'focused',
      specs: ['tests/e2e/databasePersistenceSmoke.spec.ts'],
      reasons: [
        'changed app e2e spec tests/e2e/databasePersistenceSmoke.spec.ts -> tests/e2e/databasePersistenceSmoke.spec.ts',
      ],
    });
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
    expect(plan.reasons[0]).toContain('full-lane infrastructure path playwright.config.ts');
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    resolveAppE2EPlan(['src/app/setupApp.ts']);

    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});
