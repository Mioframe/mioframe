import type { ComputedRef } from 'vue';
import type { GDriveDirectory, GDriveFile } from '../../shared/lib/googleDrive';

export interface UseGDriveEntry {
  readonly label: ComputedRef<string>;
  remove: () => Promise<void>;
}

type DirectoryList = Map<string, GDriveDirectory | GDriveFile>;

export interface UseGDriveDirectory extends UseGDriveEntry {
  createDirectory: (name: string) => Promise<GDriveDirectory>;
  writeFile: (name: string, file?: File) => Promise<GDriveFile>;
  rename: (newName: string) => Promise<GDriveDirectory>;
  map: ComputedRef<DirectoryList>;
}

export interface UseGDriveFile extends UseGDriveEntry {
  read: () => Promise<File>;
  rename: (newName: string) => Promise<GDriveFile>;
}
