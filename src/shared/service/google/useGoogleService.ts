import { createGlobalState } from '@vueuse/core';
import { useFileSystemService } from '../fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { googleDriveFileSystemProvider } from '@shared/lib/vfsProviders/google';
import { useGoogleSessionStore } from './googleSessionStore';

/**
 * Зона ответственности
 * // [ ] обновлять устаревшую сессию
 * // [x] монтировать гугл диск приложения
 * // [ ] монтировать пользовательский диск
 */

type TokenResponse = google.accounts.oauth2.TokenResponse;

type RequestAccessToken = (email?: string) => Promise<TokenResponse>;
type UserinfoGet = gapi.client.oauth2.UserinfoResource['get'];

interface GoogleApi {
  requestAccessToken: RequestAccessToken;
  userinfoGet: UserinfoGet;
}

const setupGoogleService = () => {
  let googleApi: undefined | GoogleApi;

  const { getStore, update, getSessionList, get } = useGoogleSessionStore();

  const getToken = async (oldEmail?: string) => {
    const oldSession = oldEmail ? await get(oldEmail) : undefined;

    if (oldSession) {
      const { accessToken, expiresAt } = oldSession;
      if (expiresAt - 3e5 > Date.now()) {
        return accessToken;
      }
    }

    if (!googleApi) {
      throw new Error('Google API is not tied to the service');
    }

    const { requestAccessToken, userinfoGet } = googleApi;

    const { access_token: accessToken, expires_in } =
      await requestAccessToken(oldEmail);

    const expiresAt = Date.now() + parseInt(expires_in) * 1e3;

    const {
      result: { email },
    } = await userinfoGet({ oauth_token: accessToken });

    if (!email) {
      throw new Error("don't have email");
    }

    const oldStore = await getStore();

    const store = {
      ...oldStore,
      [email]: {
        accessToken,
        expiresAt,
      },
    };

    await update(store);

    const token = store[oldEmail ?? email]?.accessToken;

    return token;
  };

  const { vfs } = useFileSystemService();

  const appDataName = 'Google Drive';

  const mountGoogleProvider = async () => {
    const path = PathUtils.join('/', appDataName);

    await vfs.createDirectory(path);

    vfs.mount(
      path,
      googleDriveFileSystemProvider({
        // todo: добавить интерфейс в googleDriveFileSystemProvider
        getToken,
        getSessionList,
      }),
    );
  };

  const bindGoogleApi = async (api: GoogleApi) => {
    googleApi = api;

    await mountGoogleProvider();
  };

  return {
    bindGoogleApi,
  };
};

export const useGoogleService = createGlobalState(setupGoogleService);
