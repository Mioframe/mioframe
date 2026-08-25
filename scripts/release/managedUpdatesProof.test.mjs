import { describe, expect, it, vi } from 'vitest';

import {
  MANAGED_UPDATES_ACTIVATION_UI_LABEL,
  MANAGED_UPDATES_ACTIVATION_UI_SPECS,
  MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS,
  MANAGED_UPDATES_CROSS_ENGINE_LABEL,
  MANAGED_UPDATES_CROSS_ENGINE_SPECS,
  MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS,
  MANAGED_UPDATES_E2E_GROUPS,
  MANAGED_UPDATES_LIFECYCLE_LABEL,
  MANAGED_UPDATES_LIFECYCLE_SPECS,
  MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
  MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
  runManagedUpdatesBrowserIntegrationProof,
  runManagedUpdatesE2EProof,
} from './managedUpdatesProof.mjs';
import { MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL } from './runManagedReleaseDataCompatibilityProof.mjs';

const EXPECTED_BROWSER_INTEGRATION_CORPUS = [
  'src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesDevelop.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesMigration.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesAutomaticCheck.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesControllerUpgrade.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesUncontrolledWindow.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesCrossEngineLifecycle.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesRecovery.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesVueBootFailure.browser-integration.spec.ts',
  'src/shared/service/appUpdate/managedUpdatesRollbackDiagnostics.browser-integration.spec.ts',
];

const EXPECTED_E2E_CORPUS = [
  'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
  'tests/e2e/release/managedReleaseDataCompatibility.spec.ts',
];

function passingResult() {
  return { status: 0, signal: null };
}

describe('MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS composition', () => {
  it('group 1 contains exactly its six expected specs, with controller artifact identity and activation-UI removed', () => {
    expect(MANAGED_UPDATES_LIFECYCLE_SPECS).toEqual([
      'src/shared/service/appUpdate/managedUpdatesLifecycle.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesAutomaticCheck.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesUncontrolledWindow.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesRecovery.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesVueBootFailure.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesRollbackDiagnostics.browser-integration.spec.ts',
    ]);
    expect(MANAGED_UPDATES_LIFECYCLE_SPECS).not.toContain(
      'src/shared/service/appUpdate/managedUpdatesControllerArtifactIdentity.browser-integration.spec.ts',
    );
    expect(MANAGED_UPDATES_LIFECYCLE_SPECS).not.toContain(
      'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
    );
  });

  it('group 2 contains exactly its three expected specs, controller-upgrade first, with controller artifact identity removed', () => {
    expect(MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS).toEqual([
      'src/shared/service/appUpdate/managedUpdatesControllerUpgrade.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesDevelop.browser-integration.spec.ts',
      'src/shared/service/appUpdate/managedUpdatesMigration.browser-integration.spec.ts',
    ]);
    expect(MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS).not.toContain(
      'src/shared/service/appUpdate/managedUpdatesControllerArtifactIdentity.browser-integration.spec.ts',
    );
  });

  it('group 3 contains exactly the cross-engine spec', () => {
    expect(MANAGED_UPDATES_CROSS_ENGINE_SPECS).toEqual([
      'src/shared/service/appUpdate/managedUpdatesCrossEngineLifecycle.browser-integration.spec.ts',
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

  it('the union is exactly the ten-spec browser-integration corpus', () => {
    const union = [
      ...MANAGED_UPDATES_LIFECYCLE_SPECS,
      ...MANAGED_UPDATES_MIGRATION_ISOLATION_SPECS,
      ...MANAGED_UPDATES_CROSS_ENGINE_SPECS,
    ];

    expect(new Set(union)).toEqual(new Set(EXPECTED_BROWSER_INTEGRATION_CORPUS));
    expect(union).toHaveLength(EXPECTED_BROWSER_INTEGRATION_CORPUS.length);
  });

  it('exposes the groups in fixed run order: lifecycle, then migration/isolation, then cross-engine', () => {
    expect(MANAGED_UPDATES_BROWSER_INTEGRATION_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_LIFECYCLE_LABEL,
      MANAGED_UPDATES_MIGRATION_ISOLATION_LABEL,
      MANAGED_UPDATES_CROSS_ENGINE_LABEL,
    ]);
  });
});

describe('MANAGED_UPDATES_E2E_GROUPS composition', () => {
  it('exposes exactly the activation-UI and data-compatibility E2E specs, in fixed run order', () => {
    expect(MANAGED_UPDATES_ACTIVATION_UI_SPECS).toEqual([
      'tests/e2e/release/managedUpdatesActivationUi.spec.ts',
    ]);
    expect(MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS).toEqual([
      'tests/e2e/release/managedReleaseDataCompatibility.spec.ts',
    ]);
    expect(MANAGED_UPDATES_E2E_GROUPS.map((group) => group.label)).toEqual([
      MANAGED_UPDATES_ACTIVATION_UI_LABEL,
      MANAGED_RELEASE_DATA_COMPATIBILITY_LABEL,
    ]);
  });

  it('the union is exactly the two-spec E2E corpus', () => {
    const union = [
      ...MANAGED_UPDATES_ACTIVATION_UI_SPECS,
      ...MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS,
    ];

    expect(new Set(union)).toEqual(new Set(EXPECTED_E2E_CORPUS));
    expect(union).toHaveLength(EXPECTED_E2E_CORPUS.length);
  });
});

describe('the browser-integration and E2E corpora do not overlap and together equal the historical managed-updates corpus', () => {
  it('has no spec shared between the two proof leaves', () => {
    const overlap = EXPECTED_BROWSER_INTEGRATION_CORPUS.filter((spec) =>
      EXPECTED_E2E_CORPUS.includes(spec),
    );

    expect(overlap).toEqual([]);
  });

  it('is exactly the historical thirteen-spec managed-update corpus, plus the now-static controller-identity spec removed from Playwright entirely', () => {
    const union = new Set([...EXPECTED_BROWSER_INTEGRATION_CORPUS, ...EXPECTED_E2E_CORPUS]);

    expect(union.size).toBe(12);
    expect(union.has('tests/e2e/release/managedUpdatesControllerArtifactIdentity.spec.ts')).toBe(
      false,
    );
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
    const callOrder = [];
    const runLocalCommand = vi.fn(async ({ args }) => {
      callOrder.push(args[2]);
      return passingResult();
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
        ...MANAGED_UPDATES_DATA_COMPATIBILITY_SPECS,
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
