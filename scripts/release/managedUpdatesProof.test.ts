import { describe, expect, it, vi } from 'vitest';

import {
  MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
  MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
  MANAGED_UPDATES_ACTIVATION_UI_SPECS,
  MANAGED_UPDATES_CROSS_ENGINE_SPECS,
  MANAGED_UPDATES_LIFECYCLE_LABEL,
  MANAGED_UPDATES_LIFECYCLE_SPECS,
  MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
  MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  REGISTERED_BROWSER_INTEGRATION_SPECS,
  REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS,
} from '../lib/releaseProofInventory.ts';
import {
  MANAGED_UPDATES_ACTIVATION_UI_LABEL,
  MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS,
  MANAGED_UPDATES_CROSS_ENGINE_LABEL,
  MANAGED_UPDATES_E2E_GROUPS,
  runManagedUpdatesBrowserIntegrationProof,
  runManagedUpdatesE2EProof,
} from './managedUpdatesProof.ts';

function passingResult() {
  return { status: 0, signal: null };
}

describe('MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS composition (via scripts/lib/releaseProofInventory.ts)', () => {
  it('the union across the three groups equals scripts/lib/releaseProofInventory.ts REGISTERED_BROWSER_INTEGRATION_SPECS minus the artifact spec', () => {
    const union = MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.flatMap((group) => group.specs);
    const expected = REGISTERED_BROWSER_INTEGRATION_SPECS.filter(
      (spec) => !spec.includes('productionArtifactSmoke'),
    );

    expect(new Set(union)).toEqual(new Set(expected));
    expect(union).toHaveLength(expected.length);
  });

  it('has no spec duplicated across the three groups', () => {
    const allGroupSpecs = MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.map((group) => group.specs);

    for (let i = 0; i < allGroupSpecs.length; i += 1) {
      for (let j = i + 1; j < allGroupSpecs.length; j += 1) {
        const overlap = allGroupSpecs[i].filter((spec) => allGroupSpecs[j].includes(spec));
        expect(overlap).toEqual([]);
      }
    }
  });

  it('exposes the groups in fixed run order: lifecycle, then migration/isolation, then cross-engine', () => {
    expect(MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
      MANAGED_UPDATES_CROSS_ENGINE_LABEL,
    ]);
  });
});

describe('MANAGED_UPDATES_E2E_GROUPS composition (via scripts/lib/releaseProofInventory.ts)', () => {
  it('the union across the two groups equals scripts/lib/releaseProofInventory.ts REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS minus release-smoke', () => {
    const union = MANAGED_UPDATES_E2E_GROUPS.flatMap((group) => group.specs);
    const expected = REGISTERED_PRODUCTION_ARTIFACT_E2E_SPECS.filter(
      (spec) => !spec.includes('firstUserAndReturningUserSmoke'),
    );

    expect(new Set(union)).toEqual(new Set(expected));
    expect(union).toHaveLength(expected.length);
  });

  it('exposes the activation-UI and data-compatibility groups in fixed run order', () => {
    expect(MANAGED_UPDATES_E2E_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_ACTIVATION_UI_LABEL,
      MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
    ]);
  });
});

describe('runManagedUpdatesBrowserIntegrationProof ordering and propagation', () => {
  it('runs group 1, group 2, then group 3, each through scripts/e2eReleaseContainer.mjs with its own diagnostic label', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedUpdatesBrowserIntegrationProof({ env: { EXAMPLE: '1' } }, { runLocalCommand });

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

    await runManagedUpdatesBrowserIntegrationProof({ env }, { runLocalCommand });

    expect(runLocalCommand.mock.calls[0][0].env).toBe(env);
    expect(runLocalCommand.mock.calls[1][0].env).toBe(env);
    expect(runLocalCommand.mock.calls[2][0].env).toBe(env);
  });

  it('runs group 2 only after group 1 succeeds, and group 3 only after group 2 succeeds', async () => {
    const callOrder: unknown[] = [];
    const runLocalCommand = vi.fn(({ args }: { args: readonly string[] }) => {
      callOrder.push(args[2]);
      return Promise.resolve(passingResult());
    });

    await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(callOrder).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
      MANAGED_UPDATES_CROSS_ENGINE_LABEL,
    ]);
  });

  it('stops execution and returns the failing result when group 1 fails', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    const result = await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('stops execution and preserves the signal when group 1 is terminated', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: null, signal: 'SIGTERM' });

    const result = await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: null, signal: 'SIGTERM' });
  });

  it('stops before group 3 and returns the failing result when group 2 fails after group 1 passes', async () => {
    const runLocalCommand = vi
      .fn()
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce({ status: 1, signal: null });

    const result = await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('becomes an aggregate failure when group 3 fails after groups 1 and 2 pass', async () => {
    const runLocalCommand = vi
      .fn()
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce(passingResult())
      .mockResolvedValueOnce({ status: 1, signal: null });

    const result = await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('does not retry a failed group', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
  });

  it('returns the passing result when all three groups succeed', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    const result = await runManagedUpdatesBrowserIntegrationProof({ env: {} }, { runLocalCommand });

    expect(result).toEqual(passingResult());
  });
});

describe('runManagedUpdatesE2EProof ordering and propagation', () => {
  it('runs activation-UI then data-compatibility, each through scripts/e2eReleaseContainer.mjs with its own diagnostic label', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    await runManagedUpdatesE2EProof({ env: { EXAMPLE: '1' } }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(2);
    expect(runLocalCommand.mock.calls[0][0]).toMatchObject({
      command: 'node',
      args: [
        'scripts/e2eReleaseContainer.mjs',
        '--label',
        MANAGED_UPDATES_ACTIVATION_UI_LABEL,
        ...MANAGED_UPDATES_ACTIVATION_UI_SPECS,
      ],
    });
    expect(runLocalCommand.mock.calls[1][0]).toMatchObject({
      command: 'node',
      args: [
        'scripts/e2eReleaseContainer.mjs',
        '--label',
        MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
        MANAGED_RELEASE_DATA_COMPATIBILITY_SPEC,
      ],
    });
  });

  it('stops before data-compatibility and returns the failing result when activation-UI fails', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue({ status: 1, signal: null });

    const result = await runManagedUpdatesE2EProof({ env: {} }, { runLocalCommand });

    expect(runLocalCommand).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ status: 1, signal: null });
  });

  it('returns the passing result when both groups succeed', async () => {
    const runLocalCommand = vi.fn().mockResolvedValue(passingResult());

    const result = await runManagedUpdatesE2EProof({ env: {} }, { runLocalCommand });

    expect(result).toEqual(passingResult());
  });
});
