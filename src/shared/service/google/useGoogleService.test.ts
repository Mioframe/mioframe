import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DRIVE_GOOGLE_SCOPE,
  GoogleClientConfigError,
  USER_INFO_GOOGLE_SCOPE,
} from '@shared/lib/googleApi';
import type { GoogleAuthError } from './errors';
import { GoogleAuthErrorCode } from './errors';

const requestTokenMock = vi.fn();
const userinfoGetMock = vi.fn();
const revokeMock = vi.fn();
const updateMock = vi.fn();
const getMock = vi.fn();
const getStoreMock = vi.fn();
const getSessionListMock = vi.fn();
const clearMock = vi.fn();

vi.mock('../fileSystem', () => ({
  useFileSystemService: () => ({
    vfs: {
      createDirectory: vi.fn(),
      mount: vi.fn(),
    },
  }),
}));

vi.mock('@shared/lib/googleDriveFileSystemProvider', () => ({
  googleDriveFileSystemProvider: vi.fn(() => ({})),
}));

vi.mock('./googleSessionStore', () => ({
  useGoogleSessionStore: () => ({
    getStore: getStoreMock,
    update: updateMock,
    getSessionList: getSessionListMock,
    get: getMock,
    clear: clearMock,
    $sessions: {
      subscribe: () => ({
        unsubscribe: () => undefined,
      }),
    },
  }),
}));

