/// <reference types="cypress" />

import { VirtualFileSystem } from './VirtualFileSystem';
import { MemoryFileSystem } from './MemoryFileSystem';
import { VfsError, FileSystemError } from './VfsError';
import { LockManager } from './LockManager';
import { FileType } from './IFileSystemProvider';

describe('VirtualFileSystem (Интеграция)', () => {
  let vfs: VirtualFileSystem;
  let memFs: MemoryFileSystem;
  let lockManager: LockManager;

  beforeEach(() => {
    lockManager = new LockManager();
    memFs = new MemoryFileSystem();
    vfs = new VirtualFileSystem(lockManager);

    vfs.mount('/mnt', memFs);
  });

  it('должен разрешать пути через точку монтирования', async () => {
    await memFs.createDirectory('/data');
    await vfs.writeFile('/mnt/data/file.txt', 'direct write');

    const content = await vfs.readText('/mnt/data/file.txt');
    expect(content).to.eq('direct write');
  });

  it('должен корректно читать список файлов в директории', async () => {
    await vfs.createDirectory('/mnt/folder');
    await vfs.writeFile('/mnt/folder/file1.txt', '1');
    await vfs.createDirectory('/mnt/folder/subfolder');
    const entries = await vfs.readDirectory('/mnt/folder');
    expect(entries).to.have.length(2);
    expect(entries.find((e) => e[0] === 'file1.txt')?.[1]).to.eq(FileType.File);
  });

  it('должен переименовывать файл', async () => {
    await vfs.writeFile('/mnt/a.txt', 'A');
    await vfs.rename('/mnt/a.txt', '/mnt/b.txt');
    const content = await vfs.readText('/mnt/b.txt');
    expect(content).to.eq('A');
    expect(await vfs.exists('/mnt/a.txt')).to.eq(false);
  });

  // --- Критический тест для исправленного бага ---
  it('должен корректно переименовывать саму директорию (а не только содержимое)', async () => {
    // Создаем /mnt/A/file.txt
    await vfs.createDirectory('/mnt/A');
    await vfs.writeFile('/mnt/A/file.txt', 'content');

    // Переименовываем /mnt/A -> /mnt/B
    await vfs.rename('/mnt/A', '/mnt/B');

    // Проверяем содержимое
    expect(await vfs.exists('/mnt/B/file.txt')).to.eq(true);
    expect(await vfs.readText('/mnt/B/file.txt')).to.eq('content');

    // Проверяем, что старая папка исчезла, а новая существует как папка
    expect(await vfs.exists('/mnt/A')).to.eq(false);

    const stats = await vfs.stat('/mnt/B');
    expect(stats.type).to.eq(FileType.Directory);
  });

  it('должен запрещать переименование в несуществующий путь (orphaned node)', async () => {
    await vfs.createDirectory('/mnt/src');
    try {
      // /mnt/ghost не существует, поэтому /mnt/ghost/dest невозможно
      await vfs.rename('/mnt/src', '/mnt/ghost/dest');
      throw new Error('Should fail');
    } catch (e: unknown) {
      if (e instanceof VfsError) {
        expect(e.code).to.eq(FileSystemError.FileNotFound); // Parent not found
      } else {
        throw e;
      }
    }
  });

  // --- Cross-Provider Move ---
  describe('Cross-Provider Move', () => {
    let fs1: MemoryFileSystem;
    let fs2: MemoryFileSystem;

    beforeEach(() => {
      fs1 = new MemoryFileSystem();
      fs2 = new MemoryFileSystem();
      vfs.mount('/disk1', fs1);
      vfs.mount('/disk2', fs2);
    });

    it('должен перемещать файл между провайдерами', async () => {
      await vfs.writeFile('/disk1/source.txt', 'Hello World');
      await vfs.rename('/disk1/source.txt', '/disk2/dest.txt');

      expect(await vfs.readText('/disk2/dest.txt')).to.eq('Hello World');
      expect(await vfs.exists('/disk1/source.txt')).to.eq(false);
    });

    it('должен рекурсивно перемещать директории между провайдерами', async () => {
      await vfs.createDirectory('/disk1/folder');
      await vfs.createDirectory('/disk1/folder/sub');
      await vfs.writeFile('/disk1/folder/sub/file.txt', 'Deep Data');

      await vfs.rename('/disk1/folder', '/disk2/moved_folder');

      expect(await vfs.exists('/disk2/moved_folder/sub/file.txt')).to.eq(true);
      expect(await vfs.readText('/disk2/moved_folder/sub/file.txt')).to.eq(
        'Deep Data',
      );
      expect(await vfs.exists('/disk1/folder')).to.eq(false);
    });
  });

  it('должен предотвращать Race Conditions (Read-Modify-Write check)', async () => {
    const filePath = '/mnt/counter.txt';
    await vfs.writeFile(filePath, '0');
    let isWriting = false;

    const slowWrite = lockManager.request(filePath, async () => {
      isWriting = true;
      await new Promise((r) => setTimeout(r, 50));
      isWriting = false;
      await memFs.writeFile('/counter.txt', 'done', {
        create: true,
        overwrite: true,
      });
    });

    const checkLock = async () => {
      await vfs.readText(filePath);
      expect(isWriting).to.eq(false);
    };

    await Promise.all([slowWrite, checkLock()]);
    expect(await vfs.readText(filePath)).to.eq('done');
  });
});
