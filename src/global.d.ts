declare global {
  interface Navigator {
    // for WebKitGTK
    readonly storage?: undefined | StorageManager;
  }

  interface FileSystemHandle {
    move?(
      destination: FileSystemDirectoryHandle,
      newName: string,
    ): Promise<void>;
  }
}

export {};
