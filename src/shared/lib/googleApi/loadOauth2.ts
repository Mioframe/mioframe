/// <reference types="gapi.client.oauth2-v2" />

import { loadGAPI } from './loadGAPI';

let oauth2: typeof window.gapi.client.oauth2 | undefined = undefined;

export const loadOauth2 = async (): Promise<
  typeof window.gapi.client.oauth2
> => {
  if (!oauth2) {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    const gapi = await loadGAPI();

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
