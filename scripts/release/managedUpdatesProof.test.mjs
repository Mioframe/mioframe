import { describe, expect, it, vi } from 'vitest';

import {
  MANAGED_UPDATES_CROSS_ENGINE_LABEL,
  MANAGED_UPDATES_CROSS_ENGINE_SPECS,
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

  it('group 2 contains exactly its three expected specs, controller-upgrade first', () => {
    expect(MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS).toEqual([
      'tests/e2e/release/managedUpdatesControllerUpgrade.spec.ts',
      'tests/e2e/release/managedUpdatesDevelop.spec.ts',
      'tests/e2e/release/managedUpdatesMigration.spec.ts',
    ]);
  });

  it('group 3 contains exactly the cross-engine spec', () => {
    expect(MANAGED_UPDATES_CROSS_ENGINE_SPECS).toEqual([
      'tests/e2e/release/managedUpdatesCrossEngineLifecycle.spec.ts',
    ]);
  });

  it('has no spec duplicated across the three groups', () => {
    const allGroupSpecs = [
      MANAGED_UPDATES_LIFECYCLE_SPECS,
      MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
      MANAGED_UPDATES_CROSS_ENGINE_SPECS,
    ];

    for (let i = 0; i < allGroupSpecs.length; i += 1) {
      for (let j = i + 1; j < allGroupSpecs.length; j += 1) {
        const overlap = allGroupSpecs[i].filter((spec) => allGroupSpecs[j].includes(spec));
        expect(overlap).toEqual([]);
      }
    }
  });

  it('the union is exactly the current eight-spec managed-update corpus', () => {
    const union = [
      ...MANAGED_UPDATES_LIFECYCLE_SPECS,
      ...MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
      ...MANAGED_UPDATES_CROSS_ENGINE_SPECS,
    ];

    expect(new Set(union)).toEqual(new Set(EXPECTED_CORPUS));
    expect(union).toHaveLength(EXPECTED_CORPUS.length);
  });

  it('exposes the groups in fixed run order: lifecycle, then migration/isolation, then cross-engine', () => {
    expect(MANAGED_UPDATES_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
      MANAGED_UPDATES_CROSS_ENGINE_LABEL,
    ]);
  });
});

describe('runManagedUpdatesProof ordering and propagation', () => {
  it('runs group 1, group 2, then group 3, each through scripts/e2eReleaseContainer.mjs with its own diagnostic label', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedUpdatesProof({ env: { EXAMPLE: '1' } }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(3);
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
    expect(runLocalCommand.mock.calls[2][0]).toMatchObject({
      command: 'node',
      args: [
        'scripts/e2eReleaseContainer.mjs',
        '--label',
        MANAGED_UPDATES_CROSS_ENGINE_LABEL,
        ...MANAGED_UPDATES_CROSS_ENGINE_SPECS,
      ],
    });
  });

  it('preserves the current environment values across every child invocation', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());
    const env = { EXAMPLE: '1', RELEASE_ARTIFACT_SKIP_BUILD: '1' };

    await runManagedUpdatesProof({ env }, { runLocalCommand });

    expect(runLocalCommand.mock.calls[0][0].env).toBe(env);
    expect(runLocalCommand.mock.calls[1][0].env).toBe(env);
    expect(runLocalCommand.mock.calls[2][0].env).toBe(env);
  });

  it('runs group 2 only after group 1 succeeds, and group 3 only after group 2 succeeds', async () => {
    const callOrder = [];
    const runLocalCommand = vi.fn(async ({ args }) => {
      callOrder.push(args[2]);
      return passingResult();
    });

    await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(callOrder).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
      MANAGED_UPDATES_CROSS_ENGINE_LABEL,
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

  it('stops before group 3 and returns the failing result when group 2 fails after group 1 passes', async () => {
    const runLocalCommand = vi
      .fn()
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce({ status: 1, signal: null });

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('becomes an aggregate failure when group 3 fails after groups 1 and 2 pass', async () => {
    const runLocalCommand = vi
      .fn()
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce({ status: 1, signal: null });

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('does not retry a failed group', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it('returns the passing result when all three groups succeed', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    const result = await runManagedUpdatesProof({ env: {} }, { runLocalCommand });

    expect(result).toEqual(passingResult());
  });
});
