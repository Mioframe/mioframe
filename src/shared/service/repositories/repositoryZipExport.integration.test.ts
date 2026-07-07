import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import type { AMDocumentId } from '@shared/lib/automerge';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { unpackZipArchive } from '@shared/lib/zipArchive';
import { getDocumentStorageFiles } from './repositoryStorageFiles';
import { exportDocumentZip } from './repositoryZipExport';

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

/**
 * Collects every chunk delivered to an export `onChunk` callback into one archive byte array.
 * @returns An `onChunk` callback plus a `merge` function that concatenates the collected chunks.
 */
const collectChunks = () => {
  const chunks: Uint8Array[] = [];
  const onChunk = (chunk: Uint8Array) => {
    chunks.push(chunk);
  };
  const merge = () => {
    const total = chunks.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of chunks) {
      merged.set(part, offset);
      offset += part.length;
    }
    return merged;
  };
  return { onChunk, merge };
};

describe('exportDocumentZip integration: storage freshness', () => {
  it('includes a change made after document creation once flushRepositoryPath flushes it, using a real Repo and VFS storage adapter', async () => {
    const path = '/repo';
    const vfs = new VirtualFileSystem();
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    const repo = new Repo({ storage: createVFSAdapter(vfs, path) });
    const handle = repo.create<{ name: string; body: string[] }>({
      name: 'Freshness test',
      body: ['initial'],
    });
    const documentId = handle.documentId;

    await waitForDocumentStorageFiles(vfs, path, documentId);

    handle.change((doc) => {
      doc.body.push('changed-after-creation');
    });

    const { onChunk, merge } = collectChunks();

    // Uses the real `repo.flush` as the service wiring does (see
    // repositoriesService.ts's flushRepositoryPathForExport), not a mocked callback.
    await exportDocumentZip(
      vfs,
      async (_flushPath, documentIds) => {
        await repo.flush(documentIds);
      },
      path,
      documentId,
      onChunk,
    );

    await repo.shutdown();

    const unpacked = unpackZipArchive(merge());
    const exportedEntries = Object.entries(unpacked).filter(([entryPath]) =>
      entryPath.startsWith(`${documentId}/`),
    );
    expect(exportedEntries.length).toBeGreaterThan(0);

    const reimportVfs = new VirtualFileSystem();
    reimportVfs.mount('/', new MemoryFileSystem());
    await reimportVfs.createDirectory(path);

    for (const [entryPath, content] of exportedEntries) {
      const fileName = entryPath.slice(`${documentId}/`.length);
      // eslint-disable-next-line no-await-in-loop -- small, sequential fixture rehydration
      await reimportVfs.writeFile(`${path}/${fileName}`, content);
    }

    const reimportRepo = new Repo({ storage: createVFSAdapter(reimportVfs, path) });
    const reimportHandle = await reimportRepo.find<{ name: string; body: string[] }>(documentId);
    await reimportHandle.whenReady();

    expect(reimportHandle.doc().body).toEqual(['initial', 'changed-after-creation']);

    await reimportRepo.shutdown();
  });
});
