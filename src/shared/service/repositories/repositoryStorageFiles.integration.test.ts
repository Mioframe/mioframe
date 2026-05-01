import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import type { AMDocumentId } from '@shared/lib/automerge';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import {
  cleanupDeletedDocumentStorageFiles,
  getDocumentStorageFiles,
} from './repositoryStorageFiles';

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
