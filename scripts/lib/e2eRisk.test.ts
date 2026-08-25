import { describe, expect, it } from 'vitest';

import { isRelevantProductionSourcePath, resolveStructuralE2EPlan } from './e2eRisk.ts';
import type { RawE2ESpecInventoryEntry } from './e2eOwnerInventory.ts';

const existingOwners = new Set([
  'page/HomePane',
  'page/AppUpdatesPane',
  'page/Settings',
  'page/RepoExplorer',
  'widget/DocumentView',
  'widget/RepositoryExplorerWidget',
]);
const ownerDirectoryExists = (owner: { kind: string; name: string }) =>
  existingOwners.has(`${owner.kind}/${owner.name}`);

const BASE_INVENTORY: RawE2ESpecInventoryEntry[] = [
  { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
  { specPath: 'tests/e2e/pages/Settings/settingsToggles.e2e.spec.ts', annotations: [] },
  {
    specPath:
      'tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts',
    annotations: [],
  },
  {
    specPath:
      'tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts',
    annotations: [],
  },
  {
    specPath:
      'tests/e2e/widgets/DocumentView/productionArtifact/managedReleaseDataCompatibility.e2e.spec.ts',
    annotations: [],
  },
  {
    specPath: 'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts',
    annotations: [],
  },
];

function baseDeps(overrides: Parameters<typeof resolveStructuralE2EPlan>[1] = {}) {
  return {
    fileExists: () => true,
    ownerDirectoryExists,
    collectOwnerInventory: () => BASE_INVENTORY,
    acquireGraph: () => ({ ok: true as const, graph: {} }),
    ...overrides,
  };
}

describe('isRelevantProductionSourcePath', () => {
  it('flags production TS/Vue source under src/', () => {
    expect(isRelevantProductionSourcePath('src/entities/repository/index.ts')).toBe(true);
    expect(isRelevantProductionSourcePath('src/widgets/DocumentView/DocumentView.vue')).toBe(true);
  });

  it('excludes test/story/helper suffixes and non-src paths', () => {
    expect(isRelevantProductionSourcePath('src/entities/repository/index.test.ts')).toBe(false);
    expect(isRelevantProductionSourcePath('src/entities/repository/index.stories.ts')).toBe(false);
    expect(isRelevantProductionSourcePath('docs/testing/architecture.md')).toBe(false);
    expect(isRelevantProductionSourcePath('src/entities/repository/tokens.css')).toBe(false);
  });
});

describe('resolveStructuralE2EPlan', () => {
  it('fails closed when the ownership inventory is invalid', () => {
    const plan = resolveStructuralE2EPlan([], baseDeps({ collectOwnerInventory: () => [] }));
    // Empty inventory is technically valid (no entries); force an invalid
    // one via a malformed entry instead.
    const invalidPlan = resolveStructuralE2EPlan(
      [],
      baseDeps({
        collectOwnerInventory: () => [{ specPath: 'tests/e2e/rogue.e2e.spec.ts', annotations: [] }],
      }),
    );

    expect(plan.mode).toBe('skip');
    expect(invalidPlan.mode).toBe('invalid');
  });

  it('fails closed when inventory collection throws', () => {
    const plan = resolveStructuralE2EPlan(
      [],
      baseDeps({
        collectOwnerInventory: () => {
          throw new Error('playwright --list crashed');
        },
      }),
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.mode === 'invalid' && plan.reasons[0]).toMatch(/could not be collected/);
  });

  it('returns skip for an empty relevant change set', () => {
    const plan = resolveStructuralE2EPlan([], baseDeps());
    expect(plan).toEqual({ mode: 'skip', reasons: ['empty e2e scope'] });
  });

  it('selects itself for a changed existing target E2E spec', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
      baseDeps(),
    );

    expect(plan.mode).toBe('focused');
    expect(plan.mode === 'focused' && plan.ordinarySpecs).toEqual([
      'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
    ]);
  });

  it('fails closed (invalid) for a changed spec whose owner directory is missing', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/GoneOwner/example.e2e.spec.ts'],
      baseDeps({ ownerDirectoryExists: (owner) => owner.name !== 'GoneOwner' }),
    );

    expect(plan.mode).toBe('invalid');
  });

  it('widens to the owner remaining inventory for a removed/moved spec with a still-valid owner', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/HomePane/oldAppSmoke.e2e.spec.ts'],
      baseDeps({ fileExists: () => false }),
    );

    expect(plan.mode).toBe('focused');
    expect(plan.mode === 'focused' && plan.ordinarySpecs).toEqual([
      'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
    ]);
    expect(plan.mode === 'focused' && plan.releaseSmokeSelected).toBe(true);
  });

  it('falls back to full E2E for a removed/moved spec whose owner no longer exists', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/GoneOwner/oldSpec.e2e.spec.ts'],
      baseDeps({
        fileExists: () => false,
        ownerDirectoryExists: (owner) => owner.name !== 'GoneOwner',
      }),
    );

    expect(plan.mode).toBe('full');
  });

  it('falls back to full E2E for a full-lane infrastructure change', () => {
    const plan = resolveStructuralE2EPlan(['playwright.config.ts'], baseDeps());
    expect(plan.mode).toBe('full');
  });

  it('falls back to full E2E for src/app and src/pages/routes.ts changes', () => {
    expect(resolveStructuralE2EPlan(['src/app/App.vue'], baseDeps()).mode).toBe('full');
    expect(resolveStructuralE2EPlan(['src/pages/routes.ts'], baseDeps()).mode).toBe('full');
  });

  it('falls back to full E2E when graph acquisition fails', () => {
    const plan = resolveStructuralE2EPlan(
      ['src/entities/repository/index.ts'],
      baseDeps({ acquireGraph: () => ({ ok: false, error: 'boom' }) }),
    );

    expect(plan.mode).toBe('full');
  });

  it('falls back to full E2E for a relevant change with no reachable owner', () => {
    const plan = resolveStructuralE2EPlan(
      ['src/shared/lib/unreached/example.ts'],
      baseDeps({ acquireGraph: () => ({ ok: true, graph: {} }) }),
    );

    expect(plan.mode).toBe('full');
  });

  it('selects owned specs reached through widget traversal that continues to a page', () => {
    const plan = resolveStructuralE2EPlan(
      ['src/entities/databaseData/index.ts'],
      baseDeps({
        acquireGraph: () => ({
          ok: true,
          graph: {
            'src/entities/databaseData/index.ts': ['src/widgets/DocumentView/DocumentView.vue'],
          },
        }),
      }),
    );

    expect(plan.mode).toBe('focused');
    expect(plan.mode === 'focused' && plan.managedUpdatesE2ESelected).toBe(true);
  });

  it('unions owners across multiple changed production paths', () => {
    const plan = resolveStructuralE2EPlan(
      ['src/entities/databaseData/index.ts', 'src/entities/repository/index.ts'],
      baseDeps({
        acquireGraph: () => ({
          ok: true,
          graph: {
            'src/entities/databaseData/index.ts': ['src/widgets/DocumentView/DocumentView.vue'],
            'src/entities/repository/index.ts': ['src/widgets/RepositoryExplorerWidget/index.ts'],
            'src/widgets/RepositoryExplorerWidget/index.ts': [],
          },
        }),
      }),
    );

    expect(plan.mode).toBe('focused');
    expect(plan.mode === 'focused' && plan.ordinarySpecs).toEqual([
      'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts',
    ]);
    expect(plan.mode === 'focused' && plan.managedUpdatesE2ESelected).toBe(true);
  });

  it('routes the HomePane productionArtifact owner to release-smoke and others to managed-updates-e2e', () => {
    const plan = resolveStructuralE2EPlan(
      [
        'tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts',
        'tests/e2e/pages/AppUpdatesPane/productionArtifact/managedUpdatesActivationUi.e2e.spec.ts',
      ],
      baseDeps(),
    );

    expect(plan.mode).toBe('focused');
    expect(plan.mode === 'focused' && plan.releaseSmokeSelected).toBe(true);
    expect(plan.mode === 'focused' && plan.managedUpdatesE2ESelected).toBe(true);
    expect(plan.mode === 'focused' && plan.ordinarySpecs).toEqual([]);
  });
});
