import { zodIs } from '../validateZodScheme';
import type { PartialAutomergeFileName, PartialStorageKey } from './types';
import { KEY_SEPARATE, zodPartialAutomergeFileName } from './types';

/**
 * Returns the Automerge storage filename prefix used to match all files for a partial storage key.
 * @param keyPrefix - Partial storage key whose filename prefix should be computed.
 * @returns Legacy filename prefix string, or undefined when the key cannot be encoded.
 */
export const getPartialStorageKeyFileNamePrefix = (
  keyPrefix: PartialStorageKey,
): PartialAutomergeFileName | undefined => {
  const maybePartialAutomergeFileName = keyPrefix.join(KEY_SEPARATE);

  return zodIs(maybePartialAutomergeFileName, zodPartialAutomergeFileName)
    ? maybePartialAutomergeFileName
    : undefined;
};
