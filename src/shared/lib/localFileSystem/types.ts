import type {
  WritableDirectoryFSEntry,
  GeneralFSEntry,
  FileFSEntry,
  ReadonlyDirectoryFSEntry,
} from '../fileSystem';

export type LocalEntryPath = string[];

export interface GeneralLocalEntry extends GeneralFSEntry {}

export interface ReadonlyDirectoryLocalEntry extends ReadonlyDirectoryFSEntry {}

export interface WritableDirectoryLocalEntry extends WritableDirectoryFSEntry {}

export type DirectoryLocalEntry =
  | WritableDirectoryLocalEntry
  | ReadonlyDirectoryLocalEntry;

export interface FileLocalEntry extends FileFSEntry {}
