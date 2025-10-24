import type { AdvancedGDrive } from './types';
import { api } from '../googleDrive/api';

let gapi: typeof window.gapi | undefined = undefined;

/**
 * Загрузить gapi
 * @returns
 */
export const loadGAPI = async (): Promise<typeof window.gapi> =>
  new Promise<typeof window.gapi>((resolve) => {
    if (gapi) {
      resolve(gapi);
      return;
    }

    const gapiUrl = '//apis.google.com/js/api.js';

    void import(/* @vite-ignore */ gapiUrl).then(() => {
      if (gapi) {
        resolve(gapi);
        return;
      }

      window.gapi.load('client', () => {
        gapi = window.gapi;
        resolve(gapi);
      });
    });
  });

let oauth2: typeof window.gapi.client.oauth2 | undefined = undefined;

export const loadOauth2 = async (
  clientId: string,
): Promise<typeof window.gapi.client.oauth2 | undefined> => {
  if (!oauth2) {
    const gapi = await loadGAPI();

    // const access = await checkGrantedAndRequestAccess([
    //   'https://www.googleapis.com/auth/userinfo.profile',
    //   'https://www.googleapis.com/auth/userinfo.email',
    // ]);

    // if (!access) {
    //   throw new Error('no access to google');
    // }

    await gapi.client.init({
      clientId,
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/oauth2/v2/rest',
      ],
    });
    oauth2 = gapi.client.oauth2;
  }

  return oauth2;
};

let gDrive: AdvancedGDrive | undefined = undefined;

export const loadGDrive = async (
  clientId: string,
  gapi?: typeof window.gapi,
) => {
  const g = gapi ?? (await loadGAPI());

  if (!gDrive) {
    await g.client.init({
      clientId,
      discoveryDocs: [
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
      ],
    });

    gDrive = {
      ...g.client.drive,
      /**
       * @deprecated
       */
      uploadFile: async (fileId: string, file: FileSystemWriteChunkType) => {
        return api.files.upload(
          {
            YOUR_ACCESS_TOKEN: g.auth.getToken().access_token,
          },
          fileId,
          file,
        );
      },
      /**
       * @deprecated
       */
      downloadFile: async (
        fileId: string,
        name: string = 'file',
      ): Promise<File> => {
        return api.files.download(
          {
            YOUR_ACCESS_TOKEN: g.auth.getToken().access_token,
          },
          fileId,
          name,
        );
      },
      // todo: добавить популярные методы с запросом прав доступа
    };
  }
  return gDrive;
};

let gsi: typeof window.google | undefined = undefined;

export const loadGsi = async () =>
  new Promise<typeof window.google>((resolve) => {
    if (gsi) {
      resolve(gsi);
      return;
    }
    const gsiUrl = 'https://accounts.google.com/gsi/client';

    const scriptEl = document.createElement('script');

    scriptEl.async = true;
    scriptEl.defer = true;
    scriptEl.src = gsiUrl;

    scriptEl.onload = () => {
      gsi = window.google;
      resolve(gsi);
    };

    document.body.append(scriptEl);
  });

export const loadGoogle = loadGsi;

const resolveRequestAccess: {
  resolve: (tokenResponse: google.accounts.oauth2.TokenResponse) => unknown;
  reject: (error: google.accounts.oauth2.ClientConfigError | Error) => unknown;
}[] = [];

let stateTokenClient: google.accounts.oauth2.TokenClient | undefined;

/**
 * Авторизация в google с получением токена в отдельном окне
 */
export const requestAccessToken = async (
  clientId: string,
  gsi: typeof window.google,
  scopes: GOOGLE_SCOPES[],
  { quietly = false } = {},
) => {
  return new Promise<google.accounts.oauth2.TokenResponse>(
    (resolve, reject) => {
      resolveRequestAccess.push({ resolve, reject });

      let token: google.accounts.oauth2.TokenResponse | undefined = undefined;

      if (!stateTokenClient) {
        stateTokenClient = gsi.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: scopes.join(' '),
          callback: (tokenResponse) => {
            if ('error' in tokenResponse) {
              resolveRequestAccess
                .shift()
                ?.reject(new Error(tokenResponse.error));
              return;
            }
            token = tokenResponse;

            resolveRequestAccess.shift()?.resolve(token);
          },
          error_callback: (error) => {
            resolveRequestAccess.shift()?.reject(error);
          },
        });
      }

      stateTokenClient.requestAccessToken({
        scope: scopes.join(' '),
        prompt: quietly ? 'none' : undefined,
      });
    },
  );
};

export enum USERINFO_SCOPE {
  userinfoProfile = 'https://www.googleapis.com/auth/userinfo.profile',
  userinfoEmail = 'https://www.googleapis.com/auth/userinfo.email',
}

export enum GOOGLE_DRIVE_SCOPE {
  /**
   * View and manage the app's own configuration data in your Google Drive.
   */
  appdata = 'https://www.googleapis.com/auth/drive.appdata',

  /**
   * View and manage the app's own configuration data in your Google Drive.
   */
  appFolder = 'https://www.googleapis.com/auth/drive.appfolder',

  /**
   * Allow apps to appear as an option in the "Open with" or the "New" menu.
   */
  install = 'https://www.googleapis.com/auth/drive.install',

  /**
   * Create new Drive files, or modify existing files, that you open with an app or that the user shares with an app while using the Google Picker API or the app's file picker.
   */
  file = 'https://www.googleapis.com/auth/drive.file',

  /**
   * View apps authorized to access your Drive.
   */
  appsReadonly = 'https://www.googleapis.com/auth/drive.apps.readonly',

  /**
   * View and download all your Drive files.
   */
  readonly = 'https://www.googleapis.com/auth/drive.readonly',

  /**
   * View and add to the activity record of files in your Drive.
   */
  activity = 'https://www.googleapis.com/auth/drive.activity',

  /**
   * View the activity record of files in your Drive.
   */
  activityReadonly = 'https://www.googleapis.com/auth/drive.activity.readonly',

  /**
   * View Drive files created or edited by Google Meet.
   */
  meetReadonly = 'https://www.googleapis.com/auth/drive.meet.readonly',

  /**
   * View and manage metadata of files in your Drive.
   */
  metadata = 'https://www.googleapis.com/auth/drive.metadata',

  /**
   * View metadata for files in your Drive.
   */
  metadataReadonly = 'https://www.googleapis.com/auth/drive.metadata.readonly',

  /**
   * Modify your Google Apps Script scripts' behavior.
   */
  scripts = 'https://www.googleapis.com/auth/drive.scripts',

  /**
   * View and manage all your Drive files.
   */
  all = 'https://www.googleapis.com/auth/drive',
}

export type GOOGLE_SCOPES = USERINFO_SCOPE | GOOGLE_DRIVE_SCOPE;
