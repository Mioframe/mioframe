import { expose } from 'comlink';

export const defineWorker = <T>(setup: () => T): T => {
  // vueTransferHandlerSet();

  console.debug('setup worker api');
  const api = setup();

  expose(api);

  return api;
};
