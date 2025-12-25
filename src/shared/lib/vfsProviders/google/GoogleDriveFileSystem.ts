import type { GoogleAuthParams } from '@shared/lib/googleDrive';
import { simplifiedGoogleDriveAPI, SPACE } from '@shared/lib/googleDrive';
import type {
  FileContent,
  FileStat,
  IFileSystemProvider,
  VfsEvent,
  WriteOptions,
} from '../../virtualFileSystem';
import {
  EventEmitter,
  FileSystemError,
  FileType,
  PathUtils,
  VfsError,
} from '../../virtualFileSystem';

const GOOGLE_MIME_FOLDER = 'application/vnd.google-apps.folder';
/** Внутренний идентификатор для виртуальной папки Shared With Me */
const SHARED_WITH_ME_ID = 'sharedWithMe';

interface DriveEntry {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  parents?: string[];
}

/** Режим монтирования файловой системы Google Drive */
export enum GoogleDriveMount {
  /** Корневая папка "Мой диск" (стандартный режим) */
  MyDrive = 'myDrive',
  /** Раздел "Доступные мне" (виртуальная папка с расшаренными файлами) */
  SharedWithMe = 'sharedWithMe',
  /** Папка данных приложения (скрытая папка appDataFolder) */
  AppData = 'appData',
  /** Монтирование конкретной папки по её ID */
  SpecificFolder = 'specificFolder',
}

export interface GoogleDriveFsOptions {
  /**
   * Режим монтирования.
   * По умолчанию: GoogleDriveMount.MyDrive
   */
  mount?: GoogleDriveMount;

  /**
   * ID папки для монтирования.
   * Игнорируется, если mount не равен GoogleDriveMount.SpecificFolder.
   */
  rootId?: string;
}

export class GoogleDriveFileSystem implements IFileSystemProvider {
  private events = new EventEmitter();
  private readonly space: SPACE;
  private readonly rootId: string;

  constructor(
    private auth: GoogleAuthParams,
    options: GoogleDriveFsOptions = {},
  ) {
    const mount = options.mount || GoogleDriveMount.MyDrive;

    switch (mount) {
      case GoogleDriveMount.AppData:
        this.space = SPACE.appDataFolder;
        this.rootId = 'appDataFolder';
        break;

      case GoogleDriveMount.SharedWithMe:
        this.space = SPACE.drive;
        this.rootId = SHARED_WITH_ME_ID;
        break;

      case GoogleDriveMount.SpecificFolder:
        this.space = SPACE.drive;
        if (!options.rootId) {
          throw new Error(
            'rootId is required when mount mode is SpecificFolder',
          );
        }
        this.rootId = options.rootId;
        break;

      case GoogleDriveMount.MyDrive:
      default:
        this.space = SPACE.drive;
        this.rootId = 'root';
        break;
    }
  }

  /**
   * Разрешает путь VFS в ID файла/папки Google Drive.
   */
  private async resolvePath(path: string): Promise<DriveEntry> {
    const normalized = PathUtils.normalize(path);

    // Корневая директория
    if (normalized === '/') {
      let rootName = 'root';
      if (this.rootId === SHARED_WITH_ME_ID) rootName = 'Shared with me';
      else if (this.rootId === 'appDataFolder') rootName = 'App Data';

      return {
        id: this.rootId,
        name: rootName,
        mimeType: GOOGLE_MIME_FOLDER,
        parents: [],
      };
    }

    const parts = normalized.split('/').filter((p) => p.length > 0);
    let currentId = this.rootId;
    let currentEntry: DriveEntry | undefined;

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

      const { result } = await simplifiedGoogleDriveAPI.list(this.auth, {
        q: query,
        pageSize: 1,
        spaces: [this.space],
      });

      // Безопасный доступ к первому элементу массива с проверкой
      const file = result.files?.[0];

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
  }

  public async stat(path: string): Promise<FileStat> {
    try {
      if (path === '/' || path === '') {
        return {
          type: FileType.Directory,
          size: 0,
          creationTime: Date.now(),
          modificationTime: Date.now(),
        };
      }

      const entry = await this.resolvePath(path);
      const isDir = entry.mimeType === GOOGLE_MIME_FOLDER;

      // Безопасное преобразование типов для size (может прийти undefined)
      const size = entry.size ? parseInt(entry.size, 10) : 0;

      // Безопасное преобразование дат
      const creationTime = entry.createdTime
        ? new Date(entry.createdTime).getTime()
        : Date.now();
      const modificationTime = entry.modifiedTime
        ? new Date(entry.modifiedTime).getTime()
        : Date.now();

      return {
        type: isDir ? FileType.Directory : FileType.File,
        size: isNaN(size) ? 0 : size, // Дополнительная защита от NaN
        creationTime,
        modificationTime,
      };
    } catch (e) {
      if (e instanceof VfsError) throw e;
      throw new VfsError(
        FileSystemError.FileNotFound,
        `Stat failed for ${path}`,
      );
    }
  }

  public async readFile(path: string): Promise<File> {
    const entry = await this.resolvePath(path);

    if (entry.mimeType === GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileIsADirectory,
        `Cannot read directory: ${path}`,
      );
    }

