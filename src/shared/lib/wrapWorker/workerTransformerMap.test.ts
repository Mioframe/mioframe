import { describe, expect, it } from 'vitest';
import { uid } from 'uid/secure';
import { createClient, createService } from '@shared/lib/proxyService';
import {
  WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
  WebFileSystemAccessRequiredError,
  WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE,
  createWebFileSystemWriteStartFailedError,
} from '@shared/lib/webFileSystemProvider';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { DomainError } from '@shared/lib/error';
import { transformers } from './workerTransformerMap';

class MockProvider {
  private listeners = new Set<(payload: { data: unknown }) => void>();
  peer: MockProvider | null = null;

  constructor(
    private readonly myId: string,
    private readonly peerId: string,
  ) {}

  postMessage(data: unknown) {
    if (!this.peer) {
      return;
    }

    const payload = JSON.parse(JSON.stringify(data));

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'serviceId' in payload &&
      payload.serviceId === this.myId
    ) {
      payload.serviceId = this.peerId;
    }

    queueMicrotask(() => {
      if (!this.peer) {
        return;
      }

      for (const listener of this.peer.listeners) {
        listener({ data: payload });
      }
    });
  }

  addEventListener(_type: 'message', handler: (payload: { data: unknown }) => void) {
    this.listeners.add(handler);
  }

  removeEventListener(_type: 'message', handler: (payload: { data: unknown }) => void) {
    this.listeners.delete(handler);
  }
}

const createChannel = (clientId: string, serviceId: string) => {
  const clientProvider = new MockProvider(clientId, serviceId);
  const serviceProvider = new MockProvider(serviceId, clientId);
  clientProvider.peer = serviceProvider;
  serviceProvider.peer = clientProvider;
  return { clientProvider, serviceProvider };
};

enum TestErrorCode {
  TestFailure = 'test.failure',
}

/**
 * Mock provider that passes messages by reference without JSON serialization.
 * Used to test Blob/File transformer behavior through the SuperJSON layer, since
 * Blob/File objects are preserved by real worker postMessage via structured clone
 * but do not survive JSON.parse/JSON.stringify in the default MockProvider.
 */
class ReferencePassingProvider {
  private listeners = new Set<(payload: { data: unknown }) => void>();
  peer: ReferencePassingProvider | null = null;

  constructor(
    private readonly myId: string,
    private readonly peerId: string,
  ) {}

  postMessage(data: unknown) {
    if (!this.peer) return;
    // Patch the serviceId for routing without cloning the payload.
    // This simulates real worker postMessage for non-serializable types like Blob/File.
    let payload = data;
    if (
      typeof data === 'object' &&
      data !== null &&
      'serviceId' in data &&
      typeof data.serviceId === 'string' &&
      data.serviceId === this.myId
    ) {
      payload = { ...data, serviceId: this.peerId };
    }
    queueMicrotask(() => {
      if (!this.peer) return;
      for (const listener of this.peer.listeners) {
        listener({ data: payload });
      }
    });
  }

  addEventListener(_type: 'message', handler: (payload: { data: unknown }) => void) {
    this.listeners.add(handler);
  }

  removeEventListener(_type: 'message', handler: (payload: { data: unknown }) => void) {
    this.listeners.delete(handler);
  }
}

const createReferenceChannel = (clientId: string, serviceId: string) => {
  const clientProvider = new ReferencePassingProvider(clientId, serviceId);
  const serviceProvider = new ReferencePassingProvider(serviceId, clientId);
  clientProvider.peer = serviceProvider;
  serviceProvider.peer = clientProvider;
  return { clientProvider, serviceProvider };
};

