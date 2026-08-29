import { describe, expect, it } from 'vitest';

import {
  collectE2EOwnerInventory,
  COLLECTOR_INVOCATION,
  type RunOwnerInventoryCollectorResult,
} from './e2eOwnerInventoryCollector.ts';

function okCollector(stdout = ''): (resultFile: string) => RunOwnerInventoryCollectorResult {
  return () => ({ status: 0, stdout, stderr: '' });
}

describe('COLLECTOR_INVOCATION', () => {
  it('launches the narrow Node child collector, never a Playwright binary', () => {
    expect(COLLECTOR_INVOCATION.command).toBe('node');
    expect(COLLECTOR_INVOCATION.args).toEqual(['scripts/lib/e2eOwnerInventoryContainer.ts']);
    expect(COLLECTOR_INVOCATION.args.join(' ')).not.toMatch(/playwright/i);
  });
});

describe('collectE2EOwnerInventory', () => {
  it('parses and filters the container collector result deterministically', () => {
    const result = collectE2EOwnerInventory({
      runCollector: okCollector(),
      readResultFile: () =>
        JSON.stringify([
          { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
          {
            specPath: 'tests/e2e/pages/AppUpdatesPane/appUpdate.browser-integration.spec.ts',
            annotations: [],
          },
        ]),
      removeResultFile: () => {},
    });

    expect(result).toEqual([
      { specPath: 'tests/e2e/pages/HomePane/appSmoke.e2e.spec.ts', annotations: [] },
    ]);
  });

  it('fails closed when the container collector exits non-zero', () => {
    expect(() =>
      collectE2EOwnerInventory({
        runCollector: () => ({ status: 1, stdout: '', stderr: 'boom' }),
        removeResultFile: () => {},
      }),
    ).toThrow(/container collection failed/);
  });

  it('fails closed when the result file is missing', () => {
    expect(() =>
      collectE2EOwnerInventory({
        runCollector: okCollector(),
        readResultFile: () => {
          throw new Error('ENOENT: no such file');
        },
        removeResultFile: () => {},
      }),
    ).toThrow(/was not produced/);
  });

  it('fails closed on malformed result JSON', () => {
    expect(() =>
      collectE2EOwnerInventory({
        runCollector: okCollector(),
        readResultFile: () => 'not json',
        removeResultFile: () => {},
      }),
    ).toThrow(/could not be parsed/);
  });

  it('fails closed when the result JSON is not a valid inventory array', () => {
    expect(() =>
      collectE2EOwnerInventory({
        runCollector: okCollector(),
        readResultFile: () => JSON.stringify({ not: 'an array' }),
        removeResultFile: () => {},
      }),
    ).toThrow(/did not contain a valid inventory array/);
  });

  it('fails closed when an inventory entry has the wrong shape', () => {
    expect(() =>
      collectE2EOwnerInventory({
        runCollector: okCollector(),
        readResultFile: () => JSON.stringify([{ specPath: 42, annotations: [] }]),
        removeResultFile: () => {},
      }),
    ).toThrow(/did not contain a valid inventory array/);
  });

  it('always removes the result file, even on failure', () => {
    let removed = false;

    expect(() =>
      collectE2EOwnerInventory({
        runCollector: () => ({ status: 1, stdout: '', stderr: 'boom' }),
        removeResultFile: () => {
          removed = true;
        },
      }),
    ).toThrow();

    expect(removed).toBe(true);
  });
});
