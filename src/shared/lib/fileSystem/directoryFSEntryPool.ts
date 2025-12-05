import { defineScopePool, createPoolConsumer } from '../scopePool';
import { setupDirectoryFSEntryState } from './directoryFSEntryState';

export const directoryFSEntryPool = defineScopePool(setupDirectoryFSEntryState);

export const useDirectoryFSEntryPool = createPoolConsumer(directoryFSEntryPool);
