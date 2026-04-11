import { beforeEach, describe, expect, it, vi } from 'vitest';
import { USER_INFO_GOOGLE_SCOPE } from '@shared/lib/googleApi/types';
import { useGoogleSessionAdd } from './useGoogleSessionAdd';

const requestTokenMock = vi.fn();
const addSnackbarMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    google: {
      requestToken: requestTokenMock,
    },
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

describe('useGoogleSessionAdd', () => {
  beforeEach(() => {
    requestTokenMock.mockReset();
    addSnackbarMock.mockReset();
    requestTokenMock.mockResolvedValue(undefined);
  });

  it('requests the Google profile scope when adding an account', async () => {
    const { addAccount, isLoading } = useGoogleSessionAdd();

    await addAccount();

    expect(requestTokenMock).toHaveBeenCalledWith([USER_INFO_GOOGLE_SCOPE.userInfoProfile]);
    expect(isLoading.value).toBe(false);
    expect(addSnackbarMock).not.toHaveBeenCalled();
  });

  it('shows a snackbar when adding an account fails', async () => {
    requestTokenMock.mockRejectedValueOnce(new Error('Popup blocked'));

    const { addAccount, isLoading } = useGoogleSessionAdd();

    await addAccount();

    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Popup blocked',
    });
    expect(isLoading.value).toBe(false);
  });
});
