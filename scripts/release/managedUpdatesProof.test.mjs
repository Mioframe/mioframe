import { describe, expect, it, vi } from 'vitest';

import {
  MANAGED_UPDATES_GROUPS,
  MANAGED_UPDATES_LIFECYCLE_LABEL,
  MANAGED_UPDATES_LIFECYCLE_SPECS,
  MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
  MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  runManagedUpdatesProof,
} from './managedUpdatesProof.mjs';

const EXPECTED_CORPUS = [
  'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
  'tests/e2e/release/managedUpdatesDevelop.spec.ts',
  'tests/e2e/release/managedUpdatesMigration.spec.ts',
  'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
  'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
  'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
  'tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts',
  'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
];

function passingResult() {
  return { status: 0, signal: null };
}

describe('MANAGED_UPDATES_GROUPS composition', () => {
  it('group 1 contains exactly its four expected specs', () => {
    expect(MANAGED_UPDATES_LIFECYCLE_SPECS).toEqual([
      'tests/e2e/release/managedUpdatesLifecycle.spec.ts',
      'tests/e2e/release/managedUpdatesAutomaticCheck.spec.ts',
      'tests/e2e/release/managedUpdatesUncontrolledWindow.spec.ts',
      'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
    ]);
  });

  it('group 2 contains exactly its four expected specs', () => {
    expect(MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS).toEqual([
      'tests/e2e/release/managedUpdatesDevelop.spec.ts',
      'tests/e2e/release/managedUpdatesMigration.spec.ts',
      'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
      'tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts',
    ]);
  });

  it('has no spec duplicated across the two groups', () => {
    const overlap = MANAGED_UPDATES_LIFECYCLE_SPECS.filter((spec) =>
      MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS.includes(spec),
    );

    expect(overlap).toEqual([]);
  });

  it('the union is exactly the current eight-spec managed-update corpus', () => {
    const union = [
      ...MANAGED_UPDATES_LIFECYCLE_SPECS,
      ...MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
    ];

    expect(new Set(union)).toEqual(new Set(EXPECTED_CORPUS));
    expect(union).toHaveLength(EXPECTED_CORPUS.length);
  });

  it('exposes the groups in fixed run order: lifecycle then migration/isolation', () => {
    expect(MANAGED_UPDATES_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
    ]);
  });
});

describe('runManagedUpdatesProof ordering and propagation', () => {
  it('runs group 1 before group 2, each through scripts/e2eReleaseContainer.mjs with its own diagnostic label', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedUpdatesProof({ env: { EXAMPLE: '1' } }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    expect(runLocalCommand.mock.calls[0][0]).toMatchObject({
      command: 'node',
      args: [
        'scripts/e2eReleaseContainer.mjs',
        '--label',
        MANAGED_UPDATES_LIFECYCLE_LABEL,
        ...MANAGED_UPDATES_LIFECYCLE_SPECS,
      ],
    });
    expect(runLocalCommand.mock.calls[1][0]).toMatchObject({
      command: 'node',
      args: [
        'scripts/e2eReleaseContainer.mjs',
        '--label',
        MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
        ...MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
      ],
    });
  });

  it('preserves the current environment values across both child invocations', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());
    const env = { EXAMPLE: '1', RELEASE_ARTIFACT_SKIP_BUILD: '1' };

    await runManagedUpdatesProof({ env }, { runLocalCommand });

    expect(runLocalCommand.mock.calls[0][0].env).toBe(env);
    expect(runLocalCommand.mock.calls[1][0].env).toBe(env);
  });

  it('runs group 2 only after group 1 succeeds', async () => {
    const callOrder = [];
    const runLocalCommand = vi.fn(async ({ args }) => {
      callOrder.push(args[2]);
      return passingResult();
    });

    await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(callOrder).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
    ]);
  });

  it('stops execution and returns the failing result when group 1 fails', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('stops execution and preserves the signal when group 1 is terminated', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: null, signal: 'SIGTERM' });

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: null, signal: 'SIGTERM' });
  });

  it('becomes an aggregate failure when group 2 fails after group 1 passes', async () => {
    const runLocalCommand = vi
      .fn()
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce({ status: 1, signal: null });

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('does not retry a failed group', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it('returns the passing result when both groups succeed', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(result).toEqual(passingResult());
  });
});
