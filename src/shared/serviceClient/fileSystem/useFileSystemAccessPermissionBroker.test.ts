import {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticResult,
  DiagnosticStage,
  type DiagnosticEvent,
  setDiagnosticEventSink,
} from '@shared/lib/diagnostics';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';

const getTemporaryFileSystemAccessHandleMock = vi.fn();
const resolveFileSystemAccessRequestMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      getTemporaryFileSystemAccessHandle: getTemporaryFileSystemAccessHandleMock,
      resolveFileSystemAccessRequest: resolveFileSystemAccessRequestMock,
    },
  }),
}));

const mountBroker = async () => {
  const scope = effectScope();
  let broker:
    | ReturnType<
        typeof import('./useFileSystemAccessPermissionBroker').useFileSystemAccessPermissionBroker
      >
    | undefined;
  const { useFileSystemAccessPermissionBroker } =
    await import('./useFileSystemAccessPermissionBroker');

  scope.run(() => {
    broker = useFileSystemAccessPermissionBroker();
  });

  if (!broker) {
    throw new Error('Expected permission broker');
  }

  return {
    broker,
    scope,
  };
};

describe('useFileSystemAccessPermissionBroker', () => {
  let diagnosticSink: DiagnosticEvent[];

  beforeEach(() => {
    diagnosticSink = [];
    setDiagnosticEventSink(diagnosticSink);
  });

  afterEach(() => {
    setDiagnosticEventSink(undefined);
    getTemporaryFileSystemAccessHandleMock.mockReset();
    resolveFileSystemAccessRequestMock.mockReset();
  });

  it('exposes only the one-shot request command and keeps handle state internal', async () => {
    const { broker, scope } = await mountBroker();

    expect(Object.keys(broker)).toEqual(['requestAccess']);

    scope.stop();
  });

  it('requests permission on the main thread and resolves granted access', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('granted');
    getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
      handle,
      operation: 'read',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'granted',
    });

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'granted',
    });
    expect(handle.requestPermissionMock).toHaveBeenCalledWith({ mode: 'read' });
    expect(resolveFileSystemAccessRequestMock).toHaveBeenCalledWith({
      operation: 'read',
      permissionState: 'granted',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('uses readwrite mode for write recovery', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'denied',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('denied');
    getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
      handle,
      operation: 'write',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'denied',
    });

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'write',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'denied',
    });
    expect(handle.requestPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });

    scope.stop();
  });

  it('returns error when the service cannot supply a temporary handle', async () => {
    getTemporaryFileSystemAccessHandleMock.mockResolvedValue(undefined);

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'error',
    });
    expect(resolveFileSystemAccessRequestMock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('returns error when requestPermission rejects and refetches the handle on the next call', async () => {
    const rejectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work-rejected',
    });
    const grantedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work-granted',
    });
    rejectedHandle.requestPermissionMock.mockRejectedValue(
      new DOMException('User activation required'),
    );
    grantedHandle.requestPermissionMock.mockResolvedValue('granted');
    getTemporaryFileSystemAccessHandleMock
      .mockResolvedValueOnce({
        handle: rejectedHandle,
        operation: 'read',
        spaceName: 'Work',
      })
      .mockResolvedValueOnce({
        handle: grantedHandle,
        operation: 'read',
        spaceName: 'Work',
      });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'granted',
    });

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'error',
    });
    await expect(
      broker.requestAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'granted',
    });
    expect(getTemporaryFileSystemAccessHandleMock).toHaveBeenCalledTimes(2);
    expect(resolveFileSystemAccessRequestMock).toHaveBeenCalledTimes(1);

    scope.stop();
  });

  it('returns error when getting the temporary handle rejects', async () => {
    getTemporaryFileSystemAccessHandleMock.mockRejectedValue(new Error('service failed'));

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'error',
    });
    expect(resolveFileSystemAccessRequestMock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('returns error when resolving the access request rejects', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('granted');
    getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
      handle,
      operation: 'read',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockRejectedValue(new Error('resolve failed'));

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'error',
    });

    scope.stop();
  });

  it('returns grantedWithReplayFailures when permission is granted but pending repository saves still need attention', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('granted');
    getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
      handle,
      operation: 'write',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'grantedWithReplayFailures',
    });

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'write',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'grantedWithReplayFailures',
    });

    scope.stop();
  });

  it('returns grantedWithStorageFailures when permission is granted but replay hits another storage failure', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('granted');
    getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
      handle,
      operation: 'write',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'grantedWithStorageFailures',
    });

    const { broker, scope } = await mountBroker();

    await expect(
      broker.requestAccess({
        operation: 'write',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'grantedWithStorageFailures',
    });

    scope.stop();
  });

  describe('diagnostic events', () => {
    it('emits a staleRequest diagnostic event when no temporary handle is available', async () => {
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue(undefined);

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        feature: DiagnosticFeature.writeAccessRecovery,
        operation: DiagnosticOperation.requestAccess,
        stage: DiagnosticStage.accessRequestPrepare,
        result: DiagnosticResult.staleRequest,
        classification: DiagnosticClassification.staleRequest,
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a staleRequest diagnostic event when the resolve result is missing', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockResolvedValue('granted');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({ status: 'missing' });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        feature: DiagnosticFeature.writeAccessRecovery,
        operation: DiagnosticOperation.resolveAccessRequest,
        stage: DiagnosticStage.accessRequestResolved,
        result: DiagnosticResult.staleRequest,
        classification: DiagnosticClassification.staleRequest,
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a replayFailure diagnostic event when grantedWithReplayFailures', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockResolvedValue('granted');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({ status: 'grantedWithReplayFailures' });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        feature: DiagnosticFeature.writeAccessRecovery,
        operation: DiagnosticOperation.resolveAccessRequest,
        stage: DiagnosticStage.accessRequestResolved,
        result: DiagnosticResult.replayFailure,
        classification: DiagnosticClassification.storageFailure,
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a storageFailure diagnostic event when grantedWithStorageFailures', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockResolvedValue('granted');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({
        status: 'grantedWithStorageFailures',
      });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        feature: DiagnosticFeature.writeAccessRecovery,
        operation: DiagnosticOperation.resolveAccessRequest,
        stage: DiagnosticStage.accessRequestResolved,
        result: DiagnosticResult.storageFailure,
        classification: DiagnosticClassification.storageFailure,
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('does not emit a diagnostic event for a clean grant', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockResolvedValue('granted');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({ status: 'granted' });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(0);

      scope.stop();
    });
  });
});
