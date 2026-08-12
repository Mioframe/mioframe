import { describe, expect, it, vi } from 'vitest';

const reportDiagnosticEventMock = vi.fn();
vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    reportDiagnosticEvent: (...args: unknown[]) => reportDiagnosticEventMock(...args),
  };
});

describe('reportActivationRolledBack', () => {
  it('reports appUpdate.activationRolledBack with only safe project-controlled tags', async () => {
    const { reportActivationRolledBack } = await import('./appUpdateDiagnosticEvents');

    reportActivationRolledBack('stable', 'bootFailed', 7, 6);

    expect(reportDiagnosticEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'appUpdate.activationRolledBack',
        safeTags: {
          channel: 'stable',
          trigger: 'bootFailed',
          managedReleaseNumber: '7',
          previousActiveReleaseNumber: '6',
        },
      }),
    );
  });

  it.each([
    'bootFailed',
    'bootOkExpired',
    'activationDeadlineExpired',
    'activationServeFailed',
  ] as const)('accepts the %s trigger', async (trigger) => {
    const { reportActivationRolledBack } = await import('./appUpdateDiagnosticEvents');

    expect(() => {
      reportActivationRolledBack('develop', trigger, 3, 2);
    }).not.toThrow();
  });
});

describe('reportRecoveryRequired', () => {
  it('reports appUpdate.recoveryRequired with only the safe classification, never raw state', async () => {
    const { reportRecoveryRequired } = await import('./appUpdateDiagnosticEvents');

    reportRecoveryRequired('stable', 'UPDATE_STORAGE_UNAVAILABLE');

    expect(reportDiagnosticEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'appUpdate.recoveryRequired',
        safeTags: { channel: 'stable', problemCode: 'UPDATE_STORAGE_UNAVAILABLE' },
      }),
    );
  });
});

describe('reportDiscoveryIdentityConflict', () => {
  it('reports appUpdate.discoveryIdentityConflict with only the safe releaseNumber, never the conflicting metadata', async () => {
    const { reportDiscoveryIdentityConflict } = await import('./appUpdateDiagnosticEvents');

    reportDiscoveryIdentityConflict('develop', 5);

    expect(reportDiagnosticEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'appUpdate.discoveryIdentityConflict',
        safeTags: { channel: 'develop', releaseNumber: '5' },
      }),
    );
  });
});
