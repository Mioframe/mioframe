import type { ComputedRef } from 'vue';
import type { GDriveDirectory, GDriveFile } from '../../shared/lib/googleDrive';
import type { Collection } from '@shared/ui/TreeMenu/useIterable';

export interface UseGDriveEntry {
  readonly label: ComputedRef<string>;
  remove: () => Promise<void>;
}

export interface UseGDriveDirectory extends UseGDriveEntry {
  createDirectory: (name: string) => Promise<GDriveDirectory>;
  writeFile: (name: string, file?: File) => Promise<GDriveFile>;
  rename: (newName: string) => Promise<GDriveDirectory>;
  children: ComputedRef<Collection<[string, GDriveDirectory | GDriveFile]>>;
}

export interface UseGDriveFile extends UseGDriveEntry {
  read: () => Promise<File>;
  rename: (newName: string) => Promise<GDriveFile>;
}
