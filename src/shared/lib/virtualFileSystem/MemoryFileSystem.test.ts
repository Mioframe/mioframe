import { beforeEach, describe, expect, it } from 'vitest';
import { FSNodeType } from './IFileSystemProvider';
import { MemoryFileSystem } from './MemoryFileSystem';
import { FileSystemError, VfsError } from './VfsError';

describe('MemoryFileSystem', () => {
  let memoryFS: MemoryFileSystem;

  beforeEach(() => {
    memoryFS = new MemoryFileSystem();
  });

  it('reports stable root capabilities', async () => {
    await expect(memoryFS.stat('/')).resolves.toMatchObject({
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: true,
      },
    });
  });

  it('reads only direct children from a directory', async () => {
    await memoryFS.createDirectory('/docs');
    await memoryFS.createDirectory('/docs/nested');
    await memoryFS.writeFile('/docs/readme.txt', 'hello', {
      create: true,
      overwrite: true,
    });
    await memoryFS.writeFile('/docs/nested/secret.txt', 'hidden', {
      create: true,
      overwrite: true,
    });

    const entries = await memoryFS.readDirectory('/docs');

    expect(entries).toHaveLength(2);
    expect(entries).toEqual(
      expect.arrayContaining([
        [
          'nested',
          expect.objectContaining({
            type: FSNodeType.Directory,
          }),
        ],
        [
          'readme.txt',
          expect.objectContaining({
            type: FSNodeType.File,
            size: 5,
          }),
        ],
      ]),
    );
  });

  it('normalizes readDirectory paths', async () => {
    await memoryFS.createDirectory('/docs');

    await expect(memoryFS.readDirectory('/docs/')).resolves.toEqual([]);
  });

  it('creates files from strings, blobs, and array buffers', async () => {
    const blob = new Blob(['blob-content'], { type: 'text/plain' });
    const buffer = new TextEncoder().encode('buffer-content').buffer;

    await memoryFS.writeFile('/string.txt', 'string-content', {
      create: true,
      overwrite: true,
    });
    await memoryFS.writeFile('/blob.txt', blob, {
      create: true,
      overwrite: true,
    });
    await memoryFS.writeFile('/buffer.txt', buffer, {
      create: true,
      overwrite: true,
    });

    await expect(memoryFS.readFile('/string.txt').then((file) => file.text())).resolves.toBe(
      'string-content',
    );
    await expect(memoryFS.readFile('/blob.txt').then((file) => file.text())).resolves.toBe(
      'blob-content',
    );
    await expect(memoryFS.readFile('/buffer.txt').then((file) => file.text())).resolves.toBe(
      'buffer-content',
    );
  });

  it('returns written file stat from writeFile', async () => {
    const result = await memoryFS.writeFile('/notes.txt', 'draft', {
      create: true,
      overwrite: true,
    });

    expect(result.stat).toEqual(await memoryFS.stat('/notes.txt'));
  });

  it('updates file contents and modification time when overwriting an existing file', async () => {
    await memoryFS.writeFile('/notes.txt', 'draft', {
      create: true,
      overwrite: true,
    });
    const initialStat = await memoryFS.stat('/notes.txt');

    await new Promise((resolve) => setTimeout(resolve, 2));
    await memoryFS.writeFile('/notes.txt', 'published', {
      create: false,
      overwrite: true,
    });

    const nextStat = await memoryFS.stat('/notes.txt');

    expect(await memoryFS.readFile('/notes.txt').then((file) => file.text())).toBe('published');
    expect(nextStat.modificationTime).toBeGreaterThan(initialStat.modificationTime ?? 0);
  });

  it('rejects writes when create or overwrite flags disallow them', async () => {
    await memoryFS.writeFile('/notes.txt', 'draft', {
      create: true,
      overwrite: true,
    });

    await expect(
      memoryFS.writeFile('/notes.txt', 'published', {
        create: false,
        overwrite: false,
      }),
    ).rejects.toMatchObject({
      code: FileSystemError.FileExists,
    });

    await expect(
      memoryFS.writeFile('/missing.txt', 'draft', {
        create: false,
        overwrite: true,
      }),
    ).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
  });

  it('rejects directory creation when the parent path is missing or not a directory', async () => {
    await expect(memoryFS.createDirectory('/missing/child')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });

    await memoryFS.writeFile('/file.txt', 'content', {
      create: true,
      overwrite: true,
    });

    await expect(memoryFS.createDirectory('/file.txt/child')).rejects.toMatchObject({
      code: FileSystemError.FileNotADirectory,
    });
  });

  it('deletes recursive directory trees and keeps unrelated paths intact', async () => {
    await memoryFS.createDirectory('/docs');
    await memoryFS.createDirectory('/docs/nested');
    await memoryFS.writeFile('/docs/nested/file.txt', 'content', {
      create: true,
      overwrite: true,
    });
    await memoryFS.writeFile('/keep.txt', 'safe', {
      create: true,
      overwrite: true,
    });

    await memoryFS.delete('/docs', true);

    await expect(memoryFS.stat('/docs')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
    await expect(memoryFS.readFile('/keep.txt').then((file) => file.text())).resolves.toBe('safe');
  });

  it('rejects deletion of non-empty directories without recursive mode', async () => {
    await memoryFS.createDirectory('/docs');
    await memoryFS.writeFile('/docs/file.txt', 'content', {
      create: true,
      overwrite: true,
    });

    await expect(memoryFS.delete('/docs', false)).rejects.toMatchObject({
      code: FileSystemError.DirectoryNotEmpty,
    });
  });

  it('rejects deletion of the root directory', async () => {
    await expect(memoryFS.delete('/', true)).rejects.toMatchObject({
      code: FileSystemError.NoPermissions,
    });
  });

  it('moves directories with descendants and preserves file contents', async () => {
    await memoryFS.createDirectory('/docs');
    await memoryFS.createDirectory('/docs/nested');
    await memoryFS.writeFile('/docs/nested/file.txt', 'content', {
      create: true,
      overwrite: true,
    });

    await memoryFS.move('/docs', '/archive');

    await expect(memoryFS.stat('/docs')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });
    await expect(
      memoryFS.readFile('/archive/nested/file.txt').then((file) => file.text()),
    ).resolves.toBe('content');
  });

  it('rejects moves into an existing target, missing parent, or own subtree', async () => {
    await memoryFS.writeFile('/source.txt', 'source', {
      create: true,
      overwrite: true,
    });
    await memoryFS.writeFile('/target.txt', 'target', {
      create: true,
      overwrite: true,
    });

    await expect(memoryFS.move('/source.txt', '/target.txt')).rejects.toMatchObject({
      code: FileSystemError.FileExists,
    });

    await expect(memoryFS.move('/source.txt', '/missing/source.txt')).rejects.toMatchObject({
      code: FileSystemError.FileNotFound,
    });

    await memoryFS.createDirectory('/folder');

    await expect(memoryFS.move('/folder', '/folder/nested')).rejects.toMatchObject({
      code: FileSystemError.NotSupported,
    });
  });

  it('rejects deletion of non-empty directories with a typed VfsError and DirectoryNotEmpty code', async () => {
    await memoryFS.createDirectory('/projects');
    await memoryFS.writeFile('/projects/readme.md', 'hello', { create: true, overwrite: true });

    await expect(memoryFS.delete('/projects', false)).rejects.toMatchObject({
      code: FileSystemError.DirectoryNotEmpty,
      name: 'VfsError',
    });
  });

  it('VfsError messages do not contain raw path or name values', async () => {
    const rawPath = '/secret/path/to/document';
    const rawName = 'confidential-document-name';

    await memoryFS.createDirectory('/data');
    await memoryFS.writeFile('/data/file.txt', 'content', { create: true, overwrite: true });

    const errors: VfsError[] = [];

    // stat on missing entry
    await memoryFS.stat(rawPath).catch((e: unknown) => {
      if (e instanceof VfsError) errors.push(e);
    });

    // readDirectory on a file
    await memoryFS.readDirectory('/data/file.txt').catch((e: unknown) => {
      if (e instanceof VfsError) errors.push(e);
    });

    // createDirectory with missing parent
    await memoryFS.createDirectory(`/missing/${rawName}`).catch((e: unknown) => {
      if (e instanceof VfsError) errors.push(e);
    });

    // delete non-empty
    await memoryFS.createDirectory('/nonempty');
    await memoryFS.writeFile(`/nonempty/${rawName}`, 'x', { create: true, overwrite: true });
    await memoryFS.delete('/nonempty', false).catch((e: unknown) => {
      if (e instanceof VfsError) errors.push(e);
    });

    // move to missing parent
    await memoryFS.move('/data', `/missing/${rawPath}/dest`).catch((e: unknown) => {
      if (e instanceof VfsError) errors.push(e);
    });

    expect(errors.length).toBeGreaterThan(0);

    for (const error of errors) {
      expect(error.message).not.toContain(rawPath);
      expect(error.message).not.toContain(rawName);
      expect(error.message).not.toContain('/secret');
      expect(error.message).not.toContain('confidential');
    }
  });

  it('VfsError instances have stable FileSystemError codes', async () => {
    await memoryFS.createDirectory('/dir');
    await memoryFS.writeFile('/dir/file.txt', 'x', { create: true, overwrite: true });

    const cases: Array<[Promise<unknown>, FileSystemError]> = [
      [memoryFS.stat('/missing'), FileSystemError.FileNotFound],
      [memoryFS.readDirectory('/dir/file.txt'), FileSystemError.FileNotADirectory],
      [
        memoryFS.writeFile('/dir/file.txt', 'y', { create: false, overwrite: false }),
        FileSystemError.FileExists,
      ],
      [
        memoryFS.writeFile('/missing/file.txt', 'y', { create: false, overwrite: true }),
        FileSystemError.FileNotFound,
      ],
      [memoryFS.delete('/dir', false), FileSystemError.DirectoryNotEmpty],
      [memoryFS.delete('/', true), FileSystemError.NoPermissions],
    ];

    for (const [promise, expectedCode] of cases) {
      // eslint-disable-next-line no-await-in-loop -- sequential to get distinct error per case
      await expect(promise).rejects.toMatchObject({ code: expectedCode });
    }
  });

  it('treats a move to the same normalized path as a no-op', async () => {
    await memoryFS.writeFile('/same.txt', 'content', {
      create: true,
      overwrite: true,
    });

    await memoryFS.move('/same.txt', '/same.txt/');

    await expect(memoryFS.readFile('/same.txt').then((file) => file.text())).resolves.toBe(
      'content',
    );
  });
});
