import { getGAPI } from './getGAPI';
import { checkAndRequestAccess } from './getGsi';

export type AccessGDrive =
  | 'appdata'
  | 'appfolder'
  | 'install'
  | 'file'
  | 'apps.readonly'
  | 'readonly'
  | 'activity'
  | 'activity.readonly'
  | 'meet.readonly'
  | 'metadata'
  | 'metadata.readonly'
  | 'scripts'
  | 'all';

export type AdvancedGDrive = typeof gapi.client.drive & {
  uploadFile: (
    fileId: string,
    body: unknown,
  ) => Promise<gapi.client.Response<unknown>>;
};

let gdrive: AdvancedGDrive | undefined;

export const getGDrive = async (
  clientId: string,
  access: [AccessGDrive, ...AccessGDrive[]],
) => {
  const scopes = <[string, ...string[]]>(
    access.map(
      (access) =>
        `https://www.googleapis.com/auth/drive${access === 'all' ? '' : `.${access}`}`,
    )
  );

  const gapi = await getGAPI();

  if (await checkAndRequestAccess(clientId, scopes)) {
    if (!gdrive) {
      await gapi.client.init({
        clientId,
        discoveryDocs: [
          'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
        ],
      });

      gdrive = {
        ...gapi.client.drive,
        uploadFile: async (fileId: string, body: unknown) =>
          await gapi.client.request({
            path: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
            method: 'PATCH',
            body,
            params: {
              uploadType: 'media',
              fields: 'id,version,name',
            },
          }),
      };
    }
    return gdrive;
  }
  return undefined;
};
