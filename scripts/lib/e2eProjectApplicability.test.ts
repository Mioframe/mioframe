import { describe, expect, it } from 'vitest';

import {
  DESKTOP_PROJECT_NAME,
  E2E_PROJECT_APPLICABILITY,
  getProjectIgnoredSpecs,
  MOBILE_PROJECT_NAME,
  validateE2EProjectApplicability,
  type E2EProjectApplicability,
} from './e2eProjectApplicability.ts';

const MOBILE_ONLY_SPECS = ['tests/e2e/reorderSurfaceTouch.spec.ts'];

const DESKTOP_ONLY_SPECS = [
  'tests/e2e/appUpdatesNavigation.spec.ts',
  'tests/e2e/browserStoragePersistenceSmoke.spec.ts',
  'tests/e2e/databaseItemFlows.spec.ts',
  'tests/e2e/databasePersistenceSmoke.spec.ts',
  'tests/e2e/databasePropertyFlows.spec.ts',
  'tests/e2e/databaseViewsAndQueryFlows.spec.ts',
  'tests/e2e/exportDocumentBrowserStorage.spec.ts',
  'tests/e2e/helpNavigation.spec.ts',
  'tests/e2e/reorderSurfaceCancellation.spec.ts',
  'tests/e2e/reorderSurfaceMouse.spec.ts',
  'tests/e2e/reorderSurfacePersistence.spec.ts',
  'tests/e2e/repoExplorerScreen.spec.ts',
  'tests/e2e/repositoryFlows.spec.ts',
  'tests/e2e/zipActionFlows.spec.ts',
];

const BOTH_SPECS = [
  'tests/e2e/appSmoke.spec.ts',
  'tests/e2e/databaseVirtualizationFlows.spec.ts',
  'tests/e2e/reorderSurfaceBottomSheet.spec.ts',
];

describe('E2E_PROJECT_APPLICABILITY', () => {
  it('classifies every current spec exactly as audited', () => {
    const bySpec = new Map(
      E2E_PROJECT_APPLICABILITY.map((entry) => [entry.spec, entry.applicability]),
    );

    for (const spec of MOBILE_ONLY_SPECS) {
      expect(bySpec.get(spec)).toBe('mobile');
    }

    for (const spec of DESKTOP_ONLY_SPECS) {
      expect(bySpec.get(spec)).toBe('desktop');
    }

    for (const spec of BOTH_SPECS) {
      expect(bySpec.get(spec)).toBe('both');
    }

    expect(bySpec.size).toBe(
      MOBILE_ONLY_SPECS.length + DESKTOP_ONLY_SPECS.length + BOTH_SPECS.length,
    );
  });
});

describe('getProjectIgnoredSpecs', () => {
  it('makes the desktop project ignore only mobile-only specs', () => {
    expect(getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME)).toEqual(['reorderSurfaceTouch.spec.ts']);
  });

  it('makes the Mobile Chrome project ignore only desktop-only specs', () => {
    expect(getProjectIgnoredSpecs(MOBILE_PROJECT_NAME)).toEqual(
      [...DESKTOP_ONLY_SPECS].map((spec) => spec.replace('tests/e2e/', '')).sort(),
    );
  });

  it('never ignores a both-applicability spec for either project', () => {
    const desktopIgnored = getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME);
    const mobileIgnored = getProjectIgnoredSpecs(MOBILE_PROJECT_NAME);

    for (const spec of BOTH_SPECS) {
      const baseName = spec.replace('tests/e2e/', '');

      expect(desktopIgnored).not.toContain(baseName);
      expect(mobileIgnored).not.toContain(baseName);
    }
  });

  it('leaves an unclassified spec out of both ignore lists (fail-safe: runs in both projects)', () => {
    // No entry at all for tests/e2e/appSmoke.spec.ts: an unknown/unclassified
    // spec must never land in either project's ignore list, even though
    // other entries in the same registry are classified.
    const entries = [
      { spec: 'tests/e2e/reorderSurfaceTouch.spec.ts', applicability: 'mobile' as const },
    ];

    expect(getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME, entries)).not.toContain('appSmoke.spec.ts');
    expect(getProjectIgnoredSpecs(MOBILE_PROJECT_NAME, entries)).not.toContain('appSmoke.spec.ts');
  });
});

describe('validateE2EProjectApplicability', () => {
  it('passes for the current registry', () => {
    expect(validateE2EProjectApplicability()).toEqual({ valid: true, errors: [] });
  });

  it('fails closed when a discovered app e2e spec has no applicability entry', () => {
    const validation = validateE2EProjectApplicability({
      entries: E2E_PROJECT_APPLICABILITY.filter(
        (entry) => entry.spec !== 'tests/e2e/appSmoke.spec.ts',
      ),
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('tests/e2e/appSmoke.spec.ts has no project applicability entry'),
      ),
    ).toBe(true);
  });

  it('fails closed when an entry references a missing spec', () => {
    const validation = validateE2EProjectApplicability({
      entries: [
        ...E2E_PROJECT_APPLICABILITY,
        { spec: 'tests/e2e/doesNotExist.spec.ts', applicability: 'desktop' },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('references missing spec tests/e2e/doesNotExist.spec.ts'),
      ),
    ).toBe(true);
  });

  it('fails closed when an entry references a non-app-e2e spec', () => {
    const validation = validateE2EProjectApplicability({
      entries: [
        ...E2E_PROJECT_APPLICABILITY,
        { spec: 'tests/e2e/visual/shared-ui.spec.ts', applicability: 'desktop' },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('references non-app-e2e spec tests/e2e/visual/shared-ui.spec.ts'),
      ),
    ).toBe(true);
  });

  it('fails closed on an invalid applicability value', () => {
    // JSON.parse yields `any`, so this carries a runtime-invalid value
    // through the typed registry without a banned type assertion.
    const invalidApplicability: E2EProjectApplicability = JSON.parse('"tablet"');

    const validation = validateE2EProjectApplicability({
      entries: [
        ...E2E_PROJECT_APPLICABILITY.filter((entry) => entry.spec !== 'tests/e2e/appSmoke.spec.ts'),
        { spec: 'tests/e2e/appSmoke.spec.ts', applicability: invalidApplicability },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) => error.includes('has invalid applicability value tablet')),
    ).toBe(true);
  });

  it('fails closed on a duplicate entry for the same spec', () => {
    const validation = validateE2EProjectApplicability({
      entries: [
        ...E2E_PROJECT_APPLICABILITY,
        { spec: 'tests/e2e/appSmoke.spec.ts', applicability: 'desktop' },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('duplicate project applicability entry for spec tests/e2e/appSmoke.spec.ts'),
      ),
    ).toBe(true);
  });

  it('fails closed when the whole registry is empty', () => {
    const validation = validateE2EProjectApplicability({ entries: [] });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('tests/e2e/appSmoke.spec.ts has no project'),
      ),
    ).toBe(true);
  });
});
