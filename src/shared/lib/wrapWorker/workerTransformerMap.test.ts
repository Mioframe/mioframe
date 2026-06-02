import { describe, expect, it } from 'vitest';
import { uid } from 'uid/secure';
import { createClient, createService } from '@shared/lib/proxyService';
import {
  WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
  WebFileSystemAccessRequiredError,
} from '@shared/lib/webFileSystemProvider';
import { getFileSystemAccessRecovery } from '@shared/lib/fileSystem';
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
});
