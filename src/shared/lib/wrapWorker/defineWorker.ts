import { expose } from 'comlink';
import { vueTransferHandlerSet } from './vueTransferHandlerSet';

export const defineWorker = <T>(setup: () => T): T => {
  // vueTransferHandlerSet();

  const api = setup();

  expose(api);

  return api;
};
