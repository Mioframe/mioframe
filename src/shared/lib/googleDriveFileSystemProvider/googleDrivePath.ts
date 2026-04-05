import { z } from 'zod/v4-mini';
import { PathUtils } from '../virtualFileSystem';
import { GOOGLE_DRIVE_ROOT_NAME } from '@shared/service/google/useGoogleService';
import { DRIVE_GOOGLE_SCOPE } from '@shared/lib/googleApi';

const zodEmail = z.email();
export const GoogleDriveSpaceName = {
  appData: 'App Data',
  myDrive: 'My Drive',
  sharedWithMe: 'Shared with me',
} as const;

export const zodGoogleDriveSpaceName = z.enum([
  GoogleDriveSpaceName.appData,
  GoogleDriveSpaceName.myDrive,
  GoogleDriveSpaceName.sharedWithMe,
]);

export const getGoogleDrivePathEmail = (
  path: string,
  { hasRootName = false }: { hasRootName?: boolean } = {},
) => {
  const segments = PathUtils.split(path);
  const emailIndex = hasRootName ? 1 : 0;

  if (hasRootName && segments.at(0) !== GOOGLE_DRIVE_ROOT_NAME) {
    return undefined;
  }

  const result = zodEmail.safeParse(segments.at(emailIndex));

  return result.data;
};

export const getGoogleDrivePathScope = (
  path: string,
  { hasRootName = false }: { hasRootName?: boolean } = {},
) => {
  const space = getGoogleDrivePathSpace(path, { hasRootName });

  switch (space) {
    case GoogleDriveSpaceName.appData:
      return DRIVE_GOOGLE_SCOPE.appdata;
    case GoogleDriveSpaceName.sharedWithMe:
    case GoogleDriveSpaceName.myDrive:
    default:
      return DRIVE_GOOGLE_SCOPE.all;
  }
};

export const getGoogleDrivePathSpace = (
  path: string,
  { hasRootName = false }: { hasRootName?: boolean } = {},
) => {
  const segments = PathUtils.split(path);
  const spaceIndex = hasRootName ? 2 : 1;

  if (hasRootName && segments.at(0) !== GOOGLE_DRIVE_ROOT_NAME) {
    return undefined;
  }

  return zodGoogleDriveSpaceName.safeParse(segments.at(spaceIndex)).data;
};
