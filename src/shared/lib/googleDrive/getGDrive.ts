import { createLogger } from '../logger';
import { getGAPI } from './getGAPI';
import { checkAndRequestAccess } from './getGsi';
import { fileTypeFromBuffer } from 'file-type';

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
    body: FileSystemWriteChunkType,
  ) => Promise<unknown>;
  downloadFile: (fileId: string, name?: string) => Promise<File>;
};

const { debug } = createLogger('getGDrive');

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
        uploadFile: async (fileId: string, file: FileSystemWriteChunkType) => {
          debug('uploadFile', fileId, file);

          let body: Blob;

          if (typeof file === 'string') {
            body = new Blob([file], { type: 'text/plain' });
          } else if (file instanceof Blob) {
            body = file;
          } else if (file instanceof ArrayBuffer || ArrayBuffer.isView(file)) {
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
};
