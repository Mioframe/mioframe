import type { GoogleAuthParams } from '../../googleDrive';
import type {
  FileContent,
  FSNodeStat,
  IFileSystemProvider,
  WriteOptions,
} from '../../virtualFileSystem';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsError,
} from '../../virtualFileSystem';
import { dayjs } from '../../dayjs';
import type { GDriveFileMeta } from '@shared/lib/googleDrive/api';
import {
  create,
  download,
  getGFileMetaList,
  SPACE,
  update,
  upload,
} from '@shared/lib/googleDrive/api';

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

export const googleDriveFileSystemProvider = (
  // TODO: вместо параметров auth получаем методы для запроса токена и userInfo
  auth: GoogleAuthParams,
  options: GoogleDriveFsOptions = {},
) => {
  const { mount = GoogleDriveMount.MyDrive, onError } = options;

  let { rootId = 'root' } = options;

  let space = SPACE.drive;

  switch (mount) {
    case GoogleDriveMount.AppData:
      space = SPACE.appDataFolder;
      rootId = 'appDataFolder';
      break;

    case GoogleDriveMount.SharedWithMe:
      space = SPACE.drive;
      rootId = SHARED_WITH_ME_ID;
      break;

    case GoogleDriveMount.SpecificFolder:
      space = SPACE.drive;
      if (!rootId) {
        throw new Error('rootId is required when mount mode is SpecificFolder');
      }
      rootId = rootId;
      break;

    case GoogleDriveMount.MyDrive:
    default:
      space = SPACE.drive;
      rootId = 'root';
      break;
  }

  /**
   * Resolves a VFS path to a Google Drive file/folder ID.
   */
  const resolvePath = async (path: string): Promise<GDriveFileMeta> => {
    const normalized = PathUtils.normalize(path);

    // Корневая директория
    if (normalized === '/') {
      let rootName = 'root';
      if (rootId === SHARED_WITH_ME_ID) rootName = 'Shared with me';
      else if (rootId === 'appDataFolder') rootName = 'App Data';

      return {
        id: rootId,
        name: rootName,
        mimeType: GOOGLE_MIME_FOLDER,
        modifiedTime: dayjs().toISOString(),
      };
    }

    const parts = normalized.split('/').filter((p) => p.length > 0);
    let currentId = rootId;
    let currentEntry: GDriveFileMeta | undefined;

    // Используем .entries() для безопасного доступа к индексу и значению
    for (const [index, partName] of parts.entries()) {
      const isLast = index === parts.length - 1;

      // Формируем запрос
      let query = '';
      if (currentId === SHARED_WITH_ME_ID) {
        // Если мы в виртуальном корне "Shared with me", ищем файлы с флагом sharedWithMe
        query = `name = '${partName.replace(/'/g, "\\'")}' and sharedWithMe = true and trashed = false`;
      } else {
        // Обычный поиск в папке
        query = `name = '${partName.replace(/'/g, "\\'")}' and '${currentId}' in parents and trashed = false`;
      }

      const result = await getGFileMetaList(auth, {
        q: query,
        pageSize: 1,
        spaces: [space],
      }).catch((e) => {
        onError?.(e);
        throw e;
      });

      const file = result.files?.at(0);

      if (!file) {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `Entry not found: ${partName} in path ${path}`,
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
        `Path not found: ${path}`,
      );
    }

    return currentEntry;
  };

  /**
   * Gets file or directory statistics.
   */
  const stat = async (path: string): Promise<FSNodeStat> => {
    try {
      if (path === '/' || path === '') {
        return {
          type: FSNodeType.Directory,
          canDelete: false,
        };
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

    try {
      return await download(auth, entry.id);
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

      await upload(auth, existingEntry.id, content);
    } else {
      if (!options.create) {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `File not found: ${path}`,
        );
      }

      const created = await create(auth, {
        name: fileName,
        parents: [parentEntry.id],
      });

      try {
        await upload(auth, created.result.id, content);
      } catch (uploadError) {
        onError?.(uploadError);
        await update(auth, created.result.id, {
          trashed: true,
        });
        throw uploadError;
      }
    }
  };

  /**
   * Reads the contents of a directory.
   */
  const readDirectory = async (
    path: string,
  ): Promise<[string, FSNodeStat][]> => {
    const entry = await resolvePath(path);

    if (entry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Not a directory: ${path}`,
      );
    }

    // Construct query for list
    let query: string;
    if (entry.id === SHARED_WITH_ME_ID) {
      query = 'sharedWithMe = true and trashed = false';
    } else {
      query = `'${entry.id}' in parents and trashed = false`;
    }

    const result = await getGFileMetaList(auth, {
      q: query,
      pageSize: 1000,
      spaces: [space],
      fetchAll: true, // Ensure getting all files through pagination
    }).catch((e) => {
      onError?.(e);
      throw e;
    });

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

    await create(auth, {
      name: dirName,
      parents: [parentEntry.id],
      mimeType: GOOGLE_MIME_FOLDER,
    }).catch((e) => {
      onError?.(e);
      throw e;
    });
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
      // For empty check we use the same query logic
      let query: string;
      if (entry.id === SHARED_WITH_ME_ID) {
        // Deleting the sharedWithMe root itself is impossible, we only get here due to logic error
        query = 'sharedWithMe = true and trashed = false';
      } else {
        query = `'${entry.id}' in parents and trashed = false`;
      }

      const result = await getGFileMetaList(auth, {
        q: query,
        pageSize: 1,
        spaces: [space],
      }).catch((e) => {
        onError?.(e);
        throw e;
      });

      // Safe array length check
      if (result.files && result.files.length > 0) {
        throw new VfsError(
          FileSystemError.DirectoryNotEmpty,
          'Directory not empty (use recursive=true)',
        );
      }
    }

    await update(auth, entry.id, {
      trashed: true,
    }).catch((e) => {
      onError?.(e);
      throw e;
    });
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

    await update(auth, sourceEntry.id, {
      name: newFileName,
      addParents:
        removeParents.length === currentParents.length
          ? [destinationParentEntry.id]
          : undefined,
      removeParents: removeParents.length > 0 ? removeParents : undefined,
    }).catch((e) => {
      onError?.(e);
      throw e;
    });
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