    try {
      return await simplifiedGoogleDriveAPI.download(
        this.auth,
        entry.id,
        entry.name,
      );
    } catch {
      throw new VfsError(
        FileSystemError.Unknown,
        `Failed to download file: ${path}`,
      );
    }
  }

  public async writeFile(
    path: string,
    content: FileContent,
    options: WriteOptions,
  ): Promise<void> {
    const parentPath = PathUtils.dirname(path);
    const fileName = PathUtils.basename(path);

    // 1. Проверяем существование файла
    let existingEntry: DriveEntry | null = null;
    try {
      existingEntry = await this.resolvePath(path);
    } catch (e) {
      if (!(e instanceof VfsError && e.code === FileSystemError.FileNotFound)) {
        throw e;
      }
    }

    if (existingEntry) {
      // Обновление существующего файла
      if (!options.overwrite) {
        throw new VfsError(FileSystemError.FileExists, `File exists: ${path}`);
      }
      if (existingEntry.mimeType === GOOGLE_MIME_FOLDER) {
        throw new VfsError(
          FileSystemError.FileIsADirectory,
          `Cannot overwrite directory with file: ${path}`,
        );
      }

      await simplifiedGoogleDriveAPI.upload(
        this.auth,
        existingEntry.id,
        content,
      );
      this.events.emit({ type: 'update', path });
    } else {
      // Создание нового файла
      if (!options.create) {
        throw new VfsError(
          FileSystemError.FileNotFound,
          `File not found: ${path}`,
        );
      }

      const parentEntry = await this.resolvePath(parentPath);

      // Запрещаем создание файлов прямо в корне "Shared with me",
      // так как технически у них должен быть владелец и родительская папка.
      if (parentEntry.id === SHARED_WITH_ME_ID) {
        throw new VfsError(
          FileSystemError.NoPermissions,
          `Cannot create files directly in 'Shared with me' root. Create them in a specific folder.`,
        );
      }

      if (parentEntry.mimeType !== GOOGLE_MIME_FOLDER) {
        throw new VfsError(
          FileSystemError.FileNotADirectory,
          `Parent is not a directory: ${parentPath}`,
        );
      }

      const { result: newFile } = await simplifiedGoogleDriveAPI.create(
        this.auth,
        {
          name: fileName,
          parents: [parentEntry.id],
        },
      );

      await simplifiedGoogleDriveAPI.upload(this.auth, newFile.id, content);
      this.events.emit({ type: 'create', path });
    }
  }

  public async readDirectory(path: string): Promise<[string, FileType][]> {
    const entry = await this.resolvePath(path);

    if (entry.mimeType !== GOOGLE_MIME_FOLDER) {
      throw new VfsError(
        FileSystemError.FileNotADirectory,
        `Not a directory: ${path}`,
      );
    }

    // Формируем запрос для list
    let query: string;
    if (entry.id === SHARED_WITH_ME_ID) {
      query = 'sharedWithMe = true and trashed = false';
    } else {
      query = `'${entry.id}' in parents and trashed = false`;
    }

    const { result } = await simplifiedGoogleDriveAPI.list(this.auth, {
      q: query,
      pageSize: 1000,
      spaces: [this.space],
      fetchAll: true, // Гарантируем получение всех файлов через пагинацию
    });

    const entries: [string, FileType][] = [];

    if (result.files) {
      for (const file of result.files) {
        entries.push([
          file.name,
          file.mimeType === GOOGLE_MIME_FOLDER
            ? FileType.Directory
            : FileType.File,
        ]);
      }
    }

    return entries;
  }

  public async createDirectory(path: string): Promise<void> {
    try {
      await this.resolvePath(path);
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

    const parentEntry = await this.resolvePath(parentPath);

    // Запрещаем создание папок в корне Shared with me
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

    await simplifiedGoogleDriveAPI.create(this.auth, {
      name: dirName,
      parents: [parentEntry.id],
      mimeType: GOOGLE_MIME_FOLDER,
    });

    this.events.emit({ type: 'create', path });
  }

  public async delete(path: string, recursive: boolean): Promise<void> {
    if (path === '/') throw new Error('Cannot delete root');

    const entry = await this.resolvePath(path);

    if (!recursive && entry.mimeType === GOOGLE_MIME_FOLDER) {
      // Для проверки пустоты используем ту же логику запроса
      let query: string;
      if (entry.id === SHARED_WITH_ME_ID) {
        // Удаление самого корня sharedWithMe невозможно, попадаем сюда только при ошибке логики
        query = 'sharedWithMe = true and trashed = false';
      } else {
        query = `'${entry.id}' in parents and trashed = false`;
      }

      const { result } = await simplifiedGoogleDriveAPI.list(this.auth, {
        q: query,
        pageSize: 1,
        spaces: [this.space],
      });
      // Безопасная проверка длины массива
      if (result.files && result.files.length > 0) {
        throw new Error('Directory not empty (use recursive=true)');
      }
    }

    await simplifiedGoogleDriveAPI.update(this.auth, entry.id, {
      trashed: true,
    });
    this.events.emit({ type: 'delete', path });
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    const normalizedOld = PathUtils.normalize(oldPath);
    const normalizedNew = PathUtils.normalize(newPath);

    if (normalizedOld === normalizedNew) return;

    const sourceEntry = await this.resolvePath(normalizedOld);

    try {
      await this.resolvePath(normalizedNew);
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

    const destinationParentEntry = await this.resolvePath(newDirName);

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

    const removeParents = sourceEntry.parents ? sourceEntry.parents : [];

    await simplifiedGoogleDriveAPI.update(this.auth, sourceEntry.id, {
      name: newFileName,
      addParents: [destinationParentEntry.id],
      removeParents,
    });

    this.events.emit({
      type: 'rename',
      path: normalizedOld,
      newPath: normalizedNew,
    });
  }

  public watch(callback: (event: VfsEvent) => void): () => void {
    return this.events.subscribe(callback);
  }
}

// fixme: при записи файла не создавать новые, обновлять существующий с тем же именем.
