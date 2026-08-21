import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import { encodePrimaryV3FileName } from '@shared/lib/automergeAdapter';
import { encodeV3StorageWrapper } from '@shared/lib/automergeAdapter/wrapperCodecV3';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import type { ChunkStorageKey } from '@shared/lib/automergeAdapter';
import type { DirectoryEntries, DirectoryState } from '../fileSystem/fileSystemContracts';
import type { RepositoryState } from './repositoryContracts';
import { createRepositoryStateCoordinator } from './repositoryState';

/**
 * Real storage-boundary proof: this file intentionally does not mock `getRepositoryFacts` or
 * `VirtualFileSystem`. `repositoryState.test.ts` hoists a module mock for `getRepositoryFacts` to
 * keep its lifecycle/concurrency harness deterministic, so it cannot prove that the real
 * `repositoryState` -> `getRepositoryFacts` boundary consumes the already-accepted directory
 * snapshot without a second canonical `vfs.readDirectory()` call.
 */

const SAMPLE_HEX_HASH = 'a'.repeat(64);

describe('createRepositoryStateCoordinator real storage boundary', () => {
  it('derives repository facts from the supplied directory snapshot with zero additional canonical readDirectory() calls', async () => {
    const path = '/repo';
    const vfs = new VirtualFileSystem();
    vfs.mount('/', new MemoryFileSystem());
    await vfs.createDirectory(path);

    const documentId = new Repo().create({}).documentId;
    const key: ChunkStorageKey = [documentId, 'snapshot', SAMPLE_HEX_HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    await vfs.writeFile(`${path}/${fileName}`, encodeV3StorageWrapper(key, new Uint8Array([1])));

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
