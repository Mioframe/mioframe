import { describe, expect, it } from 'vitest';

import {
  formatOwnerId,
  getPageOwnerIdForSourcePath,
  getWidgetOwnerIdForSourcePath,
  ownerDirectoryExists,
  parseE2ETargetPath,
  parseOwnerId,
  validateE2ETargetPath,
} from './e2eOwner.ts';

describe('parseE2ETargetPath', () => {
  it('parses an ordinary page-owned target spec', () => {
    expect(parseE2ETargetPath('tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts')).toEqual({
      owner: { kind: 'page', name: 'HomePane' },
      isProductionArtifact: false,
    });
  });

  it('parses an ordinary widget-owned target spec', () => {
    expect(
      parseE2ETargetPath('tests/e2e/widgets/DocumentView/reorderSurfaceBottomSheet.e2e.spec.ts'),
    ).toEqual({
      owner: { kind: 'widget', name: 'DocumentView' },
      isProductionArtifact: false,
    });
  });

  it('parses a productionArtifact target spec', () => {
    expect(
      parseE2ETargetPath(
        'tests/e2e/pages/HomePane/productionArtifact/firstUserAndReturningUserSmoke.e2e.spec.ts',
      ),
    ).toEqual({
      owner: { kind: 'page', name: 'HomePane' },
      isProductionArtifact: true,
    });
  });

  it('rejects a path outside pages/widgets', () => {
    expect(parseE2ETargetPath('tests/e2e/appSmoke.e2e.spec.ts')).toBeNull();
    expect(
      parseE2ETargetPath('tests/e2e/release/managedUpdatesActivationUi.e2e.spec.ts'),
    ).toBeNull();
  });

  it('rejects a non-.e2e.spec.ts suffix', () => {
    expect(parseE2ETargetPath('tests/e2e/pages/HomePane/appSmoke.spec.ts')).toBeNull();
  });
});

describe('formatOwnerId / parseOwnerId', () => {
  it('round-trips a page owner id', () => {
    const owner = { kind: 'page' as const, name: 'HomePane' };
    expect(formatOwnerId(owner)).toBe('page/HomePane');
    expect(parseOwnerId('page/HomePane')).toEqual(owner);
  });

  it('round-trips a widget owner id', () => {
    const owner = { kind: 'widget' as const, name: 'DocumentView' };
    expect(formatOwnerId(owner)).toBe('widget/DocumentView');
    expect(parseOwnerId('widget/DocumentView')).toEqual(owner);
  });

  it('rejects a malformed owner id', () => {
    expect(parseOwnerId('page:HomePane')).toBeNull();
    expect(parseOwnerId('entity/HomePane')).toBeNull();
    expect(parseOwnerId('page/')).toBeNull();
    expect(parseOwnerId('HomePane')).toBeNull();
  });
});

describe('ownerDirectoryExists', () => {
  it('checks the page/widget production directory via the injected seam', () => {
    const isDirectory = (dirPath: string) => dirPath === 'src/pages/HomePane';
    expect(ownerDirectoryExists({ kind: 'page', name: 'HomePane' }, { isDirectory })).toBe(true);
    expect(ownerDirectoryExists({ kind: 'widget', name: 'HomePane' }, { isDirectory })).toBe(false);
    expect(ownerDirectoryExists({ kind: 'page', name: 'Missing' }, { isDirectory })).toBe(false);
  });
});

describe('validateE2ETargetPath', () => {
  it('accepts a structurally valid path whose owner exists', () => {
    const result = validateE2ETargetPath('tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', {
      ownerDirectoryExists: () => true,
    });
    expect(result).toEqual({
      valid: true,
      parsed: { owner: { kind: 'page', name: 'HomePane' }, isProductionArtifact: false },
      ownerId: 'page/HomePane',
      errors: [],
    });
  });

  it('fails a structurally invalid path', () => {
    const result = validateE2ETargetPath('tests/e2e/appSmoke.e2e.spec.ts', {
      ownerDirectoryExists: () => true,
    });
    expect(result.valid).toBe(false);
    expect(result.parsed).toBeNull();
    expect(result.errors[0]).toMatch(/outside the valid pages\/widgets owner structure/);
  });

  it('fails a structurally valid path whose owner does not exist in production', () => {
    const result = validateE2ETargetPath('tests/e2e/pages/GoneOwner/example.e2e.spec.ts', {
      ownerDirectoryExists: () => false,
    });
    expect(result.valid).toBe(false);
    expect(result.ownerId).toBe('page/GoneOwner');
    expect(result.errors[0]).toMatch(/no matching production directory/);
  });
});

describe('getPageOwnerIdForSourcePath / getWidgetOwnerIdForSourcePath', () => {
  it('resolves a page owner id for a source path directly under it', () => {
    expect(getPageOwnerIdForSourcePath('src/pages/HomePane/HomePane.vue')).toBe('page/HomePane');
    expect(getPageOwnerIdForSourcePath('src/widgets/DocumentView/DocumentView.vue')).toBeNull();
  });

  it('resolves a widget owner id for a source path directly under it', () => {
    expect(getWidgetOwnerIdForSourcePath('src/widgets/DocumentView/index.ts')).toBe(
      'widget/DocumentView',
    );
    expect(getWidgetOwnerIdForSourcePath('src/pages/HomePane/HomePane.vue')).toBeNull();
  });
});
