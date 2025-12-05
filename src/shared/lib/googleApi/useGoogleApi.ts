import {
  asyncComputed,
  createGlobalState,
  toRefs,
  useStorage,
} from '@vueuse/core';
import { computed, watchEffect } from 'vue';
import { loadGDrive } from './loadGDrive';
import { loadGAPI } from './loadGAPI';
import type { DRIVE_GOOGLE_SCOPE } from './types';
import { type GOOGLE_SCOPE } from './types';
import { loadGoogle, requestAccessToken } from './loadGsi';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- to protect typing
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- to protect typing
const gapi = undefined;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- to protect typing
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- to protect typing
const google = undefined;

/**
 * @deprecated
 * @returns
 */
export const useGoogleOAuth = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /**
   * Запрос токена
   */
  const requestToken = async (
    ...scopes: [GOOGLE_SCOPE, ...GOOGLE_SCOPE[]]
  ): Promise<google.accounts.oauth2.TokenResponse> => {
    if (!clientId) {
      throw new Error('clientId missing');
    }

    return await requestAccessToken(clientId, scopes);
  };

  const hasGrantedAllScopes = async (
    tokenResponse: google.accounts.oauth2.TokenResponse,
    ...scopes: [GOOGLE_SCOPE, ...GOOGLE_SCOPE[]]
  ) => {
    const g = await loadGoogle();

    return g.accounts.oauth2.hasGrantedAllScopes(tokenResponse, ...scopes);
  };

  return {
    requestToken,
    hasGrantedAllScopes,
  };
};

/**
 * @deprecated
 */
export const useGoogleApi = createGlobalState(() => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const { gAuthTokenState: tokenResponse, tokenReceiptTime } = toRefs(
    useStorage<{
      gAuthTokenState: google.accounts.oauth2.TokenResponse | null;
      tokenReceiptTime: number | null;
    }>(
      'gAuth',
      { gAuthTokenState: null, tokenReceiptTime: null },
      localStorage,
      {
        mergeDefaults: true,
      },
    ),
  );

  const tokenExpirationTime = computed(() =>
    tokenReceiptTime.value && tokenResponse.value
      ? tokenReceiptTime.value + Number(tokenResponse.value.expires_in) * 1e3
      : 0,
  );

  const gapi = asyncComputed(() => loadGAPI(), undefined, { lazy: true });

  watchEffect(() => {
    gapi.value?.client.setToken(tokenResponse.value);
  });

  const { requestToken, hasGrantedAllScopes } = useGoogleOAuth();

  /**
   * Проверка наличия доступов
   * @param scopes
   * @returns
   */
  const checkGranted = async (
    ...scopes: [GOOGLE_SCOPE, ...GOOGLE_SCOPE[]]
  ) => {
    return !!(
      tokenResponse.value &&
      tokenExpirationTime.value > Date.now() &&
      (await hasGrantedAllScopes(tokenResponse.value, ...scopes))
    );
  };

  /**
   * Проверка доступа и запрос авторизации при отсутствии
   * @param clientId
   * @param scopes
   * @returns
   */
  const requestAccess = async (
    ...scopes: [GOOGLE_SCOPE, ...GOOGLE_SCOPE[]]
  ) => {
    const firstCheck = await checkGranted(...scopes);

    if (!firstCheck) {
      if (!clientId) {
        throw new Error('clientId missing');
      }

      await requestToken(...scopes);

      const secondCheck = checkGranted(...scopes);

      return secondCheck;
    }

    return firstCheck;
  };

  /**
   * Авторизация в google в одно касание
   */
  // const requestCredentialOneTap = async (
  //   clientId: string,
  //   {
  //     showPrompt,
  //     renderButton,
  //   }: {
  //     showPrompt?: boolean;
  //     renderButton?: Parameters<typeof google.accounts.id.renderButton>;
  //   } = {},
  // ) => {
  //   debug('requestAccessOneTap', { showPrompt, renderButton });

  //   const google = await getGsi();

  //   return new Promise<google.accounts.id.CredentialResponse>((resolve) => {
  //     google.accounts.id.initialize({
  //       client_id: clientId,
  //       callback: resolve,
  //     });

  //     if (renderButton) {
  //       google.accounts.id.renderButton(...renderButton);
  //     }

  //     if (showPrompt) {
  //       google.accounts.id.prompt();
  //     }
  //   });
  // };

  // let gDrive: AdvancedGDrive | undefined;

  const gDrive = asyncComputed(
    async () => {
      if (gapi.value && clientId) {
        return await loadGDrive(clientId, gapi.value);
      }
      return undefined;
    },
    undefined,
    { lazy: true },
  );

  /**
   * Удаление токена google и разлогин пользователя
   */
  const removeToken = () => {
    if (tokenResponse.value) {
      tokenResponse.value = null;
    }
    if (tokenReceiptTime.value) {
      tokenReceiptTime.value = null;
    }
  };

  const getGDrive = async (
    ...scopes: [DRIVE_GOOGLE_SCOPE, ...DRIVE_GOOGLE_SCOPE[]]
  ) => {
    await requestAccess(...scopes);

    if (gDrive.value) {
      return gDrive.value;
    }

    if (!clientId) {
      throw new Error('clientId missing');
    }

    return await loadGDrive(clientId);
  };

  return {
    removeToken,
    gDrive,
    requestAccess,
    getGDrive,
  };
});
