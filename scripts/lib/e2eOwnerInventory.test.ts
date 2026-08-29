import { describe, expect, it } from 'vitest';

import {
  validateE2EOwnerInventory,
  validateE2EOwnerInventoryCompleteness,
  type RawE2ESpecInventoryEntry,
} from './e2eOwnerInventory.ts';

const existingOwners = new Set(['page/HomePane', 'widget/RepositoryExplorerWidget']);
const ownerDirectoryExists = (owner: { kind: string; name: string }) =>
  existingOwners.has(`${owner.kind}/${owner.name}`);

describe('validateE2EOwnerInventory', () => {
  it('accepts a valid inventory with no additional-owner annotations', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
      {
        specPath: 'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts',
        annotations: [{ type: 'slow' }],
      },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.entries).toEqual([
      {
        specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
        primaryOwnerId: 'page/HomePane',
        additionalOwnerIds: [],
        ownerIds: ['page/HomePane'],
        isProductionArtifact: false,
      },
      {
        specPath: 'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts',
        primaryOwnerId: 'widget/RepositoryExplorerWidget',
        additionalOwnerIds: [],
        ownerIds: ['widget/RepositoryExplorerWidget'],
        isProductionArtifact: false,
      },
    ]);
  });

  it('accepts a genuine additional-owner annotation and unions it', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      {
        specPath: 'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts',
        annotations: [{ type: '_mioframe-owner', description: 'page/HomePane' }],
      },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(true);
    expect(result.entries[0]?.ownerIds).toEqual([
      'widget/RepositoryExplorerWidget',
      'page/HomePane',
    ]);
  });

  it('accepts multiple distinct genuine additional owners', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      {
        specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
        annotations: [
          { type: '_mioframe-owner', description: 'widget/RepositoryExplorerWidget' },
          { type: '_mioframe-owner', description: 'widget/RepositoryExplorerWidget' },
        ],
      },
    ];

    // Same annotation collected from two tests in the same spec collapses to one owner.
    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(true);
    expect(result.entries[0]?.additionalOwnerIds).toEqual(['widget/RepositoryExplorerWidget']);
  });

  it('rejects a structurally invalid spec path', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      { specPath: 'tests/e2e/appSmoke.e2e.spec.ts', annotations: [] },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/outside the valid pages\/widgets owner structure/);
  });

  it('rejects a primary owner with no matching production directory', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      { specPath: 'tests/e2e/pages/GoneOwner/example.e2e.spec.ts', annotations: [] },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/no matching production directory/);
  });

  it('rejects an unknown additional-owner reference', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      {
        specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
        annotations: [{ type: '_mioframe-owner', description: 'widget/Missing' }],
      },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/no matching production directory/);
  });

  it('rejects a malformed additional-owner description', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      {
        specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
        annotations: [{ type: '_mioframe-owner', description: 'HomePane' }],
      },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/malformed/);
  });

  it('rejects an additional-owner annotation that repeats the primary owner', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      {
        specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts',
        annotations: [{ type: '_mioframe-owner', description: 'page/HomePane' }],
      },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/repeats its own primary owner/);
  });

  it('rejects a duplicate spec path in the inventory', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
      { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/duplicate target E2E ownership inventory entry/);
  });

  it('flags the current migrated inventory as requiring zero additional-owner annotations', () => {
    const entries: RawE2ESpecInventoryEntry[] = [
      { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
    ];

    const result = validateE2EOwnerInventory(entries, { ownerDirectoryExists });

    expect(result.entries.every((entry) => entry.additionalOwnerIds.length === 0)).toBe(true);
  });
});

describe('validateE2EOwnerInventoryCompleteness', () => {
  const a = 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts';
  const b = 'tests/e2e/widgets/RepositoryExplorerWidget/repositoryFlows.e2e.spec.ts';

  it('accepts an exactly matching filesystem/Playwright target set', () => {
    const result = validateE2EOwnerInventoryCompleteness([a, b], [a, b]);

    expect(result).toEqual({ valid: true, errors: [] });
  });

  it('rejects a filesystem target missing from the Playwright inventory', () => {
    const result = validateE2EOwnerInventoryCompleteness([a], [a, b]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      `target E2E spec ${b} exists on disk but was not collected by the Playwright ownership inventory (playwright.config.ts / playwright.release.config.ts)`,
    ]);
  });

  it('rejects a Playwright-collected target outside the current filesystem target inventory', () => {
    const result = validateE2EOwnerInventoryCompleteness([a, b], [a]);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      `Playwright ownership inventory collected target E2E spec ${b}, which is not part of the current filesystem target E2E tree`,
    ]);
  });

  it('rejects an empty Playwright inventory when filesystem targets exist', () => {
    const result = validateE2EOwnerInventoryCompleteness([], [a]);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('accepts two empty sets', () => {
    const result = validateE2EOwnerInventoryCompleteness([], []);

    expect(result).toEqual({ valid: true, errors: [] });
  });
});
