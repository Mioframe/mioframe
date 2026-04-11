import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGoogleSessionManage } from './useGoogleSessionManage';

const deleteSessionMock = vi.fn();
const revokeAccessMock = vi.fn();
const addSnackbarMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    google: {
      deleteSession: deleteSessionMock,
      revokeAccess: revokeAccessMock,
    },
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

describe('useGoogleSessionManage', () => {
  beforeEach(() => {
    deleteSessionMock.mockReset();
    revokeAccessMock.mockReset();
    addSnackbarMock.mockReset();
    deleteSessionMock.mockResolvedValue(undefined);
    revokeAccessMock.mockResolvedValue(undefined);
  });

  it('deletes the requested session and clears the active action afterwards', async () => {
    const { activeAction, deleteGoogleSession } = useGoogleSessionManage('user@example.com');

    await deleteGoogleSession();

    expect(deleteSessionMock).toHaveBeenCalledWith('user@example.com');
    expect(activeAction.value).toBeUndefined();
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('revokes the requested session and clears the active action afterwards', async () => {
    const { activeAction, revokeGoogleAccess } = useGoogleSessionManage('user@example.com');

    await revokeGoogleAccess();

    expect(revokeAccessMock).toHaveBeenCalledWith('user@example.com');
    expect(activeAction.value).toBeUndefined();
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows a snackbar when deleting a session fails', async () => {
    deleteSessionMock.mockRejectedValueOnce(new Error('Delete failed'));

    const { activeAction, deleteGoogleSession } = useGoogleSessionManage('user@example.com');

    await deleteGoogleSession();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Delete failed',
    });
    expect(activeAction.value).toBeUndefined();
  });

  it('shows a snackbar when revoking access fails', async () => {
    revokeAccessMock.mockRejectedValueOnce(new Error('Revoke failed'));

    const { activeAction, revokeGoogleAccess } = useGoogleSessionManage('user@example.com');

    await revokeGoogleAccess();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Revoke failed',
    });
    expect(activeAction.value).toBeUndefined();
  });
});
