/// <reference types="gapi" />

let gapi: typeof globalThis.gapi | undefined = undefined;

/**
 * Загрузить gapi
 * @returns
 */

export const loadGAPI = async (): Promise<typeof globalThis.gapi> =>
  new Promise<typeof globalThis.gapi>((resolve) => {
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

      globalThis.gapi.load('client', () => {
        gapi = globalThis.gapi;
        resolve(gapi);
      });
    });
  });
