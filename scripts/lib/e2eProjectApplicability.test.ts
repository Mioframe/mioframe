import { describe, expect, it } from 'vitest';

import {
  DESKTOP_PROJECT_NAME,
  E2E_PROJECT_APPLICABILITY,
  getProjectIgnoredSpecs,
  MOBILE_PROJECT_NAME,
  validateE2EProjectApplicability,
  type E2EProjectApplicability,
} from './e2eProjectApplicability.ts';

const MOBILE_ONLY_SPECS = ['tests/e2e/widgets/DocumentView/reorderSurfaceTouch.e2e.spec.ts'];

const BOTH_SPECS = [
  'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
  'tests/e2e/pages/Settings/settingsToggles.e2e.spec.ts',
  'tests/e2e/widgets/DocumentView/databaseVirtualizationFlows.e2e.spec.ts',
  'tests/e2e/widgets/DocumentView/reorderSurfaceBottomSheet.e2e.spec.ts',
];

describe('E2E_PROJECT_APPLICABILITY', () => {
  it('classifies every current target spec exactly as audited', () => {
    const bySpec = new Map(
      E2E_PROJECT_APPLICABILITY.map((entry) => [entry.spec, entry.applicability]),
    );

    for (const spec of MOBILE_ONLY_SPECS) {
      expect(bySpec.get(spec)).toBe('mobile');
    }

    for (const spec of BOTH_SPECS) {
      expect(bySpec.get(spec)).toBe('both');
    }

    const desktopSpecs = [...bySpec.entries()].filter(([spec]) => {
      return !MOBILE_ONLY_SPECS.includes(spec) && !BOTH_SPECS.includes(spec);
    });

    expect(desktopSpecs.every(([, applicability]) => applicability === 'desktop')).toBe(true);
    expect(bySpec.size).toBe(desktopSpecs.length + MOBILE_ONLY_SPECS.length + BOTH_SPECS.length);
  });

  it('classifies every productionArtifact target spec as desktop', () => {
    const productionArtifactEntries = E2E_PROJECT_APPLICABILITY.filter((entry) =>
      entry.spec.includes('/productionArtifact/'),
    );

    expect(productionArtifactEntries).toHaveLength(3);
    expect(productionArtifactEntries.every((entry) => entry.applicability === 'desktop')).toBe(
      true,
    );
  });
});

describe('getProjectIgnoredSpecs', () => {
  it('makes the desktop project ignore only mobile-only specs, as testDir-relative paths', () => {
    expect(getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME)).toEqual([
      'widgets/DocumentView/reorderSurfaceTouch.e2e.spec.ts',
    ]);
  });

  it('makes the Mobile Chrome project ignore only desktop-only specs, as testDir-relative paths', () => {
    const mobileIgnored = getProjectIgnoredSpecs(MOBILE_PROJECT_NAME);
    const desktopSpecs = E2E_PROJECT_APPLICABILITY.filter(
      (entry) => entry.applicability === 'desktop',
    ).map((entry) => entry.spec.replace('tests/e2e/', ''));

    expect(mobileIgnored).toEqual([...desktopSpecs].sort((a, b) => a.localeCompare(b)));
  });

  it('never ignores a both-applicability spec for either project', () => {
    const desktopIgnored = getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME);
    const mobileIgnored = getProjectIgnoredSpecs(MOBILE_PROJECT_NAME);

    for (const spec of BOTH_SPECS) {
      const relative = spec.replace('tests/e2e/', '');

      expect(desktopIgnored).not.toContain(relative);
      expect(mobileIgnored).not.toContain(relative);
    }
  });

  it('leaves an unclassified spec out of both ignore lists (fail-safe: runs in both projects)', () => {
    const entries = [
      {
        spec: 'tests/e2e/widgets/DocumentView/reorderSurfaceTouch.e2e.spec.ts',
        applicability: 'mobile' as const,
      },
    ];

    expect(getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME, entries)).not.toContain(
      'pages/HomePane/appSmoke.e2e.spec.ts',
    );
    expect(getProjectIgnoredSpecs(MOBILE_PROJECT_NAME, entries)).not.toContain(
      'pages/HomePane/appSmoke.e2e.spec.ts',
    );
  });

  it('produces a nested-path-safe pattern, not a bare basename', () => {
    const desktopIgnored = getProjectIgnoredSpecs(DESKTOP_PROJECT_NAME);

    for (const pattern of desktopIgnored) {
      expect(pattern).toContain('/');
    }
  });
});

describe('validateE2EProjectApplicability', () => {
  it('passes for the current registry', () => {
    expect(validateE2EProjectApplicability()).toEqual({ valid: true, errors: [] });
  });

  it('fails closed when a discovered target E2E spec has no applicability entry', () => {
    const validation = validateE2EProjectApplicability({
      entries: E2E_PROJECT_APPLICABILITY.filter(
        (entry) => entry.spec !== 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
      ),
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes(
          'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts has no project applicability entry',
        ),
      ),
    ).toBe(true);
  });

  it('fails closed when an entry references a missing spec', () => {
    const validation = validateE2EProjectApplicability({
      entries: [
        ...E2E_PROJECT_APPLICABILITY,
        { spec: 'tests/e2e/pages/HomePane/doesNotExist.e2e.spec.ts', applicability: 'desktop' },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('references missing spec tests/e2e/pages/HomePane/doesNotExist.e2e.spec.ts'),
      ),
    ).toBe(true);
  });

  it('fails closed when an entry references a non-target-e2e spec', () => {
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
    const targetSpec = 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts';

    const validation = validateE2EProjectApplicability({
      entries: [
        ...E2E_PROJECT_APPLICABILITY.filter((entry) => entry.spec !== targetSpec),
        { spec: targetSpec, applicability: invalidApplicability },
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) => error.includes('has invalid applicability value tablet')),
    ).toBe(true);
  });

  it('fails closed on a duplicate entry for the same spec', () => {
    const targetSpec = 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts';
    const validation = validateE2EProjectApplicability({
      entries: [...E2E_PROJECT_APPLICABILITY, { spec: targetSpec, applicability: 'desktop' }],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes(`duplicate project applicability entry for spec ${targetSpec}`),
      ),
    ).toBe(true);
  });

  it('fails closed when the whole registry is empty', () => {
    const validation = validateE2EProjectApplicability({
      entries: [],
      findTargetSpecFiles: () => ['tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts'],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes('tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts has no project'),
      ),
    ).toBe(true);
  });

  it('recursively discovers a target spec nested arbitrarily deep under an owner', () => {
    const validation = validateE2EProjectApplicability({
      entries: E2E_PROJECT_APPLICABILITY,
      findTargetSpecFiles: () => [
        ...E2E_PROJECT_APPLICABILITY.map((entry) => entry.spec),
        'tests/e2e/widgets/DocumentView/nested/deeper/extra.e2e.spec.ts',
      ],
    });

    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((error) =>
        error.includes(
          'tests/e2e/widgets/DocumentView/nested/deeper/extra.e2e.spec.ts has no project',
        ),
      ),
    ).toBe(true);
  });
});
