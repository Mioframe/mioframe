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
