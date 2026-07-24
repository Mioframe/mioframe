import { describe, expect, it, vi } from 'vitest';
import { useChangeAppUpdateMode } from './useChangeAppUpdateMode';

const setModeMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/serviceClient/appUpdate', () => ({
  appUpdateClient: { setMode: setModeMock },
}));

describe('useChangeAppUpdateMode', () => {
  it('exposes only local mode-change facts and the mode action', async () => {
    setModeMock.mockResolvedValue({ status: 'accepted' });
    const action = useChangeAppUpdateMode();

    expect(Object.keys(action).sort()).toEqual(['pending', 'result', 'setMode']);
    await expect(action.setMode('manual')).resolves.toEqual({ status: 'accepted' });
    expect(setModeMock).toHaveBeenCalledExactlyOnceWith('manual');
    expect(action.pending.value).toBe(false);
    expect(action.result.value).toEqual({ status: 'accepted' });
  });
});
