import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
} from '@shared/lib/diagnostics';
import { setDiagnosticEventSink } from '@shared/lib/diagnostics/diagnosticsTestUtils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  reportWriteAccessReplayStillBlocked,
  reportWriteAccessReplayStorageFailure,
  reportRepositorySaveQueued,
  reportRepositorySaveFailed,
} from './repositoriesDiagnostics';

const addTechnicalBreadcrumbMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    addTechnicalBreadcrumb: addTechnicalBreadcrumbMock,
  };
});

describe('repositoriesDiagnostics', () => {
  let sink: DiagnosticEvent[];

  beforeEach(() => {
    sink = [];
    addTechnicalBreadcrumbMock.mockReset();
    setDiagnosticEventSink(sink);
  });

  afterEach(() => {
    setDiagnosticEventSink(undefined);
  });

  describe('reportWriteAccessReplayStillBlocked', () => {
    it('emits replayStillBlocked with Blocked result and Access classification', () => {
      reportWriteAccessReplayStillBlocked({ flushedCount: 2, pendingCount: 3 });

      expect(sink).toHaveLength(1);
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
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
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
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

    it('maps browserFileStateChanged failureClassification to Storage classification', () => {
      reportWriteAccessReplayStorageFailure({
        flushedCount: 0,
        pendingCount: 1,
        failureClassification: 'browserFileStateChanged',
      });

      expect(sink[0]).toMatchObject({
        classification: DiagnosticClassification.Storage,
        safeTags: {
          failureClassification: 'browserFileStateChanged',
        },
      });
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
      reportRepositorySaveFailed({ pendingCount: 0 });

      expect(sink).toHaveLength(1);
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
      expect(sink[0]).toMatchObject({
        name: 'repositoryStorage.saveFailed',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        counters: { pendingCount: 0 },
        safeTags: { provider: 'webFileSystem', operation: 'repositorySave' },
      });
    });

    it('defaults failureClassification to storageFailure when not provided', () => {
      reportRepositorySaveFailed({ pendingCount: 0 });

      expect(sink[0]?.safeTags?.failureClassification).toBe('storageFailure');
    });

    it('uses provided failureClassification in safeTags', () => {
      reportRepositorySaveFailed({
        pendingCount: 0,
        failureClassification: 'browserFileStateChanged',
      });

      expect(sink[0]?.safeTags?.failureClassification).toBe('browserFileStateChanged');
    });

    it('does not include an error field in the event', () => {
      reportRepositorySaveFailed({ pendingCount: 0 });
      expect(sink[0]).not.toHaveProperty('error');
    });

    it('does not include user-controlled values in the event', () => {
      reportRepositorySaveFailed({ pendingCount: 0 });
      const serialized = JSON.stringify(sink[0]);
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('docId');
    });
  });

  it('all helpers attach only project-controlled safe tags', () => {
    reportWriteAccessReplayStillBlocked({ flushedCount: 0, pendingCount: 1 });
    reportWriteAccessReplayStorageFailure({ flushedCount: 1, pendingCount: 0 });
    reportRepositorySaveQueued({ pendingCount: 1 });
    reportRepositorySaveFailed({ pendingCount: 0 });

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
