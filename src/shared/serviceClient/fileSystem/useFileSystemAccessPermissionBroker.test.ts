import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
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
      grantedHandle: handle,
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
    it('emits a missingRequest diagnostic event when no temporary handle is available', async () => {
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue(undefined);

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        name: 'writeAccessRecovery.missingRequest',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Stale,
        classification: DiagnosticClassification.Access,
        safeTags: { provider: 'webFileSystem', operation: 'requestAccess' },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a staleResolve diagnostic event when the resolve result is missing', async () => {
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
        name: 'writeAccessRecovery.staleResolve',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Stale,
        classification: DiagnosticClassification.Access,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a grantReplayStillBlocked diagnostic event when grantedWithReplayFailures', async () => {
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
        name: 'writeAccessRecovery.grantReplayStillBlocked',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Blocked,
        classification: DiagnosticClassification.Access,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a grantReplayStorageFailure diagnostic event when grantedWithStorageFailures', async () => {
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
        name: 'writeAccessRecovery.grantReplayStorageFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a permissionDenied diagnostic event when write access is denied', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockResolvedValue('denied');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({ status: 'denied' });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        name: 'writeAccessRecovery.permissionDenied',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Denied,
        classification: DiagnosticClassification.Access,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('does not emit a permissionDenied event when cancelled (expected user outcome)', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockResolvedValue('prompt');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({ status: 'cancelled' });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(0);

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

    it('emits a handleComparison diagnostic event with safe statuses after a granted write recovery', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work-returned',
      });
      handle.requestPermissionMock.mockResolvedValue('granted');
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });
      resolveFileSystemAccessRequestMock.mockResolvedValue({
        status: 'granted',
        comparison: {
          returnedHandleProvided: 'true',
          returnedHandleSameEntry: 'false',
          storedHandlePermission: 'prompt',
          returnedHandlePermission: 'granted',
          handleComparisonResult: 'differentEntry',
        },
      });

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        name: 'writeAccessRecovery.handleComparison',
        severity: DiagnosticSeverity.Info,
        result: DiagnosticResult.Success,
        classification: DiagnosticClassification.Access,
        safeTags: {
          provider: 'webFileSystem',
          operation: 'resolveAccessRequest',
          returnedHandleProvided: 'true',
          returnedHandleSameEntry: 'false',
          storedHandlePermission: 'prompt',
          returnedHandlePermission: 'granted',
          handleComparisonResult: 'differentEntry',
        },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('emits a providerFailure diagnostic event with sanitized error when the outer catch fires', async () => {
      getTemporaryFileSystemAccessHandleMock.mockRejectedValue(
        new DOMException('Permission denied', 'NotAllowedError'),
      );

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        name: 'writeAccessRecovery.providerFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Provider,
        safeTags: { provider: 'webFileSystem', operation: 'requestAccess' },
        error: {
          errorClass: 'DOMException',
          domExceptionName: 'NotAllowedError',
          errorClassification: 'accessDenied',
        },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Permission denied');

      scope.stop();
    });

    it('emits a providerFailure diagnostic event when requestPermission rejects unexpectedly', async () => {
      const handle = createDirectoryHandleMock({
        name: 'Work',
        permissionState: 'prompt',
        sameEntryKey: 'work',
      });
      handle.requestPermissionMock.mockRejectedValue(new Error('Unexpected internal error'));
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue({
        handle,
        operation: 'write',
        spaceName: 'Work',
      });

      const { broker, scope } = await mountBroker();

      const result = await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(result).toEqual({ status: 'error' });
      expect(diagnosticSink).toHaveLength(1);
      expect(diagnosticSink[0]).toMatchObject({
        name: 'writeAccessRecovery.providerFailure',
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Provider,
        safeTags: { provider: 'webFileSystem' },
        error: { errorClass: 'Error', errorClassification: 'unknown' },
      });
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Unexpected internal error');
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('Work');

      scope.stop();
    });

    it('all events within one requestAccess call share the same attemptId', async () => {
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

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(1);
      expect(typeof diagnosticSink[0]?.attemptId).toBe('string');
      expect(diagnosticSink[0]?.attemptId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );

      scope.stop();
    });

    it('different requestAccess calls produce different attemptIds', async () => {
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue(undefined);

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });
      await broker.requestAccess({ operation: 'write', spaceName: 'Work' });

      expect(diagnosticSink).toHaveLength(2);
      expect(diagnosticSink[0]?.attemptId).toBeDefined();
      expect(diagnosticSink[1]?.attemptId).toBeDefined();
      expect(diagnosticSink[0]?.attemptId).not.toBe(diagnosticSink[1]?.attemptId);

      scope.stop();
    });

    it('attemptId is never derived from space name or path', async () => {
      getTemporaryFileSystemAccessHandleMock.mockResolvedValue(undefined);

      const { broker, scope } = await mountBroker();

      await broker.requestAccess({ operation: 'write', spaceName: 'SuperSecretWork' });

      expect(diagnosticSink).toHaveLength(1);
      expect(JSON.stringify(diagnosticSink[0])).not.toContain('SuperSecretWork');

      scope.stop();
    });
  });
});
