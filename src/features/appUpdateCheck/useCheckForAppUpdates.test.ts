import { describe, expect, it, vi } from 'vitest';
import { useCheckForAppUpdates } from './useCheckForAppUpdates';

const checkForUpdatesMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/serviceClient/appUpdate', () => ({
  appUpdateClient: { checkForUpdates: checkForUpdatesMock },
}));

describe('useCheckForAppUpdates', () => {
  it('exposes only local check operation facts and the check action', async () => {
    checkForUpdatesMock.mockResolvedValue({ status: 'accepted' });
    const action = useCheckForAppUpdates();

    expect(Object.keys(action).sort()).toEqual(['checkForUpdates', 'pending', 'result']);
    await expect(action.checkForUpdates()).resolves.toEqual({ status: 'accepted' });
    expect(checkForUpdatesMock).toHaveBeenCalledOnce();
    expect(action.pending.value).toBe(false);
    expect(action.result.value).toEqual({ status: 'accepted' });
  });
});
