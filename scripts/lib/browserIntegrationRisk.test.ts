import { describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import {
  isAppUpdateBrowserIntegrationSpecPath,
  isAppUpdateProductionPath,
  isFullBrowserIntegrationLanePath,
  isGenericBrowserIntegrationSpecPath,
  PRODUCTION_ARTIFACT_SMOKE_SPEC,
  resolveBrowserIntegrationPlan,
  resolveGenericBrowserIntegrationPlan,
} from './browserIntegrationRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);
const alwaysValidMembership = () => ({ valid: true, errors: [] });

const GENERIC_SPEC =
  'src/entities/browserStoragePersistence/browserStoragePersistence.browser-integration.spec.ts';

const APP_UPDATE_DIR = 'src/shared/service/appUpdate/';
const LIFECYCLE_SPEC = `${APP_UPDATE_DIR}managedUpdatesLifecycle.browser-integration.spec.ts`;
const CROSS_ENGINE_SPEC = `${APP_UPDATE_DIR}managedUpdatesCrossEngineLifecycle.browser-integration.spec.ts`;

describe('isAppUpdateBrowserIntegrationSpecPath', () => {
  it('flags the artifact spec and other appUpdate browser-integration specs', () => {
    expect(isAppUpdateBrowserIntegrationSpecPath(PRODUCTION_ARTIFACT_SMOKE_SPEC)).toBe(true);
    expect(isAppUpdateBrowserIntegrationSpecPath(LIFECYCLE_SPEC)).toBe(true);
  });

  it('does not flag production/test files or specs outside appUpdate', () => {
    expect(isAppUpdateBrowserIntegrationSpecPath(`${APP_UPDATE_DIR}workerInstall.ts`)).toBe(false);
    expect(isAppUpdateBrowserIntegrationSpecPath(`${APP_UPDATE_DIR}workerInstall.test.ts`)).toBe(
      false,
    );
    expect(
      isAppUpdateBrowserIntegrationSpecPath(
        'src/shared/service/otherOwner/example.browser-integration.spec.ts',
      ),
    ).toBe(false);
  });

  it('does not flag a nested browser-integration spec', () => {
    expect(
      isAppUpdateBrowserIntegrationSpecPath(
        `${APP_UPDATE_DIR}nested/Example.browser-integration.spec.ts`,
      ),
    ).toBe(false);
  });
});

describe('isAppUpdateProductionPath', () => {
  it('flags an appUpdate production source file', () => {
    expect(isAppUpdateProductionPath(`${APP_UPDATE_DIR}workerInstall.ts`)).toBe(true);
  });

  it('does not flag a browser-integration spec, a unit test, or a test helper', () => {
    expect(isAppUpdateProductionPath(PRODUCTION_ARTIFACT_SMOKE_SPEC)).toBe(false);
    expect(isAppUpdateProductionPath(`${APP_UPDATE_DIR}workerInstall.test.ts`)).toBe(false);
    expect(isAppUpdateProductionPath(`${APP_UPDATE_DIR}fakeCacheStorage.testUtils.ts`)).toBe(false);
  });

  it('does not flag a file outside appUpdate', () => {
    expect(isAppUpdateProductionPath('src/shared/service/otherOwner/example.ts')).toBe(false);
  });
});

describe('isFullBrowserIntegrationLanePath', () => {
  it('flags release Playwright/container infrastructure and the verifier planner', () => {
    expect(isFullBrowserIntegrationLanePath('playwright.release.config.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/e2eReleaseContainer.mjs')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/playwrightContainer.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/release/managedUpdatesProof.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/lib/browserIntegrationRisk.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/lib/releaseProofInventory.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/verify.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('config/tooling.json')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('pnpm-lock.yaml')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('vite.config.ts')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/release/artifactServer.mjs')).toBe(true);
  });

  it('flags the shared managed-release fixture and real publisher/build support', () => {
    expect(
      isFullBrowserIntegrationLanePath('tests/e2e/release/fixtures/managedReleaseFixture.mjs'),
    ).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/pages/lib/releasePublish.mjs')).toBe(true);
    expect(isFullBrowserIntegrationLanePath('scripts/pages/lib/pagesFs.mjs')).toBe(true);
  });

  it('does not flag unrelated paths', () => {
    expect(isFullBrowserIntegrationLanePath('src/features/documentCreate/index.ts')).toBe(false);
  });
});

describe('resolveBrowserIntegrationPlan', () => {
  it('reports skip for an unrelated changed-file set', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);
    const plan = resolveBrowserIntegrationPlan(['src/features/documentCreate/index.ts'], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan).toEqual({
      mode: 'skip',
      artifact: false,
      managedUpdates: false,
      reasons: ['empty browser-integration scope'],
    });
  });

  it('fails closed when the appUpdate filesystem inventory does not match the registered inventory', () => {
    const plan = resolveBrowserIntegrationPlan(['src/features/documentCreate/index.ts'], {
      validateMembership: () => ({
        valid: false,
        errors: ['appUpdate browser-integration spec X exists on disk but is not registered'],
      }),
    });

    expect(plan.mode).toBe('invalid');
    expect(plan.artifact).toBe(false);
    expect(plan.managedUpdates).toBe(false);
    expect(plan.reasons).toEqual([
      'appUpdate browser-integration spec X exists on disk but is not registered',
    ]);
  });

  it('selects only the artifact leaf for a direct productionArtifactSmoke spec change', () => {
    const plan = resolveBrowserIntegrationPlan([PRODUCTION_ARTIFACT_SMOKE_SPEC], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(false);
  });

  it('selects only the artifact leaf for an added productionArtifactSmoke spec', () => {
    const plan = resolveBrowserIntegrationPlan([PRODUCTION_ARTIFACT_SMOKE_SPEC], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(false);
  });

  it('selects only the artifact leaf for a removed productionArtifactSmoke spec (moved path identity still matched)', () => {
    // The planner selects by changed path identity alone; add/modify/remove
    // status is resolved upstream by scripts/lib/changedPaths.ts before this
    // resolver runs, so a removed spec still surfaces here as its own path.
    const plan = resolveBrowserIntegrationPlan([PRODUCTION_ARTIFACT_SMOKE_SPEC], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.artifact).toBe(true);
  });

  it('selects only the managed-updates-browser-integration leaf for a direct managed-update spec change', () => {
    const plan = resolveBrowserIntegrationPlan([LIFECYCLE_SPEC], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.artifact).toBe(false);
    expect(plan.managedUpdates).toBe(true);
  });

  it('selects only the managed-updates-browser-integration leaf for the cross-engine spec', () => {
    const plan = resolveBrowserIntegrationPlan([CROSS_ENGINE_SPEC], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.managedUpdates).toBe(true);
    expect(plan.artifact).toBe(false);
  });

  it('selects both leaves for an appUpdate production source change', () => {
    const plan = resolveBrowserIntegrationPlan([`${APP_UPDATE_DIR}workerInstall.ts`], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(true);
  });

  it('does not select either leaf for an appUpdate unit test or test helper change', () => {
    const plan = resolveBrowserIntegrationPlan(
      [`${APP_UPDATE_DIR}workerInstall.test.ts`, `${APP_UPDATE_DIR}fakeCacheStorage.testUtils.ts`],
      { validateMembership: alwaysValidMembership },
    );

    expect(plan.mode).toBe('skip');
  });

  it('unions leaves from multiple distinct changed specs', () => {
    const plan = resolveBrowserIntegrationPlan([PRODUCTION_ARTIFACT_SMOKE_SPEC, LIFECYCLE_SPEC], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(true);
  });

  it('runs the full lane for release Playwright/orchestration infrastructure', () => {
    const plan = resolveBrowserIntegrationPlan(['playwright.release.config.ts'], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('full');
    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(true);
    expect(plan.reasons[0]).toContain('browser-integration infrastructure path');
  });

  it('runs the full lane for a managedUpdatesProof.ts change even alongside an unrelated file', () => {
    const plan = resolveBrowserIntegrationPlan(
      ['scripts/release/managedUpdatesProof.ts', 'src/features/documentCreate/index.ts'],
      { validateMembership: alwaysValidMembership },
    );

    expect(plan.mode).toBe('full');
    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(true);
  });

  it('runs the full lane for a runtime-relevant package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);
    const plan = resolveBrowserIntegrationPlan(['package.json'], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('full');
    expect(plan.artifact).toBe(true);
    expect(plan.managedUpdates).toBe(true);
  });

  it('does not run the full lane for a version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);
    const plan = resolveBrowserIntegrationPlan(['package.json'], {
      validateMembership: alwaysValidMembership,
    });

    expect(plan.mode).toBe('skip');
  });
});

describe('isGenericBrowserIntegrationSpecPath', () => {
  it('flags a generic non-appUpdate browser-integration spec', () => {
    expect(isGenericBrowserIntegrationSpecPath(GENERIC_SPEC)).toBe(true);
  });

  it('never flags an appUpdate browser-integration spec', () => {
    expect(isGenericBrowserIntegrationSpecPath(PRODUCTION_ARTIFACT_SMOKE_SPEC)).toBe(false);
  });

  it('does not flag production/test files', () => {
    expect(isGenericBrowserIntegrationSpecPath('src/entities/repository/index.ts')).toBe(false);
  });
});

describe('resolveGenericBrowserIntegrationPlan', () => {
  it('reports skip for an unrelated changed-file set', () => {
    const plan = resolveGenericBrowserIntegrationPlan(['src/features/documentCreate/index.ts']);

    expect(plan).toEqual({
      mode: 'skip',
      specs: [],
      reasons: ['empty generic browser-integration scope'],
    });
  });

  it('selects a direct existing generic spec change', () => {
    const plan = resolveGenericBrowserIntegrationPlan([GENERIC_SPEC], { fileExists: () => true });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([GENERIC_SPEC]);
  });

  it('widens to the complete inventory for a removed/moved generic spec', () => {
    const plan = resolveGenericBrowserIntegrationPlan([GENERIC_SPEC], {
      fileExists: () => false,
      listSpecs: () => [GENERIC_SPEC],
    });

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([GENERIC_SPEC]);
  });

  it('selects the sibling spec for a colocated production change', () => {
    const plan = resolveGenericBrowserIntegrationPlan(
      ['src/entities/browserStoragePersistence/useBrowserStoragePersistence.ts'],
      {
        listDirectoryFileNames: (dirPath) =>
          dirPath === 'src/entities/browserStoragePersistence'
            ? [
                'useBrowserStoragePersistence.ts',
                'browserStoragePersistence.browser-integration.spec.ts',
                'index.ts',
              ]
            : [],
      },
    );

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([GENERIC_SPEC]);
  });

  it('never selects an appUpdate production change', () => {
    const plan = resolveGenericBrowserIntegrationPlan([
      'src/shared/service/appUpdate/workerInstall.ts',
    ]);

    expect(plan.mode).toBe('skip');
  });

  it('runs the complete generic inventory for generic infrastructure changes', () => {
    const plan = resolveGenericBrowserIntegrationPlan(['playwright.browserIntegration.config.ts'], {
      listSpecs: () => [GENERIC_SPEC],
    });

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([GENERIC_SPEC]);
    expect(plan.reasons[0]).toContain('generic browser-integration infrastructure path');
  });
});
