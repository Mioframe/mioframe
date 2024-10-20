import { toRefs, useStorage } from '@vueuse/core';
import { createLogger } from '../logger';
import { fileTypeFromBuffer } from 'file-type';
import { reactive, ref, shallowRef, watch, watchEffect } from 'vue';
import { defineStore } from 'pinia';
import { cloneDeep, isEqual, isUndefined } from 'lodash-es';
import type { AdvancedGDrive, GDriveScope } from './types';

export const useGoogleApi = defineStore('googleApi', () => {
  const { debug } = createLogger('google api');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const { gAuthTokenState: authTokenState } = toRefs(
    useStorage<{
      gAuthTokenState: google.accounts.oauth2.TokenResponse | null;
    }>('gAuth', { gAuthTokenState: null }, localStorage, {
      mergeDefaults: true,
    }),
  );

  const stateGapi = shallowRef<typeof gapi>();

  const loading = reactive({
    loadApi: 0,
    client: 0,
    oauth2: 0,
    gsi: 0,
    requestAccessToken: 0,
    hasGranted: 0,
    checkGrantedAndRequestAccess: 0,
    getGDrive: 0,
    updateUserinfo: 0,
  });

  watchEffect(() => {
    if (stateGapi.value && authTokenState.value) {
      stateGapi.value.client.setToken(authTokenState.value);
    } else {
      stateGapi.value?.client.setToken(null);
    }
  });

  /**
   * Загрузить gapi
   * @returns
   */
  const getGAPI = async (): Promise<typeof gapi> => {
    if (stateGapi.value) {
      return stateGapi.value;
    }

    try {
      loading.loadApi += 1;
      const gapiUrl = '//apis.google.com/js/api.js';
      /* @vite-ignore */
      await import(gapiUrl);
    } finally {
      loading.loadApi -= 1;
    }

    return new Promise<typeof gapi>((resolve) => {
      loading.client += 1;
      gapi.load('client', () => {
        stateGapi.value = gapi;
        resolve(stateGapi.value);
        loading.client -= 1;
      });
    });
  };

  const oauth2 = shallowRef<typeof gapi.client.oauth2>();

  const getOauth2 = async (): Promise<
    typeof gapi.client.oauth2 | undefined
  > => {
    loading.oauth2 += 1;
    try {
      if (!oauth2.value) {
        const gapi = await getGAPI();

        if (
          await checkGrantedAndRequestAccess([
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email',
          ])
        ) {
          await gapi.client.init({
            clientId,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest',
            ],
          });
          oauth2.value = gapi.client.oauth2;
        }
      }
    } finally {
      loading.oauth2 -= 1;
    }

    return oauth2.value;
  };

  let gsi: undefined | typeof google;

  /**
   * Загрузить gsi/google
   * @returns
   */
  const getGsi = async () => {
    debug('getGsi');
    loading.gsi += 1;
    if (gsi) {
      loading.gsi -= 1;
      return gsi;
    }
    const gsiUrl = 'https://accounts.google.com/gsi/client';

    const scriptEl = document.createElement('script');

    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.src = gsiUrl;

    return new Promise<typeof google>((resolve) => {
      scriptEl.onload = () => {
        gsi = google;
        resolve(gsi);
        loading.gsi -= 1;
      };

      document.body.append(scriptEl);
    });
  };

  const resolveRequestAccess: {
    resolve: (tokenResponse: google.accounts.oauth2.TokenResponse) => unknown;
    reject: (
      error: google.accounts.oauth2.ClientConfigError | Error,
    ) => unknown;
  }[] = [];

  let stateTokenClient: google.accounts.oauth2.TokenClient | undefined;

  /**
   * Авторизация в google с получением токена в отдельном окне
   * @param clientId
   * @param scopes
   * @returns
   */
  const requestAccessToken = async (
    scopes: string[],
    { quietly = false } = {},
  ) => {
    debug('requestAccessToken', { scopes, quietly });

    if (isUndefined(clientId)) {
      throw new Error('clientId in undefined');
    }

    const google = await getGsi();

    return new Promise<google.accounts.oauth2.TokenResponse>(
      (resolve, reject) => {
        loading.requestAccessToken += 1;

        resolveRequestAccess.push({ resolve, reject });

        if (!stateTokenClient) {
          debug('initTokenClient');
          stateTokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: scopes.join(' '),
            callback: (tokenResponse) => {
              debug('callback', { tokenResponse });
              if ('error' in tokenResponse) {
                resolveRequestAccess
                  .shift()
                  ?.reject(new Error(tokenResponse.error));
                return;
              }
              authTokenState.value = tokenResponse;
              resolveRequestAccess.shift()?.resolve(authTokenState.value);
              loading.requestAccessToken -= 1;
            },
            error_callback: (error) => {
              debug('error_callback', error);
              resolveRequestAccess.shift()?.reject(error);
              loading.requestAccessToken -= 1;
            },
          });
          debug('requestAccessToken');
          stateTokenClient.requestAccessToken({
            scope: scopes.join(' '),
            prompt: quietly ? 'none' : undefined,
          });
        } else {
          debug('requestAccessToken');
          stateTokenClient.requestAccessToken({
            scope: scopes.join(' '),
            prompt: quietly ? 'none' : undefined,
          });
        }
      },
    );
  };

  /**
   * Проверка наличия доступов
   * @param scopes
   * @returns
   */
  const hasGranted = async (scopes: [string, ...string[]]) => {
    debug('checkAccessToken', { scopes });

    loading.hasGranted += 1;

    try {
      const gsi = await getGsi();

      return (
        authTokenState.value &&
        gsi.accounts.oauth2.hasGrantedAllScopes(authTokenState.value, ...scopes)
      );
    } finally {
      loading.hasGranted -= 1;
    }
  };

  /**
   * Проверка доступа и запрос авторизации при отсутствии
   * @param clientId
   * @param scopes
   * @returns
   */
  const checkGrantedAndRequestAccess = async (
    scopes: [string, ...string[]],
  ) => {
    debug('checkAndRequestAccess', { scopes });
    loading.checkGrantedAndRequestAccess += 1;
    try {
      const access = await hasGranted(scopes);
      if (access) {
        return access;
      } else {
        await requestAccessToken(scopes);
        return await hasGranted(scopes);
      }
    } finally {
      loading.checkGrantedAndRequestAccess -= 1;
    }
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

  let gdrive: AdvancedGDrive | undefined;

  const getGDrive = async (scopes: [GDriveScope, ...GDriveScope[]]) => {
    loading.getGDrive += 1;
    try {
      const gapi = await getGAPI();

      if (await checkGrantedAndRequestAccess(scopes)) {
        if (!gdrive) {
          await gapi.client.init({
            clientId,
            discoveryDocs: [
              'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
            ],
          });

          gdrive = {
            ...gapi.client.drive,
            uploadFile: async (
              fileId: string,
              file: FileSystemWriteChunkType,
            ) => {
              debug('uploadFile', fileId, file);

              let body: Blob;

              if (typeof file === 'string') {
                body = new Blob([file], { type: 'text/plain' });
              } else if (file instanceof Blob) {
                body = file;
              } else if (
                file instanceof ArrayBuffer ||
                ArrayBuffer.isView(file)
              ) {
                const buffer =
                  file instanceof ArrayBuffer
                    ? new Uint8Array(file)
                    : new Uint8Array(file.buffer);
                const mimeTypeInfo = await fileTypeFromBuffer(buffer);
                const contentType = mimeTypeInfo
                  ? mimeTypeInfo.mime
                  : 'application/octet-stream';
                body = new Blob([buffer], { type: contentType });
              } else {
                throw new Error('Unsupported file type');
              }

              const response = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,version,name`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': body.type,
                    'Content-Length': body.size.toString(),
                    Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
                  },
                  body, // Передаем тело запроса
                },
              );

              return response;
            },
            downloadFile: async (
              fileId: string,
              name: string = 'file',
            ): Promise<File> => {
              const response = await fetch(
                `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
                {
                  headers: new Headers({
                    Authorization: `Bearer ${gapi.auth.getToken().access_token}`,
                  }),
                },
              );

              const blob = await response.blob();

              const file = new File([blob], name, {
                type: blob.type,
              });

              return file;
            },
          };
        }
        return gdrive;
      }
      return undefined;
    } finally {
      loading.getGDrive -= 1;
    }
  };

  const removeToken = () => {
    authTokenState.value = null;
  };

  const userinfo = ref<gapi.client.oauth2.Userinfo>();

  const updateUserinfo = async () => {
    if (loading.updateUserinfo) {
      return;
    }
    try {
      loading.updateUserinfo += 1;
      debug('watchEffect', { authTokenState: authTokenState.value });
      if (authTokenState.value) {
        const snapshotTokenState = cloneDeep(authTokenState.value);
        debug('watchEffect', { snapshotTokenState });
        const oauth2 = await getOauth2();
        debug('watchEffect', { oauth2 });
        if (oauth2) {
          const { result } = await oauth2.userinfo.get();
          debug('watchEffect', { result });
          if (isEqual(authTokenState.value, snapshotTokenState)) {
            userinfo.value = result;
            return;
          }
        }
      }
      userinfo.value = undefined;
    } finally {
      loading.updateUserinfo -= 1;
    }
  };

  watch(authTokenState, updateUserinfo, { immediate: true });

  return {
    getGDrive,
    removeToken,
    getGAPI,
    getOauth2,
    userinfo,
    requestAccessToken,
    loading,
  };
});
