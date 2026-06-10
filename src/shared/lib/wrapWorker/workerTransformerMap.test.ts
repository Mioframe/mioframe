import { describe, expect, it } from 'vitest';
import { uid } from 'uid/secure';
import { createClient, createService } from '@shared/lib/proxyService';
import {
  WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
  WebFileSystemAccessRequiredError,
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
});
