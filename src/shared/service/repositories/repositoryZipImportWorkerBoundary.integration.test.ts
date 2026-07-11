import { describe, expect, it } from 'vitest';
import { uid } from 'uid/secure';
import { createClient, createService, type Provider } from '@shared/lib/proxyService';
import { transformers } from '@shared/lib/wrapWorker/workerTransformerMap';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import type { IFileSystemProvider } from '@shared/lib/virtualFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import { packZipArchive } from '@shared/lib/zipArchive';
import type {
  ZipImportOptions,
  ZipImportProgress,
  ZipImportResult,
} from './repositoryZipContracts';
import { importDirectoryZip } from './repositoryZipImport';

/**
 * A minimal in-memory `Provider` pair that mirrors the real worker `postMessage`/`addEventListener`
 * contract asynchronously (via `setTimeout`), so a call and its result cross an actual message-passing
 * boundary rather than resolving synchronously in-process. The full SuperJSON serialize/deserialize
 * pass, including the registered custom error transformers, still runs on both sides exactly as it
 * does between the app and the real repositories worker — this harness only skips the browser's
 * native binary structured-clone step, which happy-dom's `File`/`Blob` do not support faithfully
 * under Node's `structuredClone` and which is already covered by dedicated binary-transfer tests in
 * `proxyService.test.ts`.
 */
class LoopbackProvider implements Provider {
  private listeners: Set<(p: { data: unknown }) => unknown> = new Set();
  public peer: LoopbackProvider | null = null;

  constructor(
    public myId: string,
    public peerId: string,
  ) {}

  postMessage(data: unknown) {
    if (!this.peer) return;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- wire payload is narrowed like a real worker message
    const payload = { ...(data as Record<string, unknown>) };

    if (payload.serviceId === this.myId) {
      payload.serviceId = this.peerId;
    }

    setTimeout(() => {
      for (const listener of this.peer?.listeners ?? []) {
        listener({ data: payload });
      }
    }, 0);
  }

  addEventListener(_type: 'message', handler: (p: { data: unknown }) => unknown) {
    this.listeners.add(handler);
  }

  removeEventListener(_type: 'message', handler: (p: { data: unknown }) => unknown) {
    this.listeners.delete(handler);
  }
}

type ProxiedImportDirectoryZip = (
  targetPath: string,
  archiveFile: File,
  onProgress?: (progress: ZipImportProgress) => void,
  options?: ZipImportOptions,
) => Promise<ZipImportResult>;

/**
 * Builds a real cross-context RPC client for `importDirectoryZip`, backed by the real low-level
 * import implementation, so a preflight `WebFileSystemAccessRequiredError` travels through the
 * actual SuperJSON/proxy serialization boundary used between the app and the repositories worker,
 * instead of a hand-authored top-level permission error.
 * @param vfs - VFS whose mounted provider drives the non-mutating write-access preflight.
 * @returns The proxied `importDirectoryZip` client function.
 */
const createProxiedImportDirectoryZip = (vfs: VirtualFileSystem): ProxiedImportDirectoryZip => {
  const clientId = uid();
  const serviceId = uid();
  const clientProvider = new LoopbackProvider(clientId, serviceId);
  const serviceProvider = new LoopbackProvider(serviceId, clientId);
  clientProvider.peer = serviceProvider;
  serviceProvider.peer = clientProvider;

  createService(serviceProvider, serviceId, transformers, () => ({
    importDirectoryZip: (
      targetPath: string,
      archiveFile: File,
      onProgress: ((progress: ZipImportProgress) => void) | undefined,
      options: ZipImportOptions | undefined,
    ) => importDirectoryZip(vfs, targetPath, archiveFile, onProgress, options),
  }));

  return createClient<{ importDirectoryZip: ProxiedImportDirectoryZip }>(
    clientProvider,
    clientId,
    transformers,
  ).importDirectoryZip;
};

const createArchiveFile = () =>
  new File([packZipArchive({ 'a.txt': new TextEncoder().encode('a content') })], 'archive.zip', {
    type: 'application/zip',
  });

describe('importDirectoryZip write-access preflight — real worker/proxy boundary', () => {
  it('surfaces a real serialized preflight error that the feature permission-recovery contract still recognizes, with no mutation performed', async () => {
    const memoryFS = new MemoryFileSystem();
    await memoryFS.createDirectory('/target');
    const provider: IFileSystemProvider = {
      stat: (path) => memoryFS.stat(path),
      readFile: (path) => memoryFS.readFile(path),
      writeFile: (path, content, options) => memoryFS.writeFile(path, content, options),
      readDirectory: (path) => memoryFS.readDirectory(path),
      createDirectory: (path) => memoryFS.createDirectory(path),
      delete: (path, recursive) => memoryFS.delete(path, recursive),
      move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
      checkWriteAccess: () =>
        Promise.reject(
          new WebFileSystemAccessRequiredError({ mode: 'readwrite', spaceName: 'Work' }),
        ),
    };
    const vfs = new VirtualFileSystem();
    vfs.mount('/', provider);

    const proxiedImportDirectoryZip = createProxiedImportDirectoryZip(vfs);

    const caught = await proxiedImportDirectoryZip('/target', createArchiveFile()).catch(
      (error: unknown) => error,
    );

    // This is the exact call the feature's write-access recovery flow makes
    // (useImportZipAction.withWriteAccessRecovery) to decide whether to offer a permission-grant
    // retry. It must still recognize the error after it crossed the real proxy wire.
    const recovery = getFileSystemAccessRecovery(caught, { operation: 'write' });

    expect(recovery).toEqual({ operation: 'write', spaceName: 'Work' });
    await expect(memoryFS.readDirectory('/target')).resolves.toEqual([]);
  });

  it('retries the same proxied call after simulated permission grant and completes the import across the real boundary', async () => {
    const memoryFS = new MemoryFileSystem();
    await memoryFS.createDirectory('/target');
    let writeAllowed = false;
    const provider: IFileSystemProvider = {
      stat: (path) => memoryFS.stat(path),
      readFile: (path) => memoryFS.readFile(path),
      writeFile: (path, content, options) => memoryFS.writeFile(path, content, options),
      readDirectory: (path) => memoryFS.readDirectory(path),
      createDirectory: (path) => memoryFS.createDirectory(path),
      delete: (path, recursive) => memoryFS.delete(path, recursive),
      move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
      checkWriteAccess: () =>
        writeAllowed
          ? Promise.resolve()
          : Promise.reject(
              new WebFileSystemAccessRequiredError({ mode: 'readwrite', spaceName: 'Work' }),
            ),
    };
    const vfs = new VirtualFileSystem();
    vfs.mount('/', provider);

    const proxiedImportDirectoryZip = createProxiedImportDirectoryZip(vfs);
    const archiveFile = createArchiveFile();

    const firstAttempt = await proxiedImportDirectoryZip('/target', archiveFile).catch(
      (error: unknown) => error,
    );
    expect(getFileSystemAccessRecovery(firstAttempt, { operation: 'write' })).toBeDefined();

    // Simulates the browser permission grant the feature requests after showing the recovery
    // dialog, then retries the exact same call once, as `useImportZipAction` does.
    writeAllowed = true;
    const retryResult = await proxiedImportDirectoryZip('/target', archiveFile);

    expect(retryResult).toMatchObject({
      status: 'completed',
      summary: { importedFiles: 1 },
    });
    await expect(memoryFS.readFile('/target/a.txt')).resolves.toBeInstanceOf(File);
  });
});
