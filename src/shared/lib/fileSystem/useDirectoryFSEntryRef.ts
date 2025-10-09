import { createScopesWeakMap, defineScopesWeakMapRef } from '../scopesWeakMap';
import { directoryFSEntryRef } from './directoryFSEntryRef';

export const useDirectoryFSEntryCache =
  createScopesWeakMap(directoryFSEntryRef);

export const useDirectoryFSEntryCacheRef = defineScopesWeakMapRef(
  useDirectoryFSEntryCache,
);
