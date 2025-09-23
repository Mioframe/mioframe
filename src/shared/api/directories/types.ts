import type { EntryPath } from '@shared/lib/fileSystem';

export const ENTRY_NOT_FOUND = 'ENTRY_NOT_FOUND';

export type ENTRY_NOT_FOUND = typeof ENTRY_NOT_FOUND;

export type EntryDescription = {
  name: string;
  type: 'file' | 'directory';
  path: EntryPath;
};

export interface DirectoryDescription extends EntryDescription {
  type: 'directory';
  entries: EntryDescription[];
}
