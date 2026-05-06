import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
  VfsEvent,
  WriteFileResult,
  WriteOptions,
} from '../virtualFileSystem';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsEventSource,
  VfsEventType,
  VfsError,
} from '../virtualFileSystem';
import { dayjs } from '../dayjs';
import type { GDriveFileMeta } from '@shared/lib/googleDrive/api';
import {
  create,
  createWithContent,
  download,
  getGFileMetaList,
  SPACE,
  update,
  upload,
} from '@shared/lib/googleDrive/api';
import type { GOOGLE_SCOPE } from '@shared/lib/googleApi';
import { DRIVE_GOOGLE_SCOPE } from '@shared/lib/googleApi';
import { firstValueFrom, skip, type Observable } from 'rxjs';
import {
  getGoogleDrivePathEmail,
  getGoogleDrivePathSpace,
  GoogleDriveSpaceName as SpaceName,
  zodGoogleDriveSpaceName as zodSpaceName,
} from './googleDrivePath';

const GOOGLE_MIME_FOLDER = 'application/vnd.google-apps.folder';
const GOOGLE_DRIVE_MULTIPART_UPLOAD_LIMIT = 5 * 1024 * 1024;
/** Internal identifier for the virtual folder "Shared With Me" */
const SHARED_WITH_ME_ID = 'sharedWithMe';
const GOOGLE_DRIVE_ROOT_DESCRIPTION = 'Cloud storage from Google Drive';
const GOOGLE_ACCOUNT_ROOT_DESCRIPTION = 'Connected Google Drive account';
const SPACE_DESCRIPTIONS = {
  [SpaceName.appData]: 'Hidden app data used by this app',
  [SpaceName.myDrive]: 'Files and folders in your Google Drive',
  [SpaceName.sharedWithMe]: 'Files others shared with you',
} as const satisfies Record<(typeof SpaceName)[keyof typeof SpaceName], string>;

/** Google Drive file system mount modes */
export enum GoogleDriveMount {
  /** Root folder "My Drive" (default mode) */
  MyDrive = 'myDrive',
  /** "Shared with me" section (virtual folder with shared files) */
  SharedWithMe = 'sharedWithMe',
  /** Application data folder (hidden appDataFolder) */
  AppData = 'appData',
  /** Mounting a specific folder by its ID */
  SpecificFolder = 'specificFolder',
}

/** Mount options for selecting the visible Google Drive root. */
export interface GoogleDriveFsOptions {
  /**
   * Mount mode.
   * Default: GoogleDriveMount.MyDrive
   */
  mount?: GoogleDriveMount;

  /**
   * Folder ID to mount.
   * Ignored if mount is not set to GoogleDriveMount.SpecificFolder.
   */
  rootId?: string;

  /** Optional callback invoked when provider operations surface an error. */
  onError?: (error: unknown) => unknown;
}

/** Runtime dependencies required to build the Google Drive VFS provider. */
export interface GoogleDriveFileSystemProviderOptions {
  /** Requests an access token for the target email and Google scope set. */
  requestToken: (scope: GOOGLE_SCOPE[], email: string) => Promise<string>;
  /** Reactive authenticated Google session email list. */
  $sessions: Observable<string[]>;
}

/**
 * Creates and returns a Google Drive file system provider.
 *
 * Implements the IFileSystemProvider interface with full support for Google Drive operations:
 * - Reading and writing files
 * - Creating and deleting directories
 * - Moving and renaming entries
 * - Getting file statistics
 * - Listing directory contents
 *
 * Supports multi-account authentication through email-prefixed paths:
 * - `/` - Root showing all mounted accounts
 * - `/user@example.com/` - Account root with three spaces:
 *   - `My Drive/` - Main user storage
 *   - `Shared with me/` - Files shared with the user
 *   - `App Data/` - Hidden application data folder
 * @param providerOptions - Provider dependencies.
 * @returns IFileSystemProvider implementation for Google Drive.
 * @example
 * ```
 * const provider = googleDriveFileSystemProvider({
 *   requestToken: (scope, email) => google.accounts.oauth2.revokeToken(token),
 *   $sessions
 * });
 *
 * // Read a file from My Drive
 * const content = await provider.readFile('/user1@example.com/My Drive/report.pdf');
 *
 * // Create a directory
 * await provider.createDirectory('/user1@example.com/My Drive/Reports/2024');
 * ```
 */
