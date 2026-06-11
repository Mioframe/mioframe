import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import { getGoogleDrivePathEmail } from '@shared/lib/googleDriveFileSystemProvider';
import { GoogleAuthError, GoogleAuthErrorCode } from '@shared/service';

export enum GoogleDriveAccessRecoveryKind {
  popupBlocked = 'popupBlocked',
  accountMismatch = 'accountMismatch',
  reauthRequired = 'reauthRequired',
}

export const getGoogleDriveAccessRecoveryError = (path: string, errors: unknown[]) => {
  if (!getGoogleDrivePathEmail(path, { hasRootName: true })) {
    return undefined;
  }

  for (const error of errors) {
    if (
      error instanceof GoogleAuthError &&
      [
        GoogleAuthErrorCode.popupBlocked,
        GoogleAuthErrorCode.reauthRequired,
        GoogleAuthErrorCode.accountMismatch,
      ].includes(error.code)
    ) {
      return error;
    }
  }

  return undefined;
};

export const useGoogleDriveAccessRecoveryState = ({
  path,
  errors,
}: {
  path: MaybeRefOrGetter<string>;
  errors: MaybeRefOrGetter<unknown[]>;
}) => {
  const state = computed(() => {
    const currentPath = toValue(path);
    const email = getGoogleDrivePathEmail(currentPath, { hasRootName: true });
    const error = getGoogleDriveAccessRecoveryError(currentPath, toValue(errors));

    if (!email || !error) {
      return undefined;
    }

    if (error.code === GoogleAuthErrorCode.popupBlocked) {
      return {
        kind: GoogleDriveAccessRecoveryKind.popupBlocked,
        expectedEmail: email,
      };
    }

    if (error.code === GoogleAuthErrorCode.accountMismatch) {
      return {
        actualEmail: error.actualEmail,
        kind: GoogleDriveAccessRecoveryKind.accountMismatch,
        expectedEmail: email,
      };
    }

    return {
      kind: GoogleDriveAccessRecoveryKind.reauthRequired,
      expectedEmail: email,
    };
  });

  return {
    state,
  };
};
