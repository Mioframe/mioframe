import { describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import {
  canChangedPathsAffectE2E,
  isRelevantProductionSourcePath,
  resolveStructuralE2EPlan,
} from './e2eRisk.ts';
import type { RawE2ESpecInventoryEntry } from './e2eOwnerInventory.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

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
    validateTargetTree: () => ({
      valid: true,
      errors: [],
      targetPaths: BASE_INVENTORY.map((entry) => entry.specPath),
    }),
    acquireGraph: () => ({ ok: true as const, graph: {} }),
    validateProductionArtifactMembership: () => ({ valid: true, errors: [] }),
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
  it('fails closed when the ownership inventory is structurally invalid', () => {
    const invalidPlan = resolveStructuralE2EPlan(
      [],
      baseDeps({
        collectOwnerInventory: () => [{ specPath: 'tests/e2e/rogue.e2e.spec.ts', annotations: [] }],
      }),
    );

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

  it('accepts a complete filesystem/Playwright target set as valid', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
      baseDeps(),
    );

    expect(plan.mode).toBe('focused');
  });

  it('fails closed instead of skip when the Playwright inventory is empty but filesystem targets exist', () => {
    const plan = resolveStructuralE2EPlan([], baseDeps({ collectOwnerInventory: () => [] }));

    expect(plan.mode).toBe('invalid');
    expect(plan.mode === 'invalid' && plan.reasons[0]).toMatch(
      /exists on disk but was not collected/,
    );
  });

  it('fails closed when a filesystem target is missing from the Playwright inventory', () => {
    const plan = resolveStructuralE2EPlan(
      [],
      baseDeps({
        validateTargetTree: () => ({
          valid: true,
          errors: [],
          targetPaths: [
            ...BASE_INVENTORY.map((entry) => entry.specPath),
            'tests/e2e/pages/Settings/appUpdatesEntry.e2e.spec.ts',
          ],
        }),
      }),
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.mode === 'invalid' && plan.reasons[0]).toMatch(
      /exists on disk but was not collected/,
    );
  });

  it('fails closed when Playwright collects a target outside the current filesystem target inventory', () => {
    const plan = resolveStructuralE2EPlan(
      [],
      baseDeps({
        collectOwnerInventory: () => [
          ...BASE_INVENTORY,
          { specPath: 'tests/e2e/pages/Settings/appUpdatesEntry.e2e.spec.ts', annotations: [] },
        ],
      }),
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.mode === 'invalid' && plan.reasons[0]).toMatch(
      /not part of the current filesystem target E2E tree/,
    );
  });

  it('fails closed on a duplicate collected Playwright target', () => {
    const plan = resolveStructuralE2EPlan(
      [],
      baseDeps({ collectOwnerInventory: () => [...BASE_INVENTORY, BASE_INVENTORY[0]] }),
    );

    expect(plan.mode).toBe('invalid');
  });

  it('never silently skips a direct changed existing target when Playwright discovery is incomplete', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
      baseDeps({
        collectOwnerInventory: () => [],
        validateTargetTree: () => ({
          valid: true,
          errors: [],
          targetPaths: ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
        }),
      }),
    );

    expect(plan.mode).toBe('invalid');
  });

  it('never silently skips a direct newly-added target when Playwright discovery is incomplete', () => {
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/Settings/appUpdatesEntry.e2e.spec.ts'],
      baseDeps({
        validateTargetTree: () => ({
          valid: true,
          errors: [],
          targetPaths: [
            ...BASE_INVENTORY.map((entry) => entry.specPath),
            'tests/e2e/pages/Settings/appUpdatesEntry.e2e.spec.ts',
          ],
        }),
      }),
    );

    expect(plan.mode).toBe('invalid');
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

  it('fails closed when the productionArtifact exceptional inventory does not match the registered inventory', () => {
    const plan = resolveStructuralE2EPlan(
      [],
      baseDeps({
        validateProductionArtifactMembership: () => ({
          valid: false,
          errors: ['productionArtifact E2E spec X exists on disk but is not registered'],
        }),
      }),
    );

    expect(plan.mode).toBe('invalid');
    expect(plan.mode === 'invalid' && plan.reasons).toEqual([
      'productionArtifact E2E spec X exists on disk but is not registered',
    ]);
  });

  it('never silently drops an unregistered productionArtifact target as skip', () => {
    // Even when the unregistered target itself is directly changed, the
    // registered-membership check runs before any spec routing/selection,
    // so this fails closed rather than silently omitting the target.
    const plan = resolveStructuralE2EPlan(
      ['tests/e2e/pages/HomePane/productionArtifact/newUnregisteredScenario.e2e.spec.ts'],
      baseDeps({
        validateProductionArtifactMembership: () => ({
          valid: false,
          errors: [
            'productionArtifact E2E spec tests/e2e/pages/HomePane/productionArtifact/newUnregisteredScenario.e2e.spec.ts exists on disk but is not registered',
          ],
        }),
      }),
    );

    expect(plan.mode).toBe('invalid');
  });
});

describe('canChangedPathsAffectE2E', () => {
  it('returns false for an empty changed-file set', () => {
    expect(canChangedPathsAffectE2E([])).toBe(false);
  });

  it('returns false for docs-only changes', () => {
    expect(canChangedPathsAffectE2E(['docs/testing/architecture.md'])).toBe(false);
  });

  it('returns false for an unrelated non-production change', () => {
    expect(canChangedPathsAffectE2E(['src/entities/repository/index.test.ts'])).toBe(false);
  });

  it('returns true for a direct target E2E spec change', () => {
    expect(canChangedPathsAffectE2E(['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'])).toBe(true);
  });

  it('returns true for full-lane E2E infrastructure', () => {
    expect(canChangedPathsAffectE2E(['playwright.config.ts'])).toBe(true);
  });

  it('returns true for app bootstrap/routing changes', () => {
    expect(canChangedPathsAffectE2E(['src/app/App.vue'])).toBe(true);
    expect(canChangedPathsAffectE2E(['src/pages/routes.ts'])).toBe(true);
  });

  it('returns true for relevant production source', () => {
    expect(canChangedPathsAffectE2E(['src/entities/repository/index.ts'])).toBe(true);
  });

  it('returns true for a runtime-relevant package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);
    expect(canChangedPathsAffectE2E(['package.json'])).toBe(true);
  });

  it('returns false for a version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);
    expect(canChangedPathsAffectE2E(['package.json'])).toBe(false);
  });
});