export const googleDriveFileSystemProvider = (
  providerOptions: GoogleDriveFileSystemProviderOptions,
) => {
  const { requestToken, $sessions } = providerOptions;
  const extractEmailFromPath = (path: string): string => {
    const email = getGoogleDrivePathEmail(path);

    if (!email) {
      throw new Error(`Google Drive path must start with an email: ${path}`);
    }

    return email;
  };

  const resolvePathSpace = (rawPath: string) => {
    const spaceName = getGoogleDrivePathSpace(rawPath);

    switch (spaceName) {
      case SpaceName.appData:
        return {
          rootId: 'appDataFolder',
          scope: DRIVE_GOOGLE_SCOPE.appdata,
          space: SPACE.appDataFolder,
        };
      case SpaceName.sharedWithMe:
        return {
          rootId: SHARED_WITH_ME_ID,
          scope: DRIVE_GOOGLE_SCOPE.all,
          space: SPACE.drive,
        };
      case SpaceName.myDrive:
      default:
        return {
          rootId: 'root',
          scope: DRIVE_GOOGLE_SCOPE.all,
          space: SPACE.drive,
        };
    }
  };

  const getTokenForPath = async (rawPath: string): Promise<string> => {
    const email = extractEmailFromPath(rawPath);

    const { scope } = resolvePathSpace(rawPath);

    const token = await requestToken([scope], email);

    return token;
  };

  /**
   * Resolves a VFS path to a Google Drive file/folder ID.
   *
   * Traverses the path segment by segment, querying Google Drive API for each
   * directory entry. For "Shared with me" space, uses the `sharedWithMe` flag
   * in the query; otherwise uses `parentId` to restrict search to the parent folder.
   * @param rawPath - Absolute Google Drive VFS path.
   * @returns Matching Google Drive entry metadata.
   */
  const resolvePath = async (rawPath: string): Promise<GDriveFileMeta> => {
    const path = PathUtils.normalize(rawPath);

    const pathArray = PathUtils.split(path);

    const spaceName = zodSpaceName.parse(getGoogleDrivePathSpace(path));

    const { space, rootId } = resolvePathSpace(path);

    if (pathArray.length === 2) {
      return {
        id: rootId,
        name: spaceName,
        mimeType: GOOGLE_MIME_FOLDER,
        modifiedTime: dayjs().toISOString(),
      };
    }

    const relativePathArray = pathArray.slice(2);

    let currentId = rootId;
    let currentEntry: GDriveFileMeta | undefined;

    for (const [index, partName] of relativePathArray.entries()) {
      const isLast = index === relativePathArray.length - 1;

      // eslint-disable-next-line no-await-in-loop -- each path segment lookup depends on the previously resolved Drive folder id
      const token = await getTokenForPath(path);

      // eslint-disable-next-line no-await-in-loop -- the Drive query uses the current parent id resolved in the same sequential traversal
      const result = await getGFileMetaList(
        { ACCESS_TOKEN: token },
        {
          q: {
            name: partName,
            sharedWithMe: currentId === SHARED_WITH_ME_ID,
            trashed: false,
            parentId: currentId !== SHARED_WITH_ME_ID ? currentId : undefined,
          },
          pageSize: 1,
          spaces: [space],
        },
      );

      const file = result.files?.at(0);

      if (!file) {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `Entry not found: ${partName} in path ${rawPath}`,
        );
      }

      if (!isLast && file.mimeType !== GOOGLE_MIME_FOLDER) {
        throw new VfsError(
          FileSystemError.FileNotADirectory,
          `Path segment is not a directory: ${partName}`,
        );
      }

      currentId = file.id;
      currentEntry = file;
    }

    if (!currentEntry) {
      throw new VfsError(FileSystemError.FileNotFound, `Path not found: ${rawPath}`);
    }

    return currentEntry;
  };

  const virtualDirectoryStat = {
    type: FSNodeType.Directory,
    description: GOOGLE_DRIVE_ROOT_DESCRIPTION,
    capabilities: {
      canDelete: false,
      canChangePath: false,
      canEditChildren: false,
    },
  } satisfies FSNodeStat;

  const getEntryCapabilities = (entry: GDriveFileMeta): FSNodeStat['capabilities'] => {
    const isDirectory = entry.mimeType === GOOGLE_MIME_FOLDER;
    const canEditChildren =
      isDirectory &&
      entry.id !== SHARED_WITH_ME_ID &&
      (entry.capabilities?.canAddChildren ?? false);

    return {
      canDelete: entry.capabilities?.canTrash ?? false,
      canChangePath: entry.capabilities?.canRename ?? false,
      canEditChildren,
    };
  };

  const getSpaceDirectoryStat = (spaceName: (typeof SpaceName)[keyof typeof SpaceName]) =>
    ({
      type: FSNodeType.Directory,
      description: SPACE_DESCRIPTIONS[spaceName],
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: spaceName === SpaceName.myDrive || spaceName === SpaceName.appData,
      },
    }) satisfies FSNodeStat;

  const getContentSize = (content: FileContent): number => {
    if (typeof content === 'string') {
      return new TextEncoder().encode(content).byteLength;
    }
    if (content instanceof Blob) {
      return content.size;
    }
    if (content instanceof ArrayBuffer) {
      return content.byteLength;
    }
    return content.byteLength;
  };

  /**
   * Gets file or directory statistics.
   * @param rawPath - Absolute Google Drive VFS path.
   * @returns File or directory stat for the resolved path.
   */
  const stat = async (rawPath: string): Promise<FSNodeStat> => {
    const path = PathUtils.normalize(rawPath);

    try {
      if (path === '/') {
        return virtualDirectoryStat;
      }

      const pathArray = PathUtils.split(path);

      const email = extractEmailFromPath(path);

      if (email && pathArray.length === 1) {
        return {
          ...virtualDirectoryStat,
          description: GOOGLE_ACCOUNT_ROOT_DESCRIPTION,
        };
      }
      if (pathArray.length === 2) {
        return getSpaceDirectoryStat(zodSpaceName.parse(getGoogleDrivePathSpace(path)));
      }

      const entry = await resolvePath(path);

      // Safe conversion of size (may be undefined)
      const size = entry.size ? parseInt(entry.size, 10) : undefined;

      // Safe date conversion
      const creationTime = entry.createdTime ? dayjs(entry.createdTime).valueOf() : undefined;
      const modificationTime = entry.modifiedTime ? dayjs(entry.modifiedTime).valueOf() : undefined;

      return {
        type: entry.mimeType === GOOGLE_MIME_FOLDER ? FSNodeType.Directory : FSNodeType.File,
        size,
        creationTime,
        modificationTime,
        capabilities: getEntryCapabilities(entry),
      };
    } catch (e) {
      if (e instanceof VfsError) throw e;
      throw new VfsError(FileSystemError.FileNotFound, `Stat failed for ${path}`, e);
    }
  };

  /**
   * Reads a file from Google Drive.
   * @param path - Absolute Google Drive VFS path to a file.
   * @returns Downloaded file payload.
   */
  const readFile = async (path: string): Promise<File> => {
    const entry = await resolvePath(path);

    if (entry.mimeType === GOOGLE_MIME_FOLDER) {
      throw new VfsError(FileSystemError.FileIsADirectory, `Cannot read directory: ${path}`);
    }

    const token = await getTokenForPath(path);

    try {
      return await download({ ACCESS_TOKEN: token }, entry.id);
    } catch (e) {
      throw new VfsError(FileSystemError.Unknown, `Failed to download file: ${path}`, e);
    }
  };

  /**
   * Writes data to a file in Google Drive.
   * @param path - Absolute Google Drive VFS path to a file.
   * @param content - Content to write.
   * @param options - Write mode flags.
   * @returns Written file stat without a follow-up stat request.
   */
  const writeFile = async (
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<WriteFileResult> => {
    const parentPath = PathUtils.dirname(path);
    const fileName = PathUtils.basename(path);

    // 1. Check parent first (like MemoryFileSystem)
    let parentEntry: GDriveFileMeta;
    try {
      parentEntry = await resolvePath(parentPath);
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileNotFound) {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `Parent directory not found: ${parentPath}`,
        );
      }
      throw e;
    }

    if (parentEntry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Parent is not a directory: ${parentPath}`,
      );
    }

    if (parentEntry.id === SHARED_WITH_ME_ID) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Cannot create files directly in 'Shared with me' root.`,
      );
    }

    // 2. Check if file exists
    let existingEntry: GDriveFileMeta | null = null;
    try {
      existingEntry = await resolvePath(path);
    } catch (e) {
      if (!(e instanceof VfsError && e.code === FileSystemError.FileNotFound)) {
        throw e;
      }
    }

    if (existingEntry) {
      // Update existing file
      if (!options.overwrite) {
        throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
      }
      if (existingEntry.mimeType === GOOGLE_MIME_FOLDER) {
        throw new VfsError(
          FileSystemError.FileIsADirectory,
          `Cannot overwrite directory with file: ${path}`,
        );
      }

      const token = await getTokenForPath(path);

      await upload({ ACCESS_TOKEN: token }, existingEntry.id, content);

      return {
        stat: {
          type: FSNodeType.File,
          size: getContentSize(content),
          creationTime: existingEntry.createdTime
            ? dayjs(existingEntry.createdTime).valueOf()
            : undefined,
          capabilities: getEntryCapabilities(existingEntry),
        },
      };
    } else {
      if (!options.create) {
        throw new VfsError(FileSystemError.FileNotFound, `File not found: ${path}`);
      }

      const auth = { ACCESS_TOKEN: await getTokenForPath(path) };
      const contentSize = getContentSize(content);
      const resource = {
        name: fileName,
        parents: [parentEntry.id],
      } satisfies Parameters<typeof create>[1];

      if (contentSize <= GOOGLE_DRIVE_MULTIPART_UPLOAD_LIMIT) {
        const created = await createWithContent(auth, resource, content);

        return {
          stat: {
            type: FSNodeType.File,
            size: contentSize,
            creationTime: created.result.createdTime
              ? dayjs(created.result.createdTime).valueOf()
              : undefined,
            capabilities: getEntryCapabilities(created.result),
          },
        };
      }

      const created = await create(auth, resource);

      try {
        await upload(auth, created.result.id, content);
      } catch (uploadError) {
        await update(auth, created.result.id, {
          trashed: true,
        });
        throw uploadError;
      }

      return {
        stat: {
          type: FSNodeType.File,
          size: getContentSize(content),
        },
      };
    }
  };

  const readRootDirectory = async (): Promise<[string, FSNodeStat][]> => {
    const accountList = await firstValueFrom($sessions);

    return accountList.map((email): [string, FSNodeStat] => [
      email,
      {
        type: FSNodeType.Directory,
        description: GOOGLE_ACCOUNT_ROOT_DESCRIPTION,
        capabilities: {
          canDelete: false,
          canChangePath: false,
          canEditChildren: false,
        },
      },
    ]);
  };

  const readAccountDirectory = () =>
    Object.values(SpaceName).map((name): [string, FSNodeStat] => [
      name,
      getSpaceDirectoryStat(name),
    ]);

  const watch = (callback: (event: VfsEvent) => void) => {
    // ObservableIDB-backed session streams replay the current store snapshot on subscribe; provider watchers should react only to later session-store changes.
    const subscription = $sessions.pipe(skip(1)).subscribe(() => {
      callback({
        source: VfsEventSource.PROVIDER,
        type: VfsEventType.UPDATE,
        path: '/',
        nodeType: FSNodeType.Directory,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  /**
   * Reads the contents of a directory.
   * @param rawPath - Absolute Google Drive VFS path to a directory.
   * @returns Directory entries with mapped VFS stats.
   */
  const readDirectory = async (rawPath: string): Promise<[string, FSNodeStat][]> => {
    const pathArray = PathUtils.split(rawPath);

    if (pathArray.length === 0) {
      return await readRootDirectory();
    }

    if (pathArray.length === 1) {
      return readAccountDirectory();
    }

    const entry = await resolvePath(rawPath);

    if (entry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(FileSystemError.FileNotADirectory, `Not a directory: ${rawPath}`);
    }

    const { space } = resolvePathSpace(rawPath);

    const result = await getGFileMetaList(
      {
        ACCESS_TOKEN: await getTokenForPath(rawPath),
      },
      {
        q: {
          trashed: false,
          sharedWithMe: entry.id === SHARED_WITH_ME_ID,
          parentId: entry.id !== SHARED_WITH_ME_ID ? entry.id : undefined,
        },
        pageSize: 1000,
        spaces: [space],
        fetchAll: true, // Ensure getting all files through pagination
      },
    );

    const entries: [string, FSNodeStat][] = [];

    if (result.files) {
      for (const file of result.files) {
        // Safe conversion of size from string to number
        const size = file.size ? parseInt(file.size, 10) : undefined;

        // Safe date conversion
        const creationTime = file.createdTime ? dayjs(file.createdTime).valueOf() : undefined;
        const modificationTime = file.modifiedTime ? dayjs(file.modifiedTime).valueOf() : undefined;

        const fsNodeStat = {
          type: file.mimeType === GOOGLE_MIME_FOLDER ? FSNodeType.Directory : FSNodeType.File,
          creationTime,
          modificationTime,
          size,
          capabilities: getEntryCapabilities(file),
        } satisfies FSNodeStat;

        entries.push([file.name, fsNodeStat]);
      }
    }

    return entries;
  };

  /**
   * Creates a directory in Google Drive.
   * @param path - Absolute Google Drive VFS path to the new directory.
   */
  const createDirectory = async (path: string): Promise<void> => {
    try {
      await resolvePath(path);
      throw new VfsError(FileSystemError.FileExists, `Directory already exists: ${path}`);
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileExists) throw e;
      if (!(e instanceof VfsError && e.code === FileSystemError.FileNotFound)) throw e;
    }

    const parentPath = PathUtils.dirname(path);
    const dirName = PathUtils.basename(path);

    const parentEntry = await resolvePath(parentPath);

    // Prevent creating directories in the root of "Shared with me"
    if (parentEntry.id === SHARED_WITH_ME_ID) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Cannot create directories directly in 'Shared with me' root.`,
      );
    }

    if (parentEntry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Parent is not a directory: ${parentPath}`,
      );
    }

    await create(
      {
        ACCESS_TOKEN: await getTokenForPath(path),
      },
      {
        name: dirName,
        parents: [parentEntry.id],
        mimeType: GOOGLE_MIME_FOLDER,
      },
    );
  };

  /**
   * Deletes a file or directory from Google Drive.
   * @param path - Absolute Google Drive VFS path to delete.
   * @param recursive - Whether directory deletion may recurse.
   */
  const _delete = async (path: string, recursive: boolean): Promise<void> => {
    if (path === '/') {
      throw new Error('Cannot delete root');
    }

    const entry = await resolvePath(path);

    if (getEntryCapabilities(entry)?.canDelete !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Deletion is not allowed for path: ${path}`,
      );
    }

    if (!recursive && entry.mimeType === GOOGLE_MIME_FOLDER) {
      const { space } = resolvePathSpace(path);

      const result = await getGFileMetaList(
        {
          ACCESS_TOKEN: await getTokenForPath(path),
        },
        {
          q: {
            trashed: false,
            sharedWithMe: entry.id === SHARED_WITH_ME_ID,
            parentId: entry.id !== SHARED_WITH_ME_ID ? entry.id : undefined,
          },
          pageSize: 1,
          spaces: [space],
        },
      );

      // Safe array length check
      if (result.files && result.files.length > 0) {
        throw new VfsError(
          FileSystemError.DirectoryNotEmpty,
          'Directory not empty (use recursive=true)',
        );
      }
    }

    await update(
      {
        ACCESS_TOKEN: await getTokenForPath(path),
      },
      entry.id,
      {
        trashed: true,
      },
    );
  };

  /**
   * Renames a file or directory in Google Drive.
   * @param oldPath - Current absolute Google Drive VFS path.
   * @param newPath - New absolute Google Drive VFS path.
   */
  const move = async (oldPath: string, newPath: string): Promise<void> => {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return;

    const sourceEntry = await resolvePath(normalizedOld);

    if (getEntryCapabilities(sourceEntry)?.canChangePath !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed for path: ${oldPath}`,
      );
    }

    try {
      await resolvePath(normalizedNew);
      throw new VfsError(FileSystemError.FileExists, `Destination exists: ${newPath}`);
    } catch (e) {
      if (e instanceof VfsError && e.code !== FileSystemError.FileNotFound) throw e;
    }

    const newDirName = PathUtils.dirname(normalizedNew);
    const newFileName = PathUtils.basename(normalizedNew);

    const destinationParentEntry = await resolvePath(newDirName);

    if (destinationParentEntry.id === SHARED_WITH_ME_ID) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Cannot move files directly into 'Shared with me' root.`,
      );
    }

    if (destinationParentEntry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Destination parent is not a directory: ${newDirName}`,
      );
    }
    if (getEntryCapabilities(destinationParentEntry)?.canEditChildren !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Path change is not allowed inside directory: ${newDirName}`,
      );
    }

    const currentParents = sourceEntry.parents ?? [];
    const removeParents = currentParents.filter((p) => p !== destinationParentEntry.id);

    await update(
      {
        ACCESS_TOKEN: await getTokenForPath(oldPath),
      },
      sourceEntry.id,
      {
        name: newFileName,
        addParents:
          removeParents.length === currentParents.length ? [destinationParentEntry.id] : undefined,
        removeParents: removeParents.length > 0 ? removeParents : undefined,
      },
    );
  };

  return {
    createDirectory,
    delete: _delete,
    move,
    readDirectory,
    readFile,
    stat,
    watch,
    writeFile,
  } satisfies IFileSystemProvider;
};
