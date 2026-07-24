import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import type { FileContent, IFileSystemProvider, WriteOptions } from '@shared/lib/virtualFileSystem';

/**
 * Release-only test provider: delegates every operation to a private in-memory backing store,
 * except `writeFile`, whose returned promise stays pending until
 * {@link ReleaseTestDelayedWriteProvider.releasePendingWrite} is called.
 *
 * Exists only so a release e2e test can drive one genuine, tracked VFS mutation through the real
 * production activity-tracking path (`VirtualFileSystem.writeFile`) with a provider promise it can
 * hold open on demand — the generic VFS and its providers carry no test-only behavior themselves.
 */
export type ReleaseTestDelayedWriteProvider = {
  /** The provider to mount; every method except `writeFile` behaves like a normal in-memory store. */
  provider: IFileSystemProvider;
  /** Resolves the currently pending `writeFile` call, if one is in flight. */
  releasePendingWrite: () => void;
};

/**
 * Create a release-only delayed-write provider.
 * @returns The provider to mount and its pending-write release function.
 */
export const createReleaseTestDelayedWriteProvider = (): ReleaseTestDelayedWriteProvider => {
  const backing = new MemoryFileSystem();
  let release: (() => void) | undefined;

  const provider: IFileSystemProvider = {
    stat: (path) => backing.stat(path),
    readFile: (path) => backing.readFile(path),
    async writeFile(path: string, content: FileContent, options: WriteOptions) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return backing.writeFile(path, content, options);
    },
    readDirectory: (path) => backing.readDirectory(path),
    createDirectory: (path) => backing.createDirectory(path),
    delete: (path, recursive) => backing.delete(path, recursive),
    move: (oldPath, newPath) => backing.move(oldPath, newPath),
  };

  return {
    provider,
    releasePendingWrite: () => release?.(),
  };
};
