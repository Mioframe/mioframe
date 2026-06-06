import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  setDiagnosticEventSink,
} from '@shared/lib/diagnostics';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  reportWriteAccessReplayStillBlocked,
  reportWriteAccessReplayStorageFailure,
  reportRepositorySaveQueued,
  reportRepositorySaveFailed,
} from './repositoriesDiagnostics';

describe('repositoriesDiagnostics', () => {
  let sink: DiagnosticEvent[];

  beforeEach(() => {
    sink = [];
    setDiagnosticEventSink(sink);
  });

  afterEach(() => {
    setDiagnosticEventSink(undefined);
  });

  describe('reportWriteAccessReplayStillBlocked', () => {
    it('emits replayStillBlocked with Blocked result and Access classification', () => {
      reportWriteAccessReplayStillBlocked({ flushedCount: 2, pendingCount: 3 });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.repositoryReplayStillBlocked',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Blocked,
        classification: DiagnosticClassification.Access,
        counters: { flushedCount: 2, pendingCount: 3 },
        safeTags: { provider: 'webFileSystem', operation: 'flushPendingSaves' },
      });
    });

    it('includes failureClassification: accessRequired in safeTags', () => {
      reportWriteAccessReplayStillBlocked({ flushedCount: 0, pendingCount: 1 });

      expect(sink[0]?.safeTags?.failureClassification).toBe('accessRequired');
    });

    it('does not include user-controlled values', () => {
      reportWriteAccessReplayStillBlocked({ flushedCount: 0, pendingCount: 1 });
      const serialized = JSON.stringify(sink[0]);
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('Work');
    });
  });

  describe('reportWriteAccessReplayStorageFailure', () => {
    it('emits replayStorageFailure with Failed result and Storage classification when storageFailure', () => {
      reportWriteAccessReplayStorageFailure({
        flushedCount: 1,
        pendingCount: 2,
        failureClassification: 'storageFailure',
      });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.repositoryReplayStorageFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        counters: { flushedCount: 1, pendingCount: 2 },
        safeTags: { provider: 'webFileSystem', operation: 'flushPendingSaves' },
      });
    });

    it('maps accessRequired failureClassification to Access classification', () => {
      reportWriteAccessReplayStorageFailure({
        flushedCount: 0,
        pendingCount: 1,
        failureClassification: 'accessRequired',
      });

      expect(sink[0]).toMatchObject({ classification: DiagnosticClassification.Access });
    });

    it('maps unknown failureClassification to Unknown classification', () => {
      reportWriteAccessReplayStorageFailure({
        flushedCount: 0,
        pendingCount: 1,
        failureClassification: 'unknown',
      });

      expect(sink[0]).toMatchObject({ classification: DiagnosticClassification.Unknown });
    });

    it('maps undefined failureClassification to Unknown classification', () => {
      reportWriteAccessReplayStorageFailure({ flushedCount: 0, pendingCount: 1 });

      expect(sink[0]).toMatchObject({ classification: DiagnosticClassification.Unknown });
    });

    it('includes exact failureClassification in safeTags', () => {
      reportWriteAccessReplayStorageFailure({
        flushedCount: 0,
        pendingCount: 1,
        failureClassification: 'storageFailure',
      });

      expect(sink[0]?.safeTags?.failureClassification).toBe('storageFailure');
    });

    it('includes unknown failureClassification in safeTags when undefined', () => {
      reportWriteAccessReplayStorageFailure({ flushedCount: 0, pendingCount: 1 });

      expect(sink[0]?.safeTags?.failureClassification).toBe('unknown');
    });

    it('does not include user-controlled values', () => {
      reportWriteAccessReplayStorageFailure({
        flushedCount: 0,
        pendingCount: 1,
        failureClassification: 'storageFailure',
      });
      const serialized = JSON.stringify(sink[0]);
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('Work');
    });
  });

  describe('reportRepositorySaveQueued', () => {
    it('emits saveQueued with Warning severity, Blocked result, and Access classification', () => {
      reportRepositorySaveQueued({ pendingCount: 2 });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'repositoryStorage.saveQueued',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Blocked,
        classification: DiagnosticClassification.Access,
        counters: { pendingCount: 2 },
        safeTags: { provider: 'webFileSystem', operation: 'repositorySave' },
      });
    });

    it('includes failureClassification: accessRequired in safeTags', () => {
      reportRepositorySaveQueued({ pendingCount: 1 });

      expect(sink[0]?.safeTags?.failureClassification).toBe('accessRequired');
    });

    it('does not include user-controlled values', () => {
      reportRepositorySaveQueued({ pendingCount: 1 });
      const serialized = JSON.stringify(sink[0]);
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('docId');
    });
  });

  describe('reportRepositorySaveFailed', () => {
    it('emits saveFailed with Error severity, Failed result, and Storage classification', () => {
      reportRepositorySaveFailed({ pendingCount: 0, caughtError: new Error('disk full') });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'repositoryStorage.saveFailed',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        counters: { pendingCount: 0 },
        safeTags: { provider: 'webFileSystem', operation: 'repositorySave' },
      });
    });

    it('includes failureClassification: storageFailure in safeTags', () => {
      reportRepositorySaveFailed({ pendingCount: 0, caughtError: new Error('disk full') });

      expect(sink[0]?.safeTags?.failureClassification).toBe('storageFailure');
    });

    it('includes sanitized error summary in the event', () => {
      const error = new DOMException('disk full', 'QuotaExceededError');
      reportRepositorySaveFailed({ pendingCount: 2, caughtError: error });

      expect(sink[0]?.error).toMatchObject({
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
        errorClassification: expect.any(String),
      });
    });

    it('does not include raw error message or user-controlled values in the event', () => {
      const error = new Error('path=/user/secret/doc.md quota exceeded');
      reportRepositorySaveFailed({ pendingCount: 0, caughtError: error });
      const serialized = JSON.stringify(sink[0]);
      expect(serialized).not.toContain('/user/secret');
      expect(serialized).not.toContain('quota exceeded');
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('docId');
    });

    it('includes errorClass in the error summary', () => {
      reportRepositorySaveFailed({ pendingCount: 0, caughtError: new Error('boom') });

      expect(sink[0]?.error?.errorClass).toBe('Error');
    });
  });

  it('all helpers attach only project-controlled safe tags', () => {
    reportWriteAccessReplayStillBlocked({ flushedCount: 0, pendingCount: 1 });
    reportWriteAccessReplayStorageFailure({ flushedCount: 1, pendingCount: 0 });
    reportRepositorySaveQueued({ pendingCount: 1 });
    reportRepositorySaveFailed({ pendingCount: 0, caughtError: new Error('boom') });

    for (const event of sink) {
      expect(event.safeTags?.provider).toBe('webFileSystem');
      expect(event.safeTags?.operation).toBeDefined();
      expect(event.safeTags?.failureClassification).toBeDefined();
      const serialized = JSON.stringify(event.safeTags);
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('path');
    }
  });
});
