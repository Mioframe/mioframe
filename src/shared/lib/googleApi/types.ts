export type AdvancedGDrive = typeof gapi.client.drive & {
  uploadFile: (
    fileId: string,
    body: FileSystemWriteChunkType,
  ) => Promise<unknown>;
  downloadFile: (fileId: string, name?: string) => Promise<File>;
};
