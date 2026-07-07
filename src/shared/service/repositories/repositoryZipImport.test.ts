import { describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { packZipArchive, ZipArchiveErrorCode } from '@shared/lib/zipArchive';
import { RepositoryZipErrorCode } from './repositoryZipContracts';
import { importDirectoryZip } from './repositoryZipImport';

const createVfs = () => {
  const memoryFS = new MemoryFileSystem();
  const vfs = new VirtualFileSystem();
  vfs.mount('/', memoryFS);
  return vfs;
};

describe('importDirectoryZip', () => {
  it('writes files and creates nested directories, including empty-directory markers', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveBytes = packZipArchive({
      'root/file.txt': new TextEncoder().encode('hello'),
      'root/nested/deep.txt': new TextEncoder().encode('deep'),
      'root/empty/': new Uint8Array(0),
    });

    const onProgress = vi.fn();
    await importDirectoryZip(vfs, '/target', archiveBytes, onProgress);

    await expect(vfs.readText('/target/root/file.txt')).resolves.toBe('hello');
    await expect(vfs.readText('/target/root/nested/deep.txt')).resolves.toBe('deep');
    await expect(vfs.exists('/target/root/empty')).resolves.toBe(true);
    expect(onProgress).toHaveBeenCalledWith({ phase: 'validatingArchive' });
    expect(onProgress).toHaveBeenCalledWith({ phase: 'checkingConflicts' });
    expect(onProgress).toHaveBeenCalledWith({ phase: 'unpacking' });
  });

  it('stops before writing anything when a target file already exists', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    await vfs.createDirectory('/target/root');
    await vfs.writeFile('/target/root/file.txt', 'already here');

    const archiveBytes = packZipArchive({
      'root/file.txt': new TextEncoder().encode('new content'),
      'root/other.txt': new TextEncoder().encode('other content'),
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveBytes);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importConflict });
    await expect(vfs.readText('/target/root/file.txt')).resolves.toBe('already here');
    await expect(vfs.exists('/target/root/other.txt')).resolves.toBe(false);
  });

  it('rejects an archive containing an unsafe entry path before any write', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveBytes = packZipArchive({
      '../escape.txt': new TextEncoder().encode('should not be written'),
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveBytes);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.unsafeEntryPath });
  });

  it('rejects a damaged archive', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', new TextEncoder().encode('not a zip'));
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.archiveDamaged });
  });
});
