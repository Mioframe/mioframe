import { DomainError } from '@shared/lib/error';
import type { ReadOnlyStaticDirectoryFSEntry } from '@shared/lib/fileSystem/DirectoryFSEntry';
import { createRootGDriveEntry } from '@shared/lib/googleDrive/createDirectoryGDriveEntry';
import { strictRecordGet, type StrictRecord } from '@shared/lib/strictRecord';

import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';

interface GUser {
  email: string;
  token: string;
}

const useGDriveAccountStore = () => {
  // todo: избыточно
  const { data } = useIDBKeyval<StrictRecord<string, GUser>>(
    'gDriveAccounts',
    {},
  );

  return data;
};

export const locateGDriveAccountRoot = (
  gUserHash: string,
): ReadOnlyStaticDirectoryFSEntry => {
  const accountStore = useGDriveAccountStore();
  const user: GUser | undefined = strictRecordGet(
    accountStore.value,
    gUserHash,
  );

  if (!user) {
    throw new DomainError(
      'Google user not found, unable to retrieve data from path',
    );
  }

  return createRootGDriveEntry(user.token, gUserHash);
};

// todo: создать сервис гугл диска, в который записывается пользователь/токен и доступен список директорий gDrive(пространства)

/**
 * Не нужен многопользовательский режим, это избыточно. достаточно отобразить доступные пространства после авторизации в google
 */
