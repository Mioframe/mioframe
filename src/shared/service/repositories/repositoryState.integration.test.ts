import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import { createVFSAdapter } from '@shared/lib/automergeAdapter/createVFSAdapter';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import type { DirectoryEntries, DirectoryState } from '../fileSystem/fileSystemContracts';
import type { RepositoryState } from './repositoryContracts';
import { createRepositoryStateCoordinator } from './repositoryState';
import { getDocumentStorageFiles } from './repositoryStorageFiles';

/**
 * Real storage-boundary proof: this file intentionally does not mock `getRepositoryFacts` or
 * `VirtualFileSystem`. `repositoryState.test.ts` hoists a module mock for `getRepositoryFacts` to
 * keep its lifecycle/concurrency harness deterministic, so it cannot prove that the real
 * `repositoryState` -> `getRepositoryFacts` boundary consumes the already-accepted directory
 * snapshot without a second canonical `vfs.readDirectory()` call.
 */

const wait = async (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('createRepositoryStateCoordinator real storage boundary', () => {
  it('derives repository facts from the supplied directory snapshot with zero additional canonical readDirectory() calls', async () => {
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

    // Poll the real boundary until Automerge has actually written a decodable storage file for
    // this document (a bare non-empty directory listing can transiently include partial/pending
    // writes). This setup read captures the "already-accepted directory snapshot" that a
    // directory coordinator would have supplied; it is not part of the repository derivation path
    // under test.
    let hasStorageFile = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop -- polling real Automerge storage writes
      const files = await getDocumentStorageFiles(vfs, path, documentId);
      if (files.length > 0) {
        hasStorageFile = true;
        break;
      }
      // eslint-disable-next-line no-await-in-loop -- polling delay
      await wait(25);
    }
    await repo.shutdown();

    if (!hasStorageFile) {
      throw new Error('Timed out waiting for repository storage files');
    }

    const snapshotEntries: DirectoryEntries = await vfs.readDirectory(path);

    // Only calls made from here on are attributable to the coordinator/derivation under test.
    const readDirectorySpy = vi.spyOn(vfs, 'readDirectory');

    const directoryState = new Subject<DirectoryState>();
    const { repositoryState$ } = createRepositoryStateCoordinator(vfs, () =>
      directoryState.asObservable(),
    );

    const states: RepositoryState[] = [];
    const subscription = repositoryState$({ path }).subscribe((state) => states.push(state));

    directoryState.next({ status: 'ready', entries: snapshotEntries });

    await vi.waitFor(() => {
      const last = states.at(-1);
      if (last?.status !== 'ready') throw new Error('not ready yet');
      expect(last.snapshot.documentIds).toContain(documentId);
    });

    // The repository coordinator must derive facts from the supplied snapshot alone. Candidate
    // `readFile` calls for v3 wrapper discovery are expected and are not canonical directory
    // listings; only `readDirectory()` is asserted here.
    expect(readDirectorySpy).not.toHaveBeenCalled();

    subscription.unsubscribe();
  });
});
