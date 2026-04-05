import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
  WriteOptions,
} from '../virtualFileSystem';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsError,
} from '../virtualFileSystem';
import { dayjs } from '../dayjs';
import type { GDriveFileMeta } from '@shared/lib/googleDrive/api';
import {
  create,
  download,
  getGFileMetaList,
  SPACE,
  update,
  upload,
} from '@shared/lib/googleDrive/api';
import { z } from 'zod/v4-mini';
import { values } from 'es-toolkit/compat';
import type { GOOGLE_SCOPE } from '@shared/lib/googleApi';
import { DRIVE_GOOGLE_SCOPE } from '@shared/lib/googleApi';

const GOOGLE_MIME_FOLDER = 'application/vnd.google-apps.folder';
/** Internal identifier for the virtual folder "Shared With Me" */
const SHARED_WITH_ME_ID = 'sharedWithMe';

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

  onError?: (error: unknown) => unknown;
}

const SpaceName = {
  SharedWithMe: 'Shared with me',
  AppData: 'App Data',
  MyDrive: 'My Drive',
} as const;

const zodSpaceName = z.enum(values(SpaceName));

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
 *
 * @param requestToken - Function to request OAuth2 token for given scope and email
 * @param getSessionList - Function to retrieve list of authenticated session emails
 *
 * @returns IFileSystemProvider implementation for Google Drive
 *
 * @example
 * ```
 * const provider = googleDriveFileSystemProvider({
 *   requestToken: (scope, email) => google.accounts.oauth2.revokeToken(token),
 *   getSessionList: () => ['user1@example.com', 'user2@example.com']
 * });
 *
 * // Read a file from My Drive
 * const content = await provider.readFile('/user1@example.com/My Drive/report.pdf');
 *
 * // Create a directory
 * await provider.createDirectory('/user1@example.com/My Drive/Reports/2024');
 * ```
 */
