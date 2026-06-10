declare module '*.md?raw' {
  const content: string;
  export default content;
}

declare global {
  interface Navigator {
    // for WebKitGTK
    readonly storage?: undefined | StorageManager;
  }

  interface FileSystemHandle {
    move?(destination: FileSystemDirectoryHandle, newName: string): Promise<void>;

    // https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle/queryPermission#browser_compatibility
    queryPermission?(descriptor?: FileSystemHandlePermissionDescriptor): Promise<PermissionState>;
  }

  /** Non-standard browser install prompt event. https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent */
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
    prompt(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

export {};
