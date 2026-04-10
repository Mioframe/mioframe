import { zodIs } from '../validateZodScheme';
import {
  type PartialStorageKey,
  zodPartialAutomergeFileName,
  fileExtension,
  KEY_SEPARATE,
  zodPartialStorageKey,
} from './types';

export const fileNameToPartialKey = (fileName: unknown): PartialStorageKey | undefined => {
  const partialAutomergeFileName = zodIs(fileName, zodPartialAutomergeFileName)
    ? fileName
    : undefined;

  const maybePartialStorageKey = partialAutomergeFileName
    ?.replace(`.${fileExtension}`, '')
    .split(KEY_SEPARATE);

  return zodIs(maybePartialStorageKey, zodPartialStorageKey) ? maybePartialStorageKey : undefined;
};
