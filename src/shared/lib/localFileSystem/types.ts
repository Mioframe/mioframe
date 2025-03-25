import type {
  DirectoryFSEntry,
  GeneralFSEntry,
  FileFSEntry,
} from '../fileSystem';

export type LocalEntryPath = string[];

export interface LocalGeneralEntry extends GeneralFSEntry {}

export interface LocalDirectoryEntry extends DirectoryFSEntry {}

export interface LocalFileEntry extends FileFSEntry {}
