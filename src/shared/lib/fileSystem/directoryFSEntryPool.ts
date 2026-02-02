import { defineScopePool, createUsePoolHook } from '../scopePool';
import { setupDirectoryFSEntryState } from './directoryFSEntryState';

export const directoryFSEntryPool = defineScopePool(setupDirectoryFSEntryState);

export const useDirectoryFSEntryPool = createUsePoolHook(directoryFSEntryPool);
