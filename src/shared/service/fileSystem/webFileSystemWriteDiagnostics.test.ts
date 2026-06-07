import { addTechnicalBreadcrumb, reportDiagnosticEvent } from '@shared/lib/diagnostics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addWebFileSystemWriteRetryFailedBreadcrumb,
  addWebFileSystemWriteRetryStartedBreadcrumb,
  addWebFileSystemWriteRetrySucceededBreadcrumb,
  reportWebFileSystemWriteRetrySucceededForPreview,
} from './webFileSystemWriteDiagnostics';

vi.mock('@shared/config', () => ({
  DIAGNOSTICS_MODE: 'preview',
}));

vi.mock('@shared/lib/diagnostics', () => ({
  addTechnicalBreadcrumb: vi.fn(),
  reportDiagnosticEvent: vi.fn(),
  DiagnosticClassification: { Storage: 'storage' },
  DiagnosticResult: { Success: 'success' },
  DiagnosticSeverity: { Info: 'info' },
}));

describe('webFileSystemWriteDiagnostics', () => {
  beforeEach(() => {
    vi.mocked(reportDiagnosticEvent).mockReset();
    vi.mocked(addTechnicalBreadcrumb).mockReset();
  });

  it('adds retry started and succeeded breadcrumbs with safe write metadata', () => {
    addWebFileSystemWriteRetryStartedBreadcrumb({
      retryKind: 'freshHandle',
      writePhase: 'createWritableStarted',
    });
    addWebFileSystemWriteRetrySucceededBreadcrumb({
      retryKind: 'rootHandleRefresh',
      writePhase: 'createWritableStarted',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'writeAccessRecovery',
      data: {
        operation: 'webFileSystemFreshHandleRetry',
        provider: 'webFileSystem',
        retryAttempted: 'true',
        retryResult: 'started',
        writePhase: 'createWritableStarted',
      },
      level: 'info',
      message: 'web file write retry started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'writeAccessRecovery',
      data: {
        operation: 'webFileSystemWrite',
        provider: 'webFileSystem',
        retryAttempted: 'true',
        retryResult: 'succeeded',
        writePhase: 'createWritableStarted',
      },
      level: 'info',
      message: 'web file write retry succeeded',
    });
  });

  it('adds retry failed breadcrumb with sanitized error summary', () => {
    addWebFileSystemWriteRetryFailedBreadcrumb({
      retryKind: 'freshHandle',
      writePhase: 'createWritableStarted',
      error: {
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
        errorClassification: 'unknown',
      },
    });

    expect(addTechnicalBreadcrumb).toHaveBeenCalledWith({
      category: 'writeAccessRecovery',
      data: {
        operation: 'webFileSystemFreshHandleRetry',
        provider: 'webFileSystem',
        retryAttempted: 'true',
        retryResult: 'failed',
        writePhase: 'createWritableStarted',
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
        errorClassification: 'unknown',
      },
      level: 'warning',
      message: 'web file write retry failed',
    });
  });

  it('emits a preview-only diagnostic event for a successful retry', () => {
    reportWebFileSystemWriteRetrySucceededForPreview({
      retryKind: 'freshHandle',
      writePhase: 'createWritableStarted',
    });

    expect(reportDiagnosticEvent).toHaveBeenCalledWith({
      name: 'writeAccessRecovery.webFileWriteRetrySucceeded',
      severity: 'info',
      result: 'success',
      classification: 'storage',
      error: {
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
        retryAttempted: 'true',
        retryResult: 'succeeded',
        writePhase: 'createWritableStarted',
      },
      safeTags: {
        operation: 'webFileSystemFreshHandleRetry',
        provider: 'webFileSystem',
      },
    });
  });
});
