import { describe, expect, it } from 'vitest';
import { uid } from 'uid/secure';
import { createClient, createService, type Provider } from '@shared/lib/proxyService';
import { transformers } from '@shared/lib/wrapWorker/workerTransformerMap';
import type { IFileSystemProvider } from '@shared/lib/virtualFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { packZipArchive } from '@shared/lib/zipArchive';
import {
  getZipImportPartialFailureDetails,
  RepositoryZipErrorCode,
} from './repositoryZipContracts';
import type { ZipImportProgress, ZipImportResult } from './repositoryZipContracts';
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
) => Promise<ZipImportResult>;

/**
 * Builds a real cross-context RPC client for `importDirectoryZip`, backed by the real low-level
 * import implementation, so a `File` argument, progress callbacks, the result, and any thrown error
 * travel through the actual SuperJSON/proxy serialization boundary used between the app and the
 * repositories worker, instead of a hand-authored top-level stand-in.
 * @param vfs - Target virtual filesystem the proxied import writes through.
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
    ) => importDirectoryZip(vfs, targetPath, archiveFile, onProgress),
  }));

  return createClient<{ importDirectoryZip: ProxiedImportDirectoryZip }>(
    clientProvider,
    clientId,
    transformers,
  ).importDirectoryZip;
};

const createArchiveFile = (entries: Parameters<typeof packZipArchive>[0]) =>
  new File([packZipArchive(entries)], 'archive.zip', { type: 'application/zip' });

describe('importDirectoryZip — real worker/proxy boundary', () => {
  it('transports the File argument, progress callbacks, and a completed result across the real boundary', async () => {
    const memoryFS = new MemoryFileSystem();
    await memoryFS.createDirectory('/target');
    const vfs = new VirtualFileSystem();
    vfs.mount('/', memoryFS);

    const proxiedImportDirectoryZip = createProxiedImportDirectoryZip(vfs);
    const archiveFile = createArchiveFile({ 'a.txt': new TextEncoder().encode('a content') });

    const progressPhases: ZipImportProgress['phase'][] = [];
    const result = await proxiedImportDirectoryZip('/target', archiveFile, (progress) => {
      progressPhases.push(progress.phase);
    });

    expect(result).toMatchObject({ status: 'completed', summary: { importedFiles: 1 } });
    expect(progressPhases).toEqual(
      expect.arrayContaining(['validatingArchive', 'checkingConflicts', 'unpacking']),
    );
    await expect(memoryFS.readFile('/target/a.txt')).resolves.toBeInstanceOf(File);
  });

  it('transports a conflicts result across the real boundary with no mutation performed', async () => {
    const memoryFS = new MemoryFileSystem();
    const vfs = new VirtualFileSystem();
    vfs.mount('/', memoryFS);
    await vfs.createDirectory('/target');
    await vfs.createFile('/target/a.txt', 'already here');

    const proxiedImportDirectoryZip = createProxiedImportDirectoryZip(vfs);
    const archiveFile = createArchiveFile({ 'a.txt': new TextEncoder().encode('new content') });

    const result = await proxiedImportDirectoryZip('/target', archiveFile);

    expect(result).toMatchObject({ status: 'conflicts', report: { total: 1, paths: ['a.txt'] } });
    await expect(memoryFS.readFile('/target/a.txt').then((file) => file.text())).resolves.toBe(
      'already here',
    );
  });

  it('transports a transfer-safe terminal partial-import error across the real boundary, preserving completed counts', async () => {
    const memoryFS = new MemoryFileSystem();
    await memoryFS.createDirectory('/target');
    let writeCount = 0;
    const provider: IFileSystemProvider = {
      stat: (path) => memoryFS.stat(path),
      readFile: (path) => memoryFS.readFile(path),
      writeFile: (path, content, options) => {
        writeCount += 1;
        if (writeCount === 2) return Promise.reject(new Error('simulated storage failure'));
        return memoryFS.writeFile(path, content, options);
      },
      readDirectory: (path) => memoryFS.readDirectory(path),
      createDirectory: (path) => memoryFS.createDirectory(path),
      delete: (path, recursive) => memoryFS.delete(path, recursive),
      move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
    };
    const vfs = new VirtualFileSystem();
    vfs.mount('/', provider);

    const proxiedImportDirectoryZip = createProxiedImportDirectoryZip(vfs);
    const archiveFile = createArchiveFile({
      'a.txt': new TextEncoder().encode('a content'),
      'b.txt': new TextEncoder().encode('b content'),
    });

    const caught: unknown = await proxiedImportDirectoryZip('/target', archiveFile).catch(
      (error: unknown) => error,
    );

    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
    const details = getZipImportPartialFailureDetails(caught);
    expect(details?.importSummary).toMatchObject({ importedFiles: 1 });
  });
});
