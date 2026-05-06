import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DRIVE_GOOGLE_SCOPE,
  GoogleClientConfigError,
  USER_INFO_GOOGLE_SCOPE,
} from '@shared/lib/googleApi';
import { googleDriveFileSystemProvider } from '@shared/lib/googleDriveFileSystemProvider';
import type { GoogleAuthError } from './errors';
import { GoogleAuthErrorCode } from './errors';
import { BehaviorSubject } from 'rxjs';
import type { GoogleSessionProfile } from './googleSessionProfile';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { FileSystemError, VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import type { IFileSystemProvider } from '@shared/lib/virtualFileSystem';

const requestTokenMock = vi.fn();
const userinfoGetMock = vi.fn();
const revokeMock = vi.fn();
const updateSessionStoreMock = vi.fn();
const getSessionMock = vi.fn();
const getSessionStoreMock = vi.fn();
const clearSessionStoreMock = vi.fn();
const createDirectoryMock = vi.fn();
const mountMock = vi.fn();
const unmountMock = vi.fn();

type SessionRecord = {
  accessToken: string;
  expiresAt: number;
  scopes: string[];
  profile?: GoogleSessionProfile;
};

type SessionStore = Record<string, SessionRecord | undefined>;

let sessionStoreValue: SessionStore;
let sessionsSubject: BehaviorSubject<string[]>;
let sessionStoreSubject: BehaviorSubject<SessionStore>;
let mockVfs: VirtualFileSystem;

const syncSessionsSubject = () => {
  sessionsSubject.next(Object.keys(sessionStoreValue));
};

const syncSessionStoreSubject = () => {
  sessionStoreSubject.next(sessionStoreValue);
};

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const createMockGoogleDriveProvider = () => {
  const provider = new MemoryFileSystem();

  return {
    createDirectory: provider.createDirectory.bind(provider),
    delete: provider.delete.bind(provider),
    move: provider.move.bind(provider),
    readDirectory: provider.readDirectory.bind(provider),
    readFile: provider.readFile.bind(provider),
    stat: provider.stat.bind(provider),
    watch: () => () => {},
    writeFile: provider.writeFile.bind(provider),
  };
};

vi.mock('../fileSystem', () => ({
  useFileSystemService: () => ({
    vfs: {
      createDirectory: createDirectoryMock,
      delete: (path: string, recursive?: boolean) => mockVfs.delete(path, recursive),
      exists: (path: string) => mockVfs.exists(path),
      mount: mountMock,
      readDirectory: (path: string) => mockVfs.readDirectory(path),
      stat: (path: string) => mockVfs.stat(path),
      unmount: unmountMock,
    },
  }),
}));

vi.mock('@shared/lib/googleDriveFileSystemProvider', () => ({
  googleDriveFileSystemProvider: vi.fn(() => ({})),
}));

vi.mock('./googleSessionStore', () => ({
  useGoogleSessionStoreService: () => ({
    $store: sessionStoreSubject.asObservable(),
    getStore: getSessionStoreMock,
    update: updateSessionStoreMock,
    get: getSessionMock,
    clear: clearSessionStoreMock,
    $sessions: sessionsSubject.asObservable(),
  }),
}));

describe('useGoogleService', () => {
  beforeEach(() => {
    vi.resetModules();
    requestTokenMock.mockReset();
    userinfoGetMock.mockReset();
    revokeMock.mockReset();
    updateSessionStoreMock.mockReset();
    getSessionMock.mockReset();
    getSessionStoreMock.mockReset();
    clearSessionStoreMock.mockReset();
    createDirectoryMock.mockReset();
    mountMock.mockReset();
    unmountMock.mockReset();
    vi.mocked(googleDriveFileSystemProvider).mockImplementation(createMockGoogleDriveProvider);

    sessionStoreValue = {};
    sessionsSubject = new BehaviorSubject<string[]>([]);
    sessionStoreSubject = new BehaviorSubject<SessionStore>({});
    mockVfs = new VirtualFileSystem();
    mockVfs.mount('/', new MemoryFileSystem());

    getSessionStoreMock.mockImplementation(() => sessionStoreValue);
    updateSessionStoreMock.mockImplementation((nextStore: SessionStore) => {
      sessionStoreValue = nextStore;
      syncSessionsSubject();
      syncSessionStoreSubject();
    });
    getSessionMock.mockImplementation((email: string) => sessionStoreValue[email]);
    clearSessionStoreMock.mockImplementation(() => {
      sessionStoreValue = {};
      syncSessionsSubject();
      syncSessionStoreSubject();
    });
    createDirectoryMock.mockImplementation((path: string) => mockVfs.createDirectory(path));
    mountMock.mockImplementation((path: string, provider: IFileSystemProvider) => {
      mockVfs.mount(path, provider);
    });
    unmountMock.mockImplementation((path: string) => {
      mockVfs.unmount(path);
    });

    revokeMock.mockResolvedValue(undefined);
    userinfoGetMock.mockResolvedValue({
      result: { email: 'user@example.com' },
    });
  });

  const createService = async () => {
    const { useGoogleService } = await import('./useGoogleService');

    return useGoogleService();
  };

  const bindApi = async (service: Awaited<ReturnType<typeof createService>>) => {
    await service.bindGoogleApi({
      requestAccessToken: requestTokenMock,
      userinfoGet: userinfoGetMock,
      revoke: revokeMock,
    });

    await flushMicrotasks();
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
    await bindApi(service);
    const scope = DRIVE_GOOGLE_SCOPE.all;

    const [firstToken, secondToken] = await Promise.all([
      service.requestToken([scope], 'user@example.com'),
      service.requestToken([scope], 'user@example.com'),
    ]);

    expect(firstToken).toBe('access-token');
    expect(secondToken).toBe('access-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSessionStoreMock).toHaveBeenCalledTimes(1);
    expect(updateSessionStoreMock).toHaveBeenCalledWith({
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: expect.any(Number),
        profile: {
          email: 'user@example.com',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });

  it('returns cached session list data without requesting a token', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000,
        profile: {
          email: 'user@example.com',
          name: 'User Example',
          picture: 'https://example.com/avatar.png',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();

    const service = await createService();
    await bindApi(service);

    await expect(service.sessionList.fetch()).resolves.toEqual([
      {
        email: 'user@example.com',
        profile: {
          email: 'user@example.com',
          name: 'User Example',
          picture: 'https://example.com/avatar.png',
        },
      },
    ]);
    expect(requestTokenMock).not.toHaveBeenCalled();
    expect(userinfoGetMock).not.toHaveBeenCalled();
  });

  it('returns a fallback profile for sessions without cached profile data', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000,
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();

    const service = await createService();
    await bindApi(service);

    await expect(service.sessionList.fetch()).resolves.toEqual([
      {
        email: 'user@example.com',
        profile: {
          email: 'user@example.com',
        },
      },
    ]);
    expect(requestTokenMock).not.toHaveBeenCalled();
    expect(userinfoGetMock).not.toHaveBeenCalled();
    expect(updateSessionStoreMock).not.toHaveBeenCalled();
  });

  it('ignores malformed session entries in the derived session list', async () => {
    sessionStoreValue = {
      'broken@example.com': undefined,
      'user@example.com': {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000,
        profile: {
          email: 'user@example.com',
          name: 'User Example',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();

    const service = await createService();
    await bindApi(service);

    await expect(service.sessionList.fetch()).resolves.toEqual([
      {
        email: 'user@example.com',
        profile: {
          email: 'user@example.com',
          name: 'User Example',
        },
      },
    ]);
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
    await bindApi(service);

    const [driveToken, profileToken] = await Promise.all([
      service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com'),
      service.requestToken([USER_INFO_GOOGLE_SCOPE.userInfoProfile], 'user@example.com'),
    ]);

    expect(driveToken).toBe('drive-token');
    expect(profileToken).toBe('profile-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(2);
  });

  it('reuses a valid cached token without calling Google API', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'cached-token',
        expiresAt: Date.now() + 10 * 60 * 1000,
        profile: {
          email: 'user@example.com',
          name: 'User Example',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();

    const service = await createService();
    await bindApi(service);

    const token = await service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com');

    expect(token).toBe('cached-token');
    expect(requestTokenMock).not.toHaveBeenCalled();
    expect(updateSessionStoreMock).not.toHaveBeenCalled();
  });

  it('requests a fresh token when cached scopes do not cover the required scopes', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'cached-token',
        expiresAt: Date.now() + 10 * 60 * 1000,
        profile: {
          email: 'user@example.com',
          name: 'User Example',
        },
        scopes: [USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();
    requestTokenMock.mockResolvedValueOnce({
      access_token: 'fresh-token',
      expires_in: '3600',
      scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
    });

    const service = await createService();
    await bindApi(service);

    const token = await service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com');

    expect(token).toBe('fresh-token');
    expect(requestTokenMock).toHaveBeenCalledTimes(1);
    expect(updateSessionStoreMock).toHaveBeenCalledWith({
      'user@example.com': {
        accessToken: 'fresh-token',
        expiresAt: expect.any(Number),
        profile: {
          email: 'user@example.com',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });

  it('retries after a failed in-flight request', async () => {
    requestTokenMock.mockRejectedValueOnce(new Error('auth failed')).mockResolvedValueOnce({
      access_token: 'retry-token',
      expires_in: '3600',
      scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
    });

    const service = await createService();
    await bindApi(service);
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

  it('deletes a session without revoking access and removes it from session list', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: Date.now() + 1000,
        profile: {
          email: 'user@example.com',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();

    const service = await createService();
    await bindApi(service);

    await service.deleteSession('user@example.com');

    expect(revokeMock).not.toHaveBeenCalled();
    expect(updateSessionStoreMock).toHaveBeenCalledWith({});
    await expect(service.sessionList.fetch()).resolves.toEqual([]);
  });

  it('passes reactive sessions to the Google Drive provider', async () => {
    const service = await createService();
    await bindApi(service);

    expect(googleDriveFileSystemProvider).toHaveBeenCalledWith({
      $sessions: expect.objectContaining({
        subscribe: expect.any(Function),
      }),
      requestToken: expect.any(Function),
    });
    expect(service.sessionList).toBeDefined();
  });

  it('revokes access and removes the session from session list', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: Date.now() + 1000,
        profile: {
          email: 'user@example.com',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();

    const service = await createService();
    await bindApi(service);

    await service.revokeAccess('user@example.com');

    expect(revokeMock).toHaveBeenCalledWith('access-token');
    expect(updateSessionStoreMock).toHaveBeenCalledWith({});
    await expect(service.sessionList.fetch()).resolves.toEqual([]);
  });

  it('keeps the local session when revoke fails', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: Date.now() + 1000,
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    revokeMock.mockRejectedValueOnce(new Error('revoke failed'));

    const service = await createService();
    await bindApi(service);

    await expect(service.revokeAccess('user@example.com')).rejects.toMatchObject({
      code: GoogleAuthErrorCode.revokeFailed,
      email: 'user@example.com',
      name: 'GoogleAuthError',
    } satisfies Partial<GoogleAuthError>);
    expect(updateSessionStoreMock).not.toHaveBeenCalled();
  });

  it('normalizes blocked popup errors', async () => {
    const popupBlockedError: google.accounts.oauth2.ClientConfigError = {
      message: 'popup_failed_to_open',
      name: 'ClientConfigError',
      type: 'popup_failed_to_open',
    };

    requestTokenMock.mockRejectedValueOnce(new GoogleClientConfigError(popupBlockedError));

    const service = await createService();
    await bindApi(service);

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
    await bindApi(service);

    await expect(
      service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com'),
    ).rejects.toMatchObject({
      actualEmail: 'other@example.com',
      code: GoogleAuthErrorCode.accountMismatch,
      expectedEmail: 'user@example.com',
      name: 'GoogleAuthError',
    });
    expect(updateSessionStoreMock).toHaveBeenCalledWith({
      'other@example.com': {
        accessToken: 'other-token',
        expiresAt: expect.any(Number),
        profile: {
          email: 'other@example.com',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });

  it('replaces the stored profile snapshot with fresh userinfo data', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000,
        profile: {
          email: 'user@example.com',
          name: 'User Example',
          picture: 'https://example.com/avatar.png',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();
    requestTokenMock.mockResolvedValueOnce({
      access_token: 'access-token',
      expires_in: '3600',
      scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
    });
    userinfoGetMock.mockResolvedValueOnce({
      result: { email: 'user@example.com' },
    });

    const service = await createService();
    await bindApi(service);

    await service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com');

    expect(updateSessionStoreMock).toHaveBeenLastCalledWith({
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: expect.any(Number),
        profile: {
          email: 'user@example.com',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });

  it('clears stale optional profile fields when fresh userinfo omits them', async () => {
    sessionStoreValue = {
      'user@example.com': {
        accessToken: 'expired-token',
        expiresAt: Date.now() - 1000,
        profile: {
          email: 'user@example.com',
          name: 'User Example',
          picture: 'https://example.com/avatar.png',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    };
    syncSessionsSubject();
    syncSessionStoreSubject();
    requestTokenMock.mockResolvedValueOnce({
      access_token: 'access-token',
      expires_in: '3600',
      scope: `${DRIVE_GOOGLE_SCOPE.all} ${USER_INFO_GOOGLE_SCOPE.userinfoEmail}`,
    });
    userinfoGetMock.mockResolvedValueOnce({
      result: {
        email: 'user@example.com',
        name: 'Updated User',
      },
    });

    const service = await createService();
    await bindApi(service);

    await service.requestToken([DRIVE_GOOGLE_SCOPE.all], 'user@example.com');

    expect(updateSessionStoreMock).toHaveBeenLastCalledWith({
      'user@example.com': {
        accessToken: 'access-token',
        expiresAt: expect.any(Number),
        profile: {
          email: 'user@example.com',
          name: 'Updated User',
        },
        scopes: [DRIVE_GOOGLE_SCOPE.all, USER_INFO_GOOGLE_SCOPE.userinfoEmail],
      },
    });
  });

  it('clears sessions', async () => {
    const service = await createService();
    await bindApi(service);

    await service.clear();

    expect(clearSessionStoreMock).toHaveBeenCalledTimes(1);
  });

  it('does not mount Google Drive until integration is explicitly enabled', async () => {
    const service = await createService();
    await bindApi(service);

    expect(mountMock).not.toHaveBeenCalled();
    await expect(mockVfs.readDirectory('/Google Drive/user@example.com')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
    expect(requestTokenMock).not.toHaveBeenCalled();
  });

  it('mounts and unmounts Google Drive integration without clearing sessions or revoking access', async () => {
    const service = await createService();
    await bindApi(service);

    await service.enableGoogleDriveIntegration();
    await service.disableGoogleDriveIntegration();

    expect(mountMock).toHaveBeenCalledTimes(1);
    expect(unmountMock).toHaveBeenCalledWith('/Google Drive');
    expect(clearSessionStoreMock).not.toHaveBeenCalled();
    expect(revokeMock).not.toHaveBeenCalled();
  });

  it('keeps repeated enable and disable operations idempotent', async () => {
    const service = await createService();
    await bindApi(service);

    await service.enableGoogleDriveIntegration();
    await service.enableGoogleDriveIntegration();
    await service.disableGoogleDriveIntegration();
    await service.disableGoogleDriveIntegration();

    expect(mountMock).toHaveBeenCalledTimes(1);
    expect(unmountMock).toHaveBeenCalledTimes(1);
  });

  it('enable -> disable -> enable works', async () => {
    const service = await createService();
    await bindApi(service);

    await service.enableGoogleDriveIntegration();
    await expect(mockVfs.readDirectory('/Google Drive')).resolves.toEqual([]);

    await service.disableGoogleDriveIntegration();
    await expect(mockVfs.stat('/Google Drive')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });

    await service.enableGoogleDriveIntegration();
    await expect(mockVfs.readDirectory('/Google Drive')).resolves.toEqual([]);
  });

  it('disable removes Google Drive from root directory', async () => {
    const service = await createService();
    await bindApi(service);

    await service.enableGoogleDriveIntegration();
    await service.disableGoogleDriveIntegration();

    await expect(mockVfs.stat('/Google Drive')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
    await expect(mockVfs.readDirectory('/')).resolves.not.toContainEqual([
      'Google Drive',
      expect.anything(),
    ]);
  });
});
