import { describe, expect, it, vi } from 'vitest';
import { useApplyAppUpdate } from './useApplyAppUpdate';

const updateNowMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/serviceClient/appUpdate', () => ({
  appUpdateClient: { updateNow: updateNowMock },
}));

describe('useApplyAppUpdate', () => {
  it('exposes only local apply facts and the explicit update action', async () => {
    updateNowMock.mockResolvedValue({ status: 'accepted' });
    const action = useApplyAppUpdate();

    expect(Object.keys(action).sort()).toEqual(['pending', 'result', 'updateNow']);
    await expect(action.updateNow()).resolves.toEqual({ status: 'accepted' });
    expect(updateNowMock).toHaveBeenCalledOnce();
    expect(action.pending.value).toBe(false);
    expect(action.result.value).toEqual({ status: 'accepted' });
  });
});
