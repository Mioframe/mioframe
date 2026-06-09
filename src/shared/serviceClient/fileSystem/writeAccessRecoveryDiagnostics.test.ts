import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
} from '@shared/lib/diagnostics';
import { setDiagnosticEventSink } from '@shared/lib/diagnostics/diagnosticsTestUtils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addWriteAccessPermissionPromptStartBreadcrumb,
  addWriteAccessPermissionResolvedBreadcrumb,
  addWriteAccessRequestStartBreadcrumb,
  reportWriteAccessMissingRequest,
  reportWriteAccessPermissionDenied,
  reportWriteAccessProviderFailure,
  reportWriteAccessReplayFailure,
  reportWriteAccessStaleResolve,
  reportWriteAccessStorageFailure,
} from './writeAccessRecoveryDiagnostics';

const TEST_ATTEMPT_ID = '00000000-0000-0000-0000-000000000001';
const addTechnicalBreadcrumbMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    addTechnicalBreadcrumb: addTechnicalBreadcrumbMock,
  };
});

describe('writeAccessRecoveryDiagnostics', () => {
  let sink: DiagnosticEvent[];

  beforeEach(() => {
    sink = [];
    addTechnicalBreadcrumbMock.mockReset();
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
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
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

  describe('technical breadcrumbs', () => {
    it('adds request start and permission prompt breadcrumbs', () => {
      addWriteAccessRequestStartBreadcrumb();
      addWriteAccessPermissionPromptStartBreadcrumb();
      addWriteAccessPermissionResolvedBreadcrumb({ permissionState: 'denied' });

      expect(addTechnicalBreadcrumbMock).toHaveBeenNthCalledWith(1, {
        category: 'writeAccess.recovery',
        data: {
          operation: 'requestAccess',
          provider: 'webFileSystem',
        },
        level: 'info',
        message: 'write access recovery started',
      });
      expect(addTechnicalBreadcrumbMock).toHaveBeenNthCalledWith(2, {
        category: 'webFileSystem.permission',
        data: {
          operation: 'requestPermission',
          provider: 'webFileSystem',
        },
        message: 'write permission prompt started',
      });
      expect(addTechnicalBreadcrumbMock).toHaveBeenNthCalledWith(3, {
        category: 'webFileSystem.permission',
        data: {
          operation: 'requestPermission',
          provider: 'webFileSystem',
          result: 'denied',
        },
        level: 'warning',
        message: 'write permission prompt resolved: denied',
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
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
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
    it('emits an error with Blocked result, Access classification, and grantReplayStillBlocked name', () => {
      reportWriteAccessReplayFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.grantReplayStillBlocked',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Blocked,
        classification: DiagnosticClassification.Access,
        attemptId: TEST_ATTEMPT_ID,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
    });

    it('includes replay counters when a replay summary is provided', () => {
      reportWriteAccessReplayFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 2, pendingCount: 3, failureClassification: 'accessRequired' },
      });

      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.grantReplayStillBlocked',
        counters: { flushedCount: 2, pendingCount: 3 },
      });
    });

    it('emits without counters when no replay summary is provided', () => {
      reportWriteAccessReplayFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink[0]?.counters).toBeUndefined();
    });

    it('includes exact failureClassification in safeTags when replay is provided', () => {
      reportWriteAccessReplayFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 2, pendingCount: 3, failureClassification: 'accessRequired' },
      });

      expect(sink[0]?.safeTags?.failureClassification).toBe('accessRequired');
    });

    it('includes unknown failureClassification in safeTags when no replay is provided', () => {
      reportWriteAccessReplayFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink[0]?.safeTags?.failureClassification).toBe('unknown');
    });

    it('does not include space name, path, or raw error in counters', () => {
      reportWriteAccessReplayFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 1, pendingCount: 2, failureClassification: 'accessRequired' },
      });

      const serialized = JSON.stringify(sink[0]);
      expect(serialized).not.toContain('Work');
      expect(serialized).not.toContain('path');
      expect(serialized).not.toContain('spaceName');
    });
  });

  describe('reportWriteAccessStorageFailure', () => {
    it('emits an error with Failed result, Storage classification, and grantReplayStorageFailure name', () => {
      reportWriteAccessStorageFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink).toHaveLength(1);
      expect(addTechnicalBreadcrumbMock).not.toHaveBeenCalled();
      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.grantReplayStorageFailure',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Storage,
        attemptId: TEST_ATTEMPT_ID,
        safeTags: { provider: 'webFileSystem', operation: 'resolveAccessRequest' },
      });
    });

    it('includes replay counters when a replay summary is provided', () => {
      reportWriteAccessStorageFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 0, pendingCount: 1, failureClassification: 'storageFailure' },
      });

      expect(sink[0]).toMatchObject({
        name: 'writeAccessRecovery.grantReplayStorageFailure',
        counters: { flushedCount: 0, pendingCount: 1 },
      });
    });

    it('maps accessRequired classification to Access classification in Sentry event', () => {
      reportWriteAccessStorageFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 0, pendingCount: 1, failureClassification: 'accessRequired' },
      });

      expect(sink[0]).toMatchObject({ classification: DiagnosticClassification.Access });
    });

    it('maps unknown classification to Unknown classification in Sentry event', () => {
      reportWriteAccessStorageFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 0, pendingCount: 1, failureClassification: 'unknown' },
      });

      expect(sink[0]).toMatchObject({ classification: DiagnosticClassification.Unknown });
    });

    it('defaults to Storage classification when no replay summary provided', () => {
      reportWriteAccessStorageFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink[0]).toMatchObject({ classification: DiagnosticClassification.Storage });
    });

    it('emits without counters when no replay summary is provided', () => {
      reportWriteAccessStorageFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink[0]?.counters).toBeUndefined();
    });

    it('includes exact failureClassification in safeTags when replay is provided', () => {
      reportWriteAccessStorageFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: { flushedCount: 0, pendingCount: 1, failureClassification: 'storageFailure' },
      });

      expect(sink[0]?.safeTags?.failureClassification).toBe('storageFailure');
    });

    it('keeps browserFileStateChanged as the main-side replay failure classification', () => {
      reportWriteAccessStorageFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: {
          flushedCount: 0,
          pendingCount: 1,
          failureClassification: 'browserFileStateChanged',
        },
      });

      expect(sink[0]).toMatchObject({
        classification: DiagnosticClassification.Storage,
        safeTags: {
          provider: 'webFileSystem',
          operation: 'resolveAccessRequest',
          failureClassification: 'browserFileStateChanged',
        },
      });
    });

    it('includes compact sanitized error when replay provides one', () => {
      reportWriteAccessStorageFailure({
        attemptId: TEST_ATTEMPT_ID,
        replay: {
          flushedCount: 0,
          pendingCount: 1,
          failureClassification: 'browserFileStateChanged',
          error: {
            errorClass: 'DOMException',
            domExceptionName: 'InvalidStateError',
            errorClassification: 'browserFileStateChanged',
          },
        },
      });

      expect(sink[0]?.error).toMatchObject({
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
      });
    });

    it('includes unknown failureClassification in safeTags when no replay is provided', () => {
      reportWriteAccessStorageFailure({ attemptId: TEST_ATTEMPT_ID });

      expect(sink[0]?.safeTags?.failureClassification).toBe('unknown');
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
