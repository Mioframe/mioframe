export interface DirectoryGDriveApi {
  getName: () => string;
  rename: (newName: string) => Promise<DirectoryGDriveApi>;
  getList: () => Promise<Map<string, FileGDriveApi | DirectoryGDriveApi>>;
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileGDriveApi>;
  removeByName: (name: string) => Promise<void>;
  remove: () => Promise<void>;
  createDirectory: (name: string) => Promise<DirectoryGDriveApi>;
}

export interface FileGDriveApi {
  getName: () => string;
  read: () => Promise<File>;
  remove: () => Promise<void>;
  rename: (newName: string) => Promise<FileGDriveApi>;
}

export const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
