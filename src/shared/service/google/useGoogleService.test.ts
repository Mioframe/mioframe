import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DRIVE_GOOGLE_SCOPE,
  USER_INFO_GOOGLE_SCOPE,
} from '@shared/lib/googleApi';

const requestTokenMock = vi.fn();
const userinfoGetMock = vi.fn();
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
    vi.clearAllMocks();

    getStoreMock.mockResolvedValue({});
    getMock.mockResolvedValue(undefined);
    updateMock.mockResolvedValue(undefined);
    getSessionListMock.mockResolvedValue([]);
    clearMock.mockResolvedValue(undefined);
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
        reason: expect.objectContaining({ message: 'auth failed' }),
      }),
      expect.objectContaining({
        status: 'rejected',
        reason: expect.objectContaining({ message: 'auth failed' }),
      }),
    ]);
    expect(requestTokenMock).toHaveBeenCalledTimes(1);

    const retryToken = await service.requestToken([scope], 'user@example.com');

    expect(retryToken).toBe('retry-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(2);
  });
});
