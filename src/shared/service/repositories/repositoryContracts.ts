import type { FSNodeStat } from '@shared/lib/virtualFileSystem';

export { RepositoryImportErrorCode } from './repositoryImportErrorCode';

/** Directory entry contract used for repository storage inspection and file-list filtering. */
export type RepositoryDirectoryEntry = readonly [name: string, stat: FSNodeStat];