describe('useGoogleService', () => {
  beforeEach(() => {
    vi.resetModules();
    requestTokenMock.mockReset();
    userinfoGetMock.mockReset();
    revokeMock.mockReset();
    updateMock.mockReset();
    getMock.mockReset();
    getStoreMock.mockReset();
    getSessionListMock.mockReset();
    clearMock.mockReset();

    getStoreMock.mockResolvedValue({});
    getMock.mockResolvedValue(undefined);
    updateMock.mockResolvedValue(undefined);
    getSessionListMock.mockResolvedValue([]);
    clearMock.mockResolvedValue(undefined);
    revokeMock.mockResolvedValue(undefined);
    userinfoGetMock.mockResolvedValue({
      result: { email: 'user@example.com' },
    });
  });

  const createService = async () => {
    const { useGoogleService } = await import('./useGoogleService');

    const service = useGoogleService();

    await service.bindGoogleApi({
      requestAccessToken: requestTokenMock,
      userinfoGet: userinfoGetMock,
      revoke: revokeMock,
    });

    return service;
  };

  it('deduplicates concurrent token requests for the same email and scopes', async () => {
    requestTokenMock.mockImplementation(async () => {
      await Promise.resolve();

      return {
        access_token: 'access-token',
        expires_in: '3600',
        scope:
          'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/userinfo.email',
      };
    });

    const service = await createService();
    const scope = DRIVE_GOOGLE_SCOPE.all;

    const [firstToken, secondToken] = await Promise.all([
      service.requestToken([scope], 'user@example.com'),
      service.requestToken([scope], 'user@example.com'),
    ]);

    expect(firstToken).toBe('access-token');
    expect(secondToken).toBe('access-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith({
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: expect.any(Number),
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });

  it('does not deduplicate requests for different scope sets', async () => {
    requestTokenMock
      .mockResolvedValueOnce({
        access_token: 'drive-token',
        expires_in: '3600',
        scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
      })
      .mockResolvedValueOnce({
        access_token: 'profile-token',
        expires_in: '3600',
        scope: `${USER_INFO_GOOGLE_SCOPE.userInfoProfile} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
      });

    const service = await createService();

    const [driveToken, profileToken] = await Promise.all([
      service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com'),
      service.requestToken(
        [USER_INFO_GOOGLE_SCOPE.userInfoProfile],
        'user@example.com',
      ),
    ]);

    expect(driveToken).toBe('drive-token');
    expect(profileToken).toBe('profile-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(2);
  });

  it('reuses a valid cached token without calling Google API', async () => {
    getMock.mockResolvedValue({
      accessToken: 'cached-token',
      expiresAt: Date.now() + 10 * 60 * 1000,
      scopes: [DRIVE_GOOGLE_SCOPE.all],
    });

    const service = await createService();

    const token = await service.requestToken(
      [DRIVE_GOOGLE_SCOPE.all],
      'user@example.com',
    );

    expect(token).toBe('cached-token');
    expect(requestTokenMock).not.toHaveBeenCalled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('retries after a failed in-flight request', async () => {
    requestTokenMock
      .mockRejectedValueOnce(new Error('auth failed'))
      .mockResolvedValueOnce({
        access_token: 'retry-token',
        expires_in: '3600',
        scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
      });

    const service = await createService();
    const scope = DRIVE_GOOGLE_SCOPE.all;

    const firstResults = await Promise.allSettled([
      service.requestToken([scope], 'user@example.com'),
      service.requestToken([scope], 'user@example.com'),
    ]);

    expect(firstResults).toEqual([
      expect.objectContaining({
        status: 'rejected',
        reason: expect.objectContaining({
          code: GoogleAuthErrorCode.reauthRequired,
          expectedEmail: 'user@example.com',
          name: 'GoogleAuthError',
        }),
      }),
      expect.objectContaining({
        status: 'rejected',
        reason: expect.objectContaining({
          code: GoogleAuthErrorCode.reauthRequired,
          expectedEmail: 'user@example.com',
          name: 'GoogleAuthError',
        }),
      }),
    ]);
    expect(requestTokenMock).toHaveBeenCalledTimes(1);

    const retryToken = await service.requestToken([scope], 'user@example.com');

    expect(retryToken).toBe('retry-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(2);
  });

  it('deletes a session without revoking access', async () => {
    getStoreMock.mockResolvedValue({
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: Date.now() + 1000,
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    });

    const service = await createService();

    await service.deleteSession('user@example.com');

    expect(revokeMock).not.toHaveBeenCalled();
    expect(updateMock).toHaveBeenCalledWith({});
  });

  it('revokes access and deletes the stored session', async () => {
    getMock.mockResolvedValue({
      accessToken: 'access-token',
      expiresAt: Date.now() + 1000,
      scopes: [DRIVE_GOOGLE_SCOPE.all],
    });
    getStoreMock.mockResolvedValue({
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: Date.now() + 1000,
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    });

    const service = await createService();

    await service.revokeAccess('user@example.com');

    expect(revokeMock).toHaveBeenCalledWith('access-token');
    expect(updateMock).toHaveBeenCalledWith({});
  });

  it('keeps the local session when revoke fails', async () => {
    getMock.mockResolvedValue({
      accessToken: 'access-token',
      expiresAt: Date.now() + 1000,
      scopes: [DRIVE_GOOGLE_SCOPE.all],
    });
    revokeMock.mockRejectedValueOnce(new Error('revoke failed'));

    const service = await createService();

    await expect(
      service.revokeAccess('user@example.com'),
    ).rejects.toMatchObject({
      code: GoogleAuthErrorCode.revokeFailed,
      email: 'user@example.com',
      name: 'GoogleAuthError',
    } satisfies Partial<GoogleAuthError>);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('normalizes blocked popup errors', async () => {
    const popupBlockedError: google.accounts.oauth2.ClientConfigError = {
      message: 'popup_failed_to_open',
      name: 'ClientConfigError',
      type: 'popup_failed_to_open',
    };

    requestTokenMock.mockRejectedValueOnce(
      new GoogleClientConfigError(popupBlockedError),
    );

    const service = await createService();

    await expect(
      service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com'),
    ).rejects.toMatchObject({
      code: GoogleAuthErrorCode.popupBlocked,
      expectedEmail: 'user@example.com',
      name: 'GoogleAuthError',
    } satisfies Partial<GoogleAuthError>);
  });

  it('stores a different account but rejects access for the expected one', async () => {
    requestTokenMock.mockResolvedValueOnce({
      access_token: 'other-token',
      expires_in: '3600',
      scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
    });
    userinfoGetMock.mockResolvedValueOnce({
      result: { email: 'other@example.com' },
    });

    const service = await createService();

    await expect(
      service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com'),
    ).rejects.toMatchObject({
      actualEmail: 'other@example.com',
      code: GoogleAuthErrorCode.accountMismatch,
      expectedEmail: 'user@example.com',
      name: 'GoogleAuthError',
    });
    expect(updateMock).toHaveBeenCalledWith({
      'other@example.com': {
        accessToken: 'other-token',
        expiresAt: expect.any(Number),
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });
});
