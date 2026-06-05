import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
} from '@shared/lib/diagnostics';

const {
  defineWorkerClientMock,
  workerConstructorMock,
  addEventListenerMock,
  reportDiagnosticEventMock,
} = vi.hoisted(() => {
  const addEventListenerMock = vi.fn();
  const reportDiagnosticEventMock = vi.fn();

  return {
    defineWorkerClientMock: vi.fn(
      (worker: Worker | (() => Worker), _serviceId: string, _setup: () => unknown) => {
        let client: Worker | undefined;

        return () => {
          client = typeof worker === 'function' ? worker() : worker;
          return client;
        };
      },
    ),
    workerConstructorMock: vi.fn(
      class MockWorker {
        terminate = vi.fn();
        addEventListener = addEventListenerMock;
      },
    ),
    addEventListenerMock,
    reportDiagnosticEventMock,
  };
});

vi.mock('@shared/lib/wrapWorker', () => ({
  defineWorkerClient: defineWorkerClientMock,
}));

vi.mock('./serviceWorker.ts?worker', () => ({
  default: workerConstructorMock,
}));

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    reportDiagnosticEvent: reportDiagnosticEventMock,
  };
});

const makeDiagnosticEvent = (overrides?: Partial<DiagnosticEvent>): DiagnosticEvent => ({
  name: 'test.event',
  severity: DiagnosticSeverity.Error,
  result: DiagnosticResult.Failed,
  classification: DiagnosticClassification.Unexpected,
  ...overrides,
});

describe('useMainServiceClient', () => {
  beforeEach(() => {
    defineWorkerClientMock.mockClear();
    workerConstructorMock.mockClear();
    addEventListenerMock.mockClear();
    reportDiagnosticEventMock.mockClear();
    vi.resetModules();
  });

  it('does not construct the worker until the client is first used', async () => {
    const { useMainServiceClient } = await import('./useService');

    expect(workerConstructorMock).not.toHaveBeenCalled();
    expect(defineWorkerClientMock).toHaveBeenCalledTimes(1);

    const firstClient = useMainServiceClient();
    const secondClient = useMainServiceClient();

    expect(firstClient).toBe(secondClient);
    expect(workerConstructorMock).toHaveBeenCalledTimes(1);
  });

  describe('worker diagnostic forwarding', () => {
    const getMessageHandler = (): ((e: { data: unknown }) => void) | undefined => {
      const call = addEventListenerMock.mock.calls.find((args) => args[0] === 'message');
      return call?.[1];
    };

    it('registers a message listener on the worker when first used', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      expect(addEventListenerMock).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('calls reportDiagnosticEvent when a diagnosticForward message is received', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      expect(handler).toBeDefined();

      const event = makeDiagnosticEvent({ name: 'repositoryStorage.saveQueued' });
      handler?.({ data: { type: 'diagnosticForward', event } });

      expect(reportDiagnosticEventMock).toHaveBeenCalledOnce();
      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(event);
    });

    it('forwards repository saveQueued events to the main diagnostics reporter', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      const event = makeDiagnosticEvent({
        name: 'repositoryStorage.saveQueued',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Blocked,
        classification: DiagnosticClassification.Access,
        counters: { pendingCount: 2 },
        safeTags: {
          provider: 'webFileSystem',
          operation: 'repositorySave',
          failureClassification: 'accessRequired',
        },
      });

      handler?.({ data: { type: 'diagnosticForward', event } });

      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(event);
    });

    it('forwards repository saveFailed events to the main diagnostics reporter', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      const event = makeDiagnosticEvent({
        name: 'repositoryStorage.saveFailed',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        counters: { pendingCount: 0 },
        safeTags: {
          provider: 'webFileSystem',
          operation: 'repositorySave',
          failureClassification: 'storageFailure',
        },
      });

      handler?.({ data: { type: 'diagnosticForward', event } });

      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(event);
    });

    it('forwards repositoryReplayStorageFailure events to the main diagnostics reporter', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      const event = makeDiagnosticEvent({
        name: 'writeAccessRecovery.repositoryReplayStorageFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        counters: { flushedCount: 0, pendingCount: 1 },
        safeTags: {
          provider: 'webFileSystem',
          operation: 'flushPendingSaves',
          failureClassification: 'storageFailure',
        },
      });

      handler?.({ data: { type: 'diagnosticForward', event } });

      expect(reportDiagnosticEventMock).toHaveBeenCalledWith(event);
    });

    it('ignores messages that are not diagnosticForward type', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      handler?.({
        data: { type: 'someOtherMessage', payload: 'whatever' },
      });

      expect(reportDiagnosticEventMock).not.toHaveBeenCalled();
    });

    it('ignores non-object messages', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      handler?.({ data: 'raw string message' });
      handler?.({ data: null });
      handler?.({ data: 42 });

      expect(reportDiagnosticEventMock).not.toHaveBeenCalled();
    });

    it('ignores diagnosticForward messages without an event object', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      handler?.({
        data: { type: 'diagnosticForward', event: 'not an object' },
      });
      handler?.({ data: { type: 'diagnosticForward' } });

      expect(reportDiagnosticEventMock).not.toHaveBeenCalled();
    });

    it('does not throw when reportDiagnosticEvent throws', async () => {
      reportDiagnosticEventMock.mockImplementation(() => {
        throw new Error('unexpected reporter failure');
      });

      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      const event = makeDiagnosticEvent();

      expect(() => {
        handler?.({ data: { type: 'diagnosticForward', event } });
      }).not.toThrow();
    });

    it('does not include private data fields in forwarded events', async () => {
      const { useMainServiceClient } = await import('./useService');
      useMainServiceClient();

      const handler = getMessageHandler();
      const event = makeDiagnosticEvent({
        name: 'repositoryStorage.saveFailed',
        safeTags: {
          provider: 'webFileSystem',
          operation: 'repositorySave',
          failureClassification: 'storageFailure',
        },
        counters: { pendingCount: 1 },
      });

      handler?.({ data: { type: 'diagnosticForward', event } });

      const reportedEvent: DiagnosticEvent = reportDiagnosticEventMock.mock.calls[0]?.[0];
      const serialized = JSON.stringify(reportedEvent);
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('fileName');
      expect(serialized).not.toContain('docId');
      expect(serialized).not.toContain('storageKey');
    });
  });
});
