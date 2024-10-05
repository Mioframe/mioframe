export let stateGapi: typeof gapi | undefined;

export const getGAPI = async (): Promise<typeof gapi> => {
  if (stateGapi) {
    return stateGapi;
  }

  const gapiUrl = '//apis.google.com/js/api.js';
  /* @vite-ignore */
  await import(gapiUrl);

  return new Promise<typeof gapi>((resolve) => {
    gapi.load('client', () => {
      stateGapi = gapi;
      resolve(stateGapi);
    });
  });
};
