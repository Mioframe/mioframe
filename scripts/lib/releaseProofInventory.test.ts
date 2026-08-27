import { describe, expect, it } from 'vitest';

import {
  MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
  MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
  MANAGED_UPDATES_ACTIVATION_UI_LABEL,
  MANAGED_UPDATES_ACTIVATION_UI_SPECS,
  MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS,
  MANAGED_UPDATES_CROSS_ENGINE_LABEL,
  MANAGED_UPDATES_CROSS_ENGINE_SPECS,
  MANAGED_UPDATES_E2E_GROUPS,
  MANAGED_UPDATES_LIFECYCLE_LABEL,
  MANAGED_UPDATES_LIFECYCLE_SPECS,
  MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
  MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  PRODUCTION_ARTIFACT_SMOKE_SPEC,
  REGISTERED_BROWSER_INTEGRATION_SPECS,
  REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS,
  RELEASE_SMOKE_SPEC,
  validateBrowserIntegrationMembership,
  validateProductionArtifactE2EMembership,
} from './releaseProofInventory.ts';

function basename(specPath: string): string {
  const segments = specPath.split('/');
  return segments[segments.length - 1] ?? specPath;
}

describe('registered exceptional release-proof inventory', () => {
  it('exposes the browser-integration groups in fixed run order', () => {
    expect(MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
      MANAGED_UPDATES_CROSS_ENGINE_LABEL,
    ]);
  });

  it('exposes the E2E groups in fixed run order', () => {
    expect(MANAGED_UPDATES_E2E_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_ACTIVATION_UI_LABEL,
      MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
    ]);
  });

  it('has no spec duplicated across the registered browser-integration inventory', () => {
    const duplicates = REGISTERED_BROWSER_INTEGRATION_SPECS.filter(
      (spec, index) => REGISTERED_BROWSER_INTEGRATION_SPECS.indexOf(spec) !== index,
    );

    expect(duplicates).toEqual([]);
    expect(REGISTERED_BROWSER_INTEGRATION_SPECS).toContain(PRODUCTION_ARTIFACT_SMOKE_SPEC);
  });

  it('has no spec duplicated across the registered productionArtifact E2E inventory', () => {
    const duplicates = REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.filter(
      (spec, index) => REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.indexOf(spec) !== index,
    );

    expect(duplicates).toEqual([]);
    expect(REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS).toContain(RELEASE_SMOKE_SPEC);
  });

  it('has no spec shared between the browser-integration and E2E registries', () => {
    const overlap = REGISTERED_BROWSER_INTEGRATION_SPECS.filter((spec) =>
      REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.includes(spec),
    );

    expect(overlap).toEqual([]);
  });

  it('the browser-integration registry is exactly the artifact spec plus the ten managed-update specs', () => {
    expect(REGISTERED_BROWSER_INTEGRATION_SPECS).toHaveLength(11);
    expect(new Set(REGISTERED_BROWSER_INTEGRATION_SPECS)).toEqual(
      new Set([
        PRODUCTION_ARTIFACT_SMOKE_SPEC,
        ...MANAGED_UPDATES_LIFECYCLE_SPECS,
        ...MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
        ...MANAGED_UPDATES_CROSS_ENGINE_SPECS,
      ]),
    );
  });

  it('the productionArtifact E2E registry is exactly release-smoke plus the two managed-update specs', () => {
    expect(REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS).toHaveLength(3);
    expect(new Set(REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS)).toEqual(
      new Set([
        RELEASE_SMOKE_SPEC,
        ...MANAGED_UPDATES_ACTIVATION_UI_SPECS,
        MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
      ]),
    );
  });
});

describe('validateBrowserIntegrationMembership', () => {
  it('passes when the filesystem listing equals the registered inventory exactly', () => {
    const listDirectoryFileNames = () =>
      REGISTERED_BROWSER_INTEGRATION_SPECS.map((spec) => basename(spec));

    const result = validateBrowserIntegrationMembership({ listDirectoryFileNames });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails closed when a filesystem spec is missing from the registry', () => {
    const listDirectoryFileNames = () => [
      ...REGISTERED_BROWSER_INTEGRATION_SPECS.map((spec) => basename(spec)),
      'unregisteredNewSpec.browser-integration.spec.ts',
    ];

    const result = validateBrowserIntegrationMembership({ listDirectoryFileNames });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      expect.stringContaining(
        'src/shared/service/appUpdate/unregisteredNewSpec.browser-integration.spec.ts exists on disk but is not registered',
      ),
    ]);
  });

  it('fails closed when a registered spec is missing from the filesystem', () => {
    const listDirectoryFileNames = () =>
      REGISTERED_BROWSER_INTEGRATION_SPECS.slice(1).map((spec) => basename(spec));

    const result = validateBrowserIntegrationMembership({ listDirectoryFileNames });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      expect.stringContaining(`${PRODUCTION_ARTIFACT_SMOKE_SPEC} is registered`),
    ]);
  });

  it('ignores non-browser-integration files in the same directory', () => {
    const listDirectoryFileNames = () => [
      ...REGISTERED_BROWSER_INTEGRATION_SPECS.map((spec) => basename(spec)),
      'workerInstall.ts',
      'workerInstall.test.ts',
    ];

    const result = validateBrowserIntegrationMembership({ listDirectoryFileNames });

    expect(result).toEqual({ valid: true, errors: [] });
  });
});

describe('validateProductionArtifactE2EMembership', () => {
  it('passes when the filesystem listing equals the registered inventory exactly', () => {
    const listFilesRecursively = (root: string) =>
      REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.filter((spec) => spec.startsWith(`${root}/`));

    const result = validateProductionArtifactE2EMembership({ listFilesRecursively });

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('fails closed when an unregistered productionArtifact spec exists on disk', () => {
    const unregistered =
      'tests/e2e/pages/HomePane/productionArtifact/unregisteredNewScenario.e2e.spec.ts';
    const listFilesRecursively = (root: string) => [
      ...REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.filter((spec) => spec.startsWith(`${root}/`)),
      ...(root === 'tests/e2e/pages' ? [unregistered] : []),
    ];

    const result = validateProductionArtifactE2EMembership({ listFilesRecursively });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([expect.stringContaining(`${unregistered} exists on disk`)]);
  });

  it('fails closed when a registered spec is missing from disk', () => {
    const listFilesRecursively = (root: string) =>
      REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.filter(
        (spec) => spec.startsWith(`${root}/`) && spec !== RELEASE_SMOKE_SPEC,
      );

    const result = validateProductionArtifactE2EMembership({ listFilesRecursively });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([expect.stringContaining(`${RELEASE_SMOKE_SPEC} is registered`)]);
  });

  it('ignores ordinary (non-productionArtifact) target E2E specs', () => {
    const listFilesRecursively = (root: string) => [
      ...REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.filter((spec) => spec.startsWith(`${root}/`)),
      ...(root === 'tests/e2e/pages' ? ['tests/e2e/pages/Settings/openSettings.e2e.spec.ts'] : []),
    ];

    const result = validateProductionArtifactE2EMembership({ listFilesRecursively });

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
