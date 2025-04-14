import type {
  DirectoryFSEntry,
  GeneralFSEntry,
  FileFSEntry,
} from '../fileSystem';

export type LocalEntryPath = string[];

export interface GeneralLocalEntry extends GeneralFSEntry {}

export interface DirectoryLocalEntry extends DirectoryFSEntry {}

export interface FileLocalEntry extends FileFSEntry {}
