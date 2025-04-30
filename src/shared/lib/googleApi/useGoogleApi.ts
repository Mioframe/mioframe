import {
  asyncComputed,
  createGlobalState,
  toRefs,
  useStorage,
} from '@vueuse/core';
import { createLogger } from '../logger';
import { computed, ref, watchEffect } from 'vue';
import type { GOOGLE_DRIVE_SCOPE, GOOGLE_SCOPES } from './utils';
import {
  USERINFO_SCOPE,
  loadGAPI,
  loadGDrive,
  loadGoogle,
  loadOauth2,
  requestAccessToken,
} from './utils';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- to protect typing
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- to protect typing
const gapi = undefined;
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- to protect typing
// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- to protect typing
const google = undefined;

const { debug, watchDebug } = createLogger('useGoogleApi');

export const useGoogleApi = createGlobalState(() => {
  debug('useGoogleApi');

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
    debug('watchEffect', 'setToken', tokenResponse.value);
    gapi.value?.client.setToken(tokenResponse.value);
  });

  const oauth2 = asyncComputed(
    async () => (clientId ? await loadOauth2(clientId) : undefined),
    undefined,
    {
      lazy: true,
    },
  );

  /**
   * Проверка наличия доступов
   * @param scopes
   * @returns
   */
  const checkGranted = (
    google: typeof window.google,
    ...scopes: [GOOGLE_SCOPES, ...GOOGLE_SCOPES[]]
  ) => {
    return !!(
      tokenResponse.value &&
      tokenExpirationTime.value > Date.now() &&
      google.accounts.oauth2.hasGrantedAllScopes(tokenResponse.value, ...scopes)
    );
  };

  /**
   * Запрос нового токена
   */
  const requestToken = async (
    ...scopes: [GOOGLE_SCOPES, ...GOOGLE_SCOPES[]]
  ) => {
    if (!clientId) {
      throw new Error('clientId missing');
    }
    const g = await loadGoogle();

    tokenResponse.value = await requestAccessToken(clientId, g, scopes);
    tokenReceiptTime.value = Date.now();

    return tokenResponse.value;
  };

  /**
   * Проверка доступа и запрос авторизации при отсутствии
   * @param clientId
   * @param scopes
   * @returns
   */
  const requestAccess = async (
    ...scopes: [GOOGLE_SCOPES, ...GOOGLE_SCOPES[]]
  ) => {
    debug('requestAccess');

    const google = await loadGoogle();

    const firstCheck = checkGranted(google, ...scopes);

    debug('requestAccess', { firstCheck });

    if (!firstCheck) {
      if (!clientId) {
        throw new Error('clientId missing');
      }

      await requestToken(...scopes);

      const secondCheck = checkGranted(google, ...scopes);

      debug('requestAccess', { secondCheck });

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

  const googleEvaluating = ref(false);
  const google = asyncComputed(() => loadGoogle(), undefined, {
    // todo: переделать asyncComputed?
    lazy: true,
    evaluating: googleEvaluating,
  });

  const userInfoEvaluating = ref(false);

  watchDebug('userInfoEvaluating', userInfoEvaluating);

  const userInfo = asyncComputed(
    async () => {
      debug('computed userInfo');

      const userinfo = oauth2.value?.userinfo;

      if (
        google.value &&
        checkGranted(
          google.value,
          USERINFO_SCOPE.userinfoEmail,
          USERINFO_SCOPE.userinfoProfile,
        )
      ) {
        debug('computed userInfo', { oauth2: oauth2.value });

        if (userinfo) {
          const { result } = await userinfo.get();
          debug('computed userInfo', { result });
          return result;
        }
      }
    },
    undefined,
    {
      lazy: true,
      evaluating: userInfoEvaluating,
    },
  );

  const getGDrive = async (
    ...scopes: [GOOGLE_DRIVE_SCOPE, ...GOOGLE_DRIVE_SCOPE[]]
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
    userInfo,
    userInfoEvaluating,
    gDrive,
    requestAccess,
    getGDrive,
  };
});
