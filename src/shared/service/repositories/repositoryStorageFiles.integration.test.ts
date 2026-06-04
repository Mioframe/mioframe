import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import type { AMDocumentId } from '@shared/lib/automerge';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import type { IFileSystemProvider } from '@shared/lib/virtualFileSystem';
import { FSNodeType, VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import {
  cleanupDeletedDocumentStorageFiles,
  getDocumentStorageFiles,
} from './repositoryStorageFiles';

/**
 * Creates a mock provider that models Android browser-backed local directory behavior:
 * - readDirectory returns entries with only type (no capabilities)
 * - stat returns no capabilities (undefined)
 * - write/delete succeed at runtime despite unknown capabilities
 * - post-write metadata is minimal (no getFile call simulated by returning cheap stat)
 * @param memFs - In-memory backing store for the provider operations.
 * @returns VFS provider that behaves like a browser-backed local directory on Android.
 */
const createAndroidLikeProvider = (memFs: MemoryFileSystem): IFileSystemProvider => ({
  stat: async (path) => {
    const s = await memFs.stat(path);
    return { type: s.type };
  },
  readFile: (path) => memFs.readFile(path),
  writeFile: async (path, content, options) => {
    await memFs.writeFile(path, content, options);
    return { stat: { type: FSNodeType.File } };
  },
  readDirectory: async (path) => {
    const entries = await memFs.readDirectory(path);
    return entries.map(([name, s]) => [name, { type: s.type }]);
  },
  createDirectory: (path) => memFs.createDirectory(path),
  delete: (path, recursive) => memFs.delete(path, recursive),
  move: (oldPath, newPath) => memFs.move(oldPath, newPath),
});

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const waitForDocumentStorageFiles = async (
  vfs: VirtualFileSystem,
  path: string,
  documentId: AMDocumentId,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop -- polling real Automerge storage writes
    const files = await getDocumentStorageFiles(vfs, path, documentId);

    if (files.length > 0) {
      return files;
    }

    // eslint-disable-next-line no-await-in-loop -- polling delay
    await wait(25);
  }

  throw new Error(`Timed out waiting for storage files for document "${documentId}"`);
};

describe('repositoryStorageFiles integration', () => {
  it('cleans Automerge storage files using a browser-backed provider with undefined capabilities', async () => {
    const path = '/repo';
    const vfs = new VirtualFileSystem();

    vfs.mount('/', createAndroidLikeProvider(new MemoryFileSystem()));
    await vfs.createDirectory(path);

    const repo = new Repo({ storage: createVFSAdapter(vfs, path) });
    const documentId = repo.create({
      name: 'Document',
      type: 'document',
      version: 1,
      body: [],
    }).documentId;

    await waitForDocumentStorageFiles(vfs, path, documentId);

    repo.delete(documentId);
    await wait(100);
    await cleanupDeletedDocumentStorageFiles(vfs, path, documentId);
    await repo.shutdown();

    await expect(getDocumentStorageFiles(vfs, path, documentId)).resolves.toEqual([]);
  });

  it('cleans files created by a real Automerge Repo after document deletion', async () => {
    const path = '/repo';
    const vfs = new VirtualFileSystem();

    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    const repo = new Repo({ storage: createVFSAdapter(vfs, path) });
    const documentId = repo.create({
      name: 'Document',
      type: 'document',
      version: 1,
      body: [],
    }).documentId;

    await waitForDocumentStorageFiles(vfs, path, documentId);

    repo.delete(documentId);
    await wait(100);
    await cleanupDeletedDocumentStorageFiles(vfs, path, documentId);
    await repo.shutdown();

    await expect(getDocumentStorageFiles(vfs, path, documentId)).resolves.toEqual([]);
  });
});
