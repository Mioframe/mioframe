import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  setDiagnosticEventSink,
} from '@shared/lib/diagnostics';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  reportWriteAccessMissingRequest,
  reportWriteAccessPermissionDenied,
  reportWriteAccessProviderFailure,
  reportWriteAccessReplayFailure,
  reportWriteAccessStaleResolve,
  reportWriteAccessStorageFailure,
} from './writeAccessRecoveryDiagnostics';

const TEST_ATTEMPT_ID = '00000000-0000-0000-0000-000000000001';

describe('writeAccessRecoveryDiagnostics', () => {
  let sink: DiagnosticEvent[];

  beforeEach(() => {
    sink = [];
    setDiagnosticEventSink(sink);
  });

  afterEach(() => {
    setDiagnosticEventSink(undefined);
  });

  describe('reportWriteAccessMissingRequest', () => {
    it('emits a warning with Stale result and Access classification', () => {
      reportWriteAccessMissingRequest({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.missingRequest',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Stale,
        classification: DiagnosticClassification.Access,
        attemptId: TEST_ATTEMPT_ID,
        safeTags: { provider: 'webFileSystem', operation: 'requestAccess' },
      });
    });

    it('does not include user-controlled values', () => {
      reportWriteAccessMissingRequest({ attemptId: TEST_ATTEMPT_ID });
      expect(JSON.stringify(sink[0])).not.toContain('spaceName');
      expect(JSON.stringify(sink[0])).not.toContain('path');
    });
  });

  describe('reportWriteAccessStaleResolve', () => {
    it('emits a warning with Stale result and resolveAccessRequest operation tag', () => {
      reportWriteAccessStaleResolve({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.staleResolve',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Stale,
        classification: DiagnosticClassification.Access,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
    });
  });

  describe('reportWriteAccessPermissionDenied', () => {
    it('emits a warning with Denied result and Access classification', () => {
      reportWriteAccessPermissionDenied({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.permissionDenied',
        severity: DiagnosticSeverity.Warning,
        result: DiagnosticResult.Denied,
        classification: DiagnosticClassification.Access,
        attemptId: TEST_ATTEMPT_ID,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
    });
  });

  describe('reportWriteAccessProviderFailure', () => {
    it('emits an error with Failed result and Provider classification', () => {
      const error = {
        errorClass: 'DOMException' as const,
        domExceptionName: 'NotAllowedError',
        errorClassification: 'accessDenied' as const,
      };

      reportWriteAccessProviderFailure({ attemptId: TEST_ATTEMPT_ID, error });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.providerFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Provider,
        attemptId: TEST_ATTEMPT_ID,
        error,
        safeTags: { provider: 'webFileSystem', operation: 'requestAccess' },
      });
    });

    it('does not include raw error message', () => {
      reportWriteAccessProviderFailure({
        attemptId: TEST_ATTEMPT_ID,
        error: { errorClass: 'Error', errorClassification: 'unknown' },
      });
      expect(JSON.stringify(sink[0])).not.toContain('message');
    });
  });

  describe('reportWriteAccessReplayFailure', () => {
    it('emits an error with Failed result, Storage classification, and replayStillBlocked name', () => {
      reportWriteAccessReplayFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.replayStillBlocked',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        attemptId: TEST_ATTEMPT_ID,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
    });
  });

  describe('reportWriteAccessStorageFailure', () => {
    it('emits an error with Failed result, Storage classification, and replayStorageFailure name', () => {
      reportWriteAccessStorageFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.replayStorageFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        attemptId: TEST_ATTEMPT_ID,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
    });
  });

  it('all wrapper functions attach only project-controlled safe tags (no user data)', () => {
    reportWriteAccessMissingRequest({ attemptId: TEST_ATTEMPT_ID });
    reportWriteAccessStaleResolve({ attemptId: TEST_ATTEMPT_ID });
    reportWriteAccessPermissionDenied({ attemptId: TEST_ATTEMPT_ID });
    reportWriteAccessReplayFailure({ attemptId: TEST_ATTEMPT_ID });
    reportWriteAccessStorageFailure({ attemptId: TEST_ATTEMPT_ID });

    for (const event of sink) {
      expect(event.safeTags?.provider).toBe('webFileSystem');
      expect(event.safeTags?.operation).toBeDefined();
      const serialized = JSON.stringify(event.safeTags);
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('path');
    }
  });
});
