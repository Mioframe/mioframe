import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { stringPath } from './directoriesStoreService';
import { DomainError } from '@shared/lib/error';

export class EntryNotFoundError extends DomainError {
  constructor(path: EntryPath | EntryPathString) {
    super(`Entry for path ${stringPath(path)} not found`);
  }
}

export class EntryNotDirectoryError extends DomainError {
  constructor(path: EntryPath | EntryPathString) {
    super(`Entry ${stringPath(path)} is not a directory`);
  }
}

export type EntryDescription = {
  name: string;
  type: 'file' | 'directory';
  path: EntryPath;
};

export interface DirectoryDescription extends EntryDescription {
  type: 'directory';
  entries: EntryDescription[];
}
