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
        name: 'writeAccessRecovery.replayStillBlocked',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Blocked,
        classification: DiagnosticClassification.Access,
        counters: { flushedCount: 2, pendingCount: 3 },
        safeTags: { provider: 'webFileSystem', operation: 'flushPendingSaves' },
      });
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
        name: 'writeAccessRecovery.replayStorageFailure',
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

  it('both helpers attach only project-controlled safe tags', () => {
    reportWriteAccessReplayStillBlocked({ flushedCount: 0, pendingCount: 1 });
    reportWriteAccessReplayStorageFailure({ flushedCount: 1, pendingCount: 0 });

    for (const event of sink) {
      expect(event.safeTags?.provider).toBe('webFileSystem');
      expect(event.safeTags?.operation).toBe('flushPendingSaves');
      const serialized = JSON.stringify(event.safeTags);
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('path');
    }
  });
});
