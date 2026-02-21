import { zodIs } from '../validateZodScheme';
import {
  type PartialStorageKey,
  type PartialAutomergeFileName,
  zodPartialStorageKey,
  KEY_SEPARATE,
  fileExtension,
  zodPartialAutomergeFileName,
} from './types';

export const partialKeyToFileName = (
  key: PartialStorageKey,
  { withExtension = true }: { withExtension?: boolean } = {
    withExtension: true,
  },
): PartialAutomergeFileName | undefined => {
  const partialStorageKey = zodIs(key, zodPartialStorageKey) ? key : undefined;

  if (partialStorageKey) {
    const maybePartialAutomergeFileName = withExtension
      ? `${partialStorageKey.join(KEY_SEPARATE)}.${fileExtension}`
      : partialStorageKey.join(KEY_SEPARATE);

    return zodIs(maybePartialAutomergeFileName, zodPartialAutomergeFileName)
      ? maybePartialAutomergeFileName
      : undefined;
  }

  return undefined;
};