describe('workerTransformerMap', () => {
  it('reconstructs WebFileSystemAccessRequiredError across the service boundary', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, transformers, () => ({
      fail: () => {
        throw new WebFileSystemAccessRequiredError({
          mode: 'readwrite',
          spaceName: 'Work',
        });
      },
    }));

    const client = createClient<{ fail: () => Promise<void> }>(
      clientProvider,
      clientId,
      transformers,
    );

    await expect(client.fail()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(WebFileSystemAccessRequiredError);
      expect(error).toMatchObject({
        code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
        mode: 'readwrite',
        spaceName: 'Work',
      });
      expect(getFileSystemAccessRecovery(error, { operation: 'write' })).toEqual({
        operation: 'write',
        spaceName: 'Work',
      });
      return true;
    });
  });

  it('reconstructs DomainError across the service boundary with message, code, cause, and name intact', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    const originalCause = new Error('ENOENT: no such file or directory, mkdir /private/Examples');

    createService(serviceProvider, serviceId, transformers, () => ({
      fail: () => {
        throw new DomainError('Could not create example', {
          code: TestErrorCode.TestFailure,
          cause: originalCause,
        });
      },
    }));

    const client = createClient<{ fail: () => Promise<void> }>(
      clientProvider,
      clientId,
      transformers,
    );

    await expect(client.fail()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toMatchObject({
        name: 'DomainError',
        message: 'Could not create example',
        code: TestErrorCode.TestFailure,
      });
      if (!(error instanceof DomainError)) return true;
      expect(error.cause).toMatchObject({ message: originalCause.message });
      return true;
    });
  });

  it('reconstructs provider write-start DomainError across the service boundary', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    const originalCause = new DOMException('The handle became invalid', 'InvalidStateError');

    createService(serviceProvider, serviceId, transformers, () => ({
      fail: () => {
        throw createWebFileSystemWriteStartFailedError(originalCause);
      },
    }));

    const client = createClient<{ fail: () => Promise<void> }>(
      clientProvider,
      clientId,
      transformers,
    );

    await expect(client.fail()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toMatchObject({
        code: WEB_FILE_SYSTEM_WRITE_START_FAILED_CODE,
        name: 'DomainError',
      });
      if (!(error instanceof DomainError)) {
        return true;
      }
      expect(error.cause).toMatchObject({
        message: 'The handle became invalid',
        name: 'InvalidStateError',
      });
      return true;
    });
  });

  it('reconstructs VfsError with code, message, and cause across the service boundary', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    const rawCause = new DOMException('NotFoundError');

    createService(serviceProvider, serviceId, transformers, () => ({
      fail: () => {
        throw new VfsError(FileSystemError.FileNotFound, 'Entry not found.', rawCause);
      },
    }));

    const client = createClient<{ fail: () => Promise<void> }>(
      clientProvider,
      clientId,
      transformers,
    );

    await expect(client.fail()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(VfsError);
      expect(error).toMatchObject({
        name: 'VfsError',
        message: 'Entry not found.',
        code: FileSystemError.FileNotFound,
      });
      return true;
    });
  });

  it('preserves nested VfsActivityState.lastError.cause recovery data across the service boundary', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, transformers, () => ({
      getState: () =>
        ({
          status: 'error',
          activeCount: 0,
          lastError: {
            operationType: 'writeFile',
            path: '/private.txt',
            message: 'write failed',
            occurredAt: 1,
            acknowledged: false,
            cause: new WebFileSystemAccessRequiredError({
              mode: 'readwrite',
              spaceName: 'Work',
            }),
          },
        }) satisfies VfsActivityState,
    }));

    const client = createClient<{ getState: () => Promise<VfsActivityState> }>(
      clientProvider,
      clientId,
      transformers,
    );

    const state = await client.getState();

    expect(state.status).toBe('error');
    expect(state.lastError?.cause).toBeInstanceOf(WebFileSystemAccessRequiredError);
    expect(state.lastError?.cause).toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
    expect(getFileSystemAccessRecovery(state.lastError?.cause, { operation: 'write' })).toEqual({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(state.lastError?.cause).not.toHaveProperty('handle');
    expect(state.lastError?.cause).not.toHaveProperty('provider');
  });

  it('passes a File through the proxy and the service can read its text', async () => {
    const serviceId = uid();
    const clientId = uid();
    // Uses reference-passing (no JSON cloning) to simulate worker postMessage structured clone
    // semantics for Blob/File, which are not JSON-serializable but are structured-cloneable.
    const { clientProvider, serviceProvider } = createReferenceChannel(clientId, serviceId);

    const jsonContent = JSON.stringify({ name: 'Doc', type: 'note', version: 1, body: {} });

    let capturedFile: File | undefined;

    createService(serviceProvider, serviceId, transformers, () => ({
      importFile: async (file: File) => {
        capturedFile = file;
        return file.text();
      },
    }));

    const client = createClient<{ importFile: (file: File) => Promise<string> }>(
      clientProvider,
      clientId,
      transformers,
    );

    const selectedFile = new File([jsonContent], 'doc.json', { type: 'application/json' });
    const result = await client.importFile(selectedFile);

    expect(result).toBe(jsonContent);
    expect(capturedFile).toBeInstanceOf(File);
    expect(await capturedFile?.text()).toBe(jsonContent);
  });

  it('passes a Blob through the proxy and the service can read its text', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createReferenceChannel(clientId, serviceId);

    const content = 'hello from blob';

    createService(serviceProvider, serviceId, transformers, () => ({
      readBlob: async (blob: Blob) => blob.text(),
    }));

    const client = createClient<{ readBlob: (blob: Blob) => Promise<string> }>(
      clientProvider,
      clientId,
      transformers,
    );

    const blob = new Blob([content], { type: 'text/plain' });
    const result = await client.readBlob(blob);

    expect(result).toBe(content);
  });

  it('existing error transformers still work when Blob transformer is registered', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createReferenceChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, transformers, () => ({
      fail: () => {
        throw new DomainError('still works', {
          code: TestErrorCode.TestFailure,
          cause: new Error('root cause'),
        });
      },
    }));

    const client = createClient<{ fail: () => Promise<void> }>(
      clientProvider,
      clientId,
      transformers,
    );

    await expect(client.fail()).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toMatchObject({ message: 'still works', code: TestErrorCode.TestFailure });
      return true;
    });
  });
});
