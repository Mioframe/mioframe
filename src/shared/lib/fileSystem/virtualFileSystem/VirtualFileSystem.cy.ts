/// <reference types="cypress" />

import { VirtualFileSystem } from './VirtualFileSystem';
import { MemoryFileSystem } from './MemoryFileSystem';
import { FileType } from './IFileSystemProvider';
import { VfsError, FileSystemError } from './VfsError';
import { LockManager } from './LockManager';

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

  // --- Основные операции (существующие тесты) ---
  it('должен разрешать пути через точку монтирования', async () => {
    // FIX: Добавлен await к асинхронному вызову
    await memFs.createDirectory('/data');
    await vfs.writeFile('/mnt/data/file.txt', 'direct write');

    const content = await vfs.readText('/mnt/data/file.txt');
    expect(content).to.eq('direct write');
  });

  it('должен писать через VFS и данные должны появляться в провайдере', async () => {
    await vfs.createDirectory('/mnt/logs');
    await vfs.writeFile('/mnt/logs/app.log', 'Log entry');
    const stats = await memFs.stat('/logs/app.log');
    expect(stats.type).to.eq(FileType.File);
  });

  it('должен читать бинарные данные (Uint8Array) корректно', async () => {
    const binaryData = new Uint8Array([0, 1, 2, 255]);
    await vfs.writeFile('/mnt/binary.bin', binaryData);
    const readData = await vfs.readFile('/mnt/binary.bin');
    expect(readData).to.be.instanceOf(File);
    expect(readData[3]).to.eq(255);
  });

  it('должен корректно читать список файлов в директории', async () => {
    await vfs.createDirectory('/mnt/folder');
    await vfs.writeFile('/mnt/folder/file1.txt', '1');
    await vfs.createDirectory('/mnt/folder/subfolder');
    const entries = await vfs.readDirectory('/mnt/folder');
    expect(entries).to.have.length(2);
    expect(entries.find((e) => e[0] === 'file1.txt')?.[1]).to.eq(FileType.File);
  });

  it('должен перезаписывать существующий файл', async () => {
    await vfs.writeFile('/mnt/config.json', 'v1');
    await vfs.writeFile('/mnt/config.json', 'v2');
    const content = await vfs.readText('/mnt/config.json');
    expect(content).to.eq('v2');
  });

  it('должен удалять файлы через VFS', async () => {
    await vfs.writeFile('/mnt/del.txt', 'content');
    await vfs.delete('/mnt/del.txt');
    try {
      await vfs.stat('/mnt/del.txt');
      throw new Error('Fail');
    } catch (e: unknown) {
      if (e instanceof VfsError)
        expect(e.code).to.eq(FileSystemError.FileNotFound);
    }
  });

  it('должен поддерживать рекурсивное удаление', async () => {
    await vfs.createDirectory('/mnt/deep/lvl2');
    await vfs.delete('/mnt/deep', true);
    try {
      await vfs.stat('/mnt/deep');
      throw new Error('Fail');
    } catch (e: unknown) {
      if (e instanceof VfsError)
        expect(e.code).to.eq(FileSystemError.FileNotFound);
    }
  });

  it('должен переименовывать внутри одного провайдера', async () => {
    await vfs.writeFile('/mnt/a.txt', 'A');
    await vfs.rename('/mnt/a.txt', '/mnt/b.txt');
    const content = await vfs.readText('/mnt/b.txt');
    expect(content).to.eq('A');

    try {
      await vfs.stat('/mnt/a.txt');
      throw new Error('Old file should be gone');
    } catch (e: unknown) {
      if (e instanceof VfsError)
        expect(e.code).to.eq(FileSystemError.FileNotFound);
    }
  });

  // --- Cross-Provider Move (НОВЫЕ ТЕСТЫ) ---

  describe('Cross-Provider Move', () => {
    let fs1: MemoryFileSystem;
    let fs2: MemoryFileSystem;

    beforeEach(() => {
      fs1 = new MemoryFileSystem();
      fs2 = new MemoryFileSystem();
      vfs.mount('/disk1', fs1);
      vfs.mount('/disk2', fs2);
    });

    it('должен перемещать файл между провайдерами (Copy+Delete)', async () => {
      await vfs.writeFile('/disk1/source.txt', 'Hello World');

      // Перемещаем с диска 1 на диск 2
      await vfs.rename('/disk1/source.txt', '/disk2/dest.txt');

      // Проверяем назначение
      const content = await vfs.readText('/disk2/dest.txt');
      expect(content).to.eq('Hello World');

      // Проверяем, что источник удален
      try {
        await vfs.stat('/disk1/source.txt');
        throw new Error('Source file should be deleted');
      } catch (e: unknown) {
        if (e instanceof VfsError)
          expect(e.code).to.eq(FileSystemError.FileNotFound);
      }
    });

    it('должен рекурсивно перемещать директории между провайдерами', async () => {
      // Структура: /disk1/folder/sub/file.txt
      await vfs.createDirectory('/disk1/folder');
      await vfs.createDirectory('/disk1/folder/sub');
      await vfs.writeFile('/disk1/folder/sub/file.txt', 'Deep Data');
      await vfs.writeFile('/disk1/folder/root.txt', 'Root Data');

      // Перемещаем всю папку folder на disk2 -> /disk2/moved_folder
      await vfs.rename('/disk1/folder', '/disk2/moved_folder');

      // Проверяем структуру на новом месте
      expect(await vfs.exists('/disk2/moved_folder')).to.eq(true);
      expect(await vfs.exists('/disk2/moved_folder/sub')).to.eq(true);
      expect(await vfs.readText('/disk2/moved_folder/sub/file.txt')).to.eq(
        'Deep Data',
      );
      expect(await vfs.readText('/disk2/moved_folder/root.txt')).to.eq(
        'Root Data',
      );

      // Проверяем, что старая папка полностью удалена
      expect(await vfs.exists('/disk1/folder')).to.eq(false);
    });

    it('должен перезаписывать файл назначения при перемещении (Overwrite)', async () => {
      await vfs.writeFile('/disk1/new.txt', 'New Content');
      await vfs.writeFile('/disk2/target.txt', 'Old Content');

      await vfs.rename('/disk1/new.txt', '/disk2/target.txt');

      expect(await vfs.readText('/disk2/target.txt')).to.eq('New Content');
      expect(await vfs.exists('/disk1/new.txt')).to.eq(false);
    });
  });

  // --- Edge Cases & Locking (существующие тесты) ---

  it('должен выдерживать конкурентную запись', async () => {
    const files = ['/mnt/1', '/mnt/2', '/mnt/3'];
    await Promise.all(files.map((f) => vfs.writeFile(f, 'd')));
    for (const f of files) expect(await vfs.exists(f)).to.eq(true);
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
