import { useBrowserStoragePersistence } from '@entity/browserStoragePersistence';

/**
 * Exposes the user action to request more reliable browser storage.
 * @returns `enableStorage` action and `isRequesting` loading flag.
 */
export const useBrowserStoragePersistenceEnable = () => {
  const { requestPersistence, isRequesting } = useBrowserStoragePersistence();

  return { enableStorage: requestPersistence, isRequesting };
};
