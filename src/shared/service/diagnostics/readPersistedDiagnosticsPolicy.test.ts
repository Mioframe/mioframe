import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('idb-keyval', () => ({
  get: (...args: unknown[]) => getMock(...args),
}));

describe('readPersistedDiagnosticsPolicy', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('reads the default idb-keyval store settings key', async () => {
    getMock.mockResolvedValue(undefined);
    const { readPersistedDiagnosticsPolicy } = await import('./readPersistedDiagnosticsPolicy');

    await readPersistedDiagnosticsPolicy();

    expect(getMock).toHaveBeenCalledWith('settings');
    expect(getMock).toHaveBeenCalledTimes(1);
  });

  it('resolves unknown when nothing is persisted', async () => {
    getMock.mockResolvedValue(undefined);
    const { readPersistedDiagnosticsPolicy } = await import('./readPersistedDiagnosticsPolicy');

    await expect(readPersistedDiagnosticsPolicy()).resolves.toBe('unknown');
  });

  it('resolves enabled when diagnosticsEnabled is true', async () => {
    getMock.mockResolvedValue({ diagnosticsEnabled: true, diagnosticsConsentRequested: true });
    const { readPersistedDiagnosticsPolicy } = await import('./readPersistedDiagnosticsPolicy');

    await expect(readPersistedDiagnosticsPolicy()).resolves.toBe('enabled');
  });

  it('resolves disabled when consent was requested and not enabled', async () => {
    getMock.mockResolvedValue({ diagnosticsEnabled: false, diagnosticsConsentRequested: true });
    const { readPersistedDiagnosticsPolicy } = await import('./readPersistedDiagnosticsPolicy');

    await expect(readPersistedDiagnosticsPolicy()).resolves.toBe('disabled');
  });

  it('fails closed to unknown on a storage read failure', async () => {
    getMock.mockRejectedValue(new Error('IndexedDB unavailable'));
    const { readPersistedDiagnosticsPolicy } = await import('./readPersistedDiagnosticsPolicy');

    await expect(readPersistedDiagnosticsPolicy()).resolves.toBe('unknown');
  });

  it('fails closed to unknown on a structurally invalid record', async () => {
    getMock.mockResolvedValue({ diagnosticsEnabled: 'yes' });
    const { readPersistedDiagnosticsPolicy } = await import('./readPersistedDiagnosticsPolicy');

    await expect(readPersistedDiagnosticsPolicy()).resolves.toBe('unknown');
  });
});