export const googleDriveFileSystemProvider = ({
  getSessionList,
  requestToken,
}: {
  requestToken: (scope: GOOGLE_SCOPE[], email: string) => Promise<string>;
  getSessionList: () => Promise<string[]>;
}) => {
  const extractEmailFromPath = (path: string): string => {
    const pathArray = PathUtils.split(path);

    return z.email().parse(pathArray.at(0));
  };

  const resolvePathSpace = (rawPath: string) => {
    const path = PathUtils.normalize(rawPath);
    const pathArray = PathUtils.split(path);
    const spaceName = zodSpaceName.parse(pathArray.at(1));

    switch (spaceName) {
      case SpaceName.AppData:
        return {
          rootId: 'appDataFolder',
          scope: DRIVE_GOOGLE_SCOPE.appdata,
          space: SPACE.appDataFolder,
        };
      case SpaceName.SharedWithMe:
        return {
          rootId: SHARED_WITH_ME_ID,
          scope: DRIVE_GOOGLE_SCOPE.all,
          space: SPACE.drive,
        };
      case SpaceName.MyDrive:
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
   */
  const resolvePath = async (rawPath: string): Promise<GDriveFileMeta> => {
    const path = PathUtils.normalize(rawPath);

    const pathArray = PathUtils.split(path);

    const spaceName = zodSpaceName.parse(pathArray.at(1));

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

      const token = await getTokenForPath(path);

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
      throw new VfsError(
        FileSystemError.FileNotFound,
        `Path not found: ${rawPath}`,
      );
    }

    return currentEntry;
  };

  const virtualDirectoryStat = {
    type: FSNodeType.Directory,
    canDelete: false,
  } satisfies FSNodeStat;

  /**
   * Gets file or directory statistics.
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
        return virtualDirectoryStat;
      }

      const entry = await resolvePath(path);

      // Safe conversion of size (may be undefined)
      const size = entry.size ? parseInt(entry.size, 10) : undefined;

      // Safe date conversion
      const creationTime = entry.createdTime
        ? dayjs(entry.createdTime).valueOf()
        : undefined;
      const modificationTime = entry.modifiedTime
        ? dayjs(entry.modifiedTime).valueOf()
        : undefined;

      return {
        type:
          entry.mimeType === GOOGLE_MIME_FOLDER
            ? FSNodeType.Directory
            : FSNodeType.File,
        size,
        creationTime,
        modificationTime,
        canDelete: entry.capabilities?.canTrash ?? false,
      };
    } catch (e) {
      if (e instanceof VfsError) throw e;
      throw new VfsError(
        FileSystemError.FileNotFound,
        `Stat failed for ${path}`,
        e,
      );
    }
  };

  /**
   * Reads a file from Google Drive.
   */
  const readFile = async (path: string): Promise<File> => {
    const entry = await resolvePath(path);

    if (entry.mimeType === GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileIsADirectory,
        `Cannot read directory: ${path}`,
      );
    }

    const token = await getTokenForPath(path);

    try {
      return await download({ ACCESS_TOKEN: token }, entry.id);
    } catch (e) {
      throw new VfsError(
        FileSystemError.Unknown,
        `Failed to download file: ${path}`,
        e,
      );
    }
  };

  /**
   * Writes data to a file in Google Drive.
   */
  const writeFile = async (
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<void> => {
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
    } else {
      if (!options.create) {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `File not found: ${path}`,
        );
      }

      const created = await create(
        { ACCESS_TOKEN: await getTokenForPath(path) },
        {
          name: fileName,
          parents: [parentEntry.id],
        },
      );

      try {
        await upload(
          { ACCESS_TOKEN: await getTokenForPath(path) },
          created.result.id,
          content,
        );
      } catch (uploadError) {
        await update(
          {
            ACCESS_TOKEN: await getTokenForPath(path),
          },
          created.result.id,
          {
            trashed: true,
          },
        );
        throw uploadError;
      }
    }
  };

  const readRootDirectory = async (): Promise<[string, FSNodeStat][]> => {
    const accountList = await getSessionList();

    return accountList.map((email): [string, FSNodeStat] => [
      email,
      {
        type: FSNodeType.Directory,
      },
    ]);
  };

  const readAccountDirectory = () =>
    Object.values(SpaceName).map((name): [string, FSNodeStat] => [
      name,
      { type: FSNodeType.Directory },
    ]);

  /**
   * Reads the contents of a directory.
   */
  const readDirectory = async (
    rawPath: string,
  ): Promise<[string, FSNodeStat][]> => {
    const pathArray = PathUtils.split(rawPath);

    if (pathArray.length === 0) {
      return await readRootDirectory();
    }

    if (pathArray.length === 1) {
      return readAccountDirectory();
    }

    const entry = await resolvePath(rawPath);

    if (entry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Not a directory: ${rawPath}`,
      );
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
        const creationTime = file.createdTime
          ? dayjs(file.createdTime).valueOf()
          : undefined;
        const modificationTime = file.modifiedTime
          ? dayjs(file.modifiedTime).valueOf()
          : undefined;

        const fsNodeStat = {
          type:
            file.mimeType === GOOGLE_MIME_FOLDER
              ? FSNodeType.Directory
              : FSNodeType.File,
          creationTime,
          modificationTime,
          size,
          canDelete: file.capabilities?.canTrash ?? false,
        } satisfies FSNodeStat;

        entries.push([file.name, fsNodeStat]);
      }
    }

    return entries;
  };

  /**
   * Creates a directory in Google Drive.
   */
  const createDirectory = async (path: string): Promise<void> => {
    try {
      await resolvePath(path);
      throw new VfsError(
        FileSystemError.FileExists,
        `Directory already exists: ${path}`,
      );
    } catch (e) {
      if (e instanceof VfsError && e.code === FileSystemError.FileExists)
        throw e;
      if (!(e instanceof VfsError && e.code === FileSystemError.FileNotFound))
        throw e;
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
   */
  const _delete = async (path: string, recursive: boolean): Promise<void> => {
    if (path === '/') {
      throw new Error('Cannot delete root');
    }

    const entry = await resolvePath(path);

    if (entry.capabilities?.canTrash !== true) {
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
   */
  const move = async (oldPath: string, newPath: string): Promise<void> => {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return;

    const sourceEntry = await resolvePath(normalizedOld);

    if (sourceEntry.capabilities?.canTrash !== true) {
      throw new VfsError(
        FileSystemError.NoPermissions,
        `Move is not allowed for path: ${oldPath}`,
      );
    }

    try {
      await resolvePath(normalizedNew);
      throw new VfsError(
        FileSystemError.FileExists,
        `Destination exists: ${newPath}`,
      );
    } catch (e) {
      if (e instanceof VfsError && e.code !== FileSystemError.FileNotFound)
        throw e;
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

    const currentParents = sourceEntry.parents ?? [];
    const removeParents = currentParents.filter(
      (p) => p !== destinationParentEntry.id,
    );

    await update(
      {
        ACCESS_TOKEN: await getTokenForPath(oldPath),
      },
      sourceEntry.id,
      {
        name: newFileName,
        addParents:
          removeParents.length === currentParents.length
            ? [destinationParentEntry.id]
            : undefined,
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
    writeFile,
  } satisfies IFileSystemProvider;
};
