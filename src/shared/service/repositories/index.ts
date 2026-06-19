export { useRepositoriesService } from './repositoriesService';
export { RepositoryImportErrorCode } from './repositoryImportErrorCode';
export {
  getRegularDirectoryEntries,
  getRepositoryFacts,
  isRepositoryStorageCandidateFileName,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- compatibility re-export
  isAutomergeDocumentFileName,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- compatibility re-export
  isRepositoryStorageCandidateDocumentFileName,
  isRepositoryMarkerFileName,
  shouldHideRepositoryStorageFile,
} from './repositoryStorageFiles';
export type { RepositoryDirectoryEntry } from './repositoryContracts';
export type { RepositoryFacts } from './repositoryStorageFiles';
