import { api } from '../googleDrive/api';
import { loadGAPI } from './loadGAPI';
import type { AdvancedGDrive } from './types';

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
            ACCESS_TOKEN: g.auth.getToken().access_token,
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
            ACCESS_TOKEN: g.auth.getToken().access_token,
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
