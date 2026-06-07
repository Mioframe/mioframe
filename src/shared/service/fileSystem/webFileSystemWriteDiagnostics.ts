import { DIAGNOSTICS_MODE } from '@shared/config';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  addTechnicalBreadcrumb,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
import type {
  WebFileSystemWriteDiagnosticSummary,
  WebFileSystemWritePhase,
} from '@shared/lib/webFileSystemProvider/webFileSystemWriteDiagnosticSummary';

type WebFileSystemWriteRetryResult = 'failed' | 'started' | 'succeeded';
type WebFileSystemWriteRetryKind = 'freshHandle' | 'rootHandleRefresh';

const addWebFileWriteRetryBreadcrumb = ({
  error,
  result,
  retryKind,
  writePhase,
}: {
  error?: WebFileSystemWriteDiagnosticSummary | undefined;
  result: WebFileSystemWriteRetryResult;
  retryKind: WebFileSystemWriteRetryKind;
  writePhase: WebFileSystemWritePhase;
}): void => {
  addTechnicalBreadcrumb({
    category: 'writeAccessRecovery',
    data: {
      operation:
        retryKind === 'freshHandle' ? 'webFileSystemFreshHandleRetry' : 'webFileSystemWrite',
      provider: 'webFileSystem',
      writePhase,
      retryAttempted: 'true',
      retryResult: result,
      ...(error?.errorClass !== undefined ? { errorClass: error.errorClass } : {}),
      ...(error?.domExceptionName !== undefined
        ? { domExceptionName: error.domExceptionName }
        : {}),
      ...(error?.errorClassification !== undefined
        ? { errorClassification: error.errorClassification }
        : {}),
    },
    level: result === 'failed' ? 'warning' : 'info',
    message:
      result === 'started'
        ? 'web file write retry started'
        : result === 'succeeded'
          ? 'web file write retry succeeded'
          : 'web file write retry failed',
  });
};

/**
 * Adds a breadcrumb when a bounded fresh-handle retry starts.
 * @param params - Safe phase data for the retry.
 */
export const addWebFileSystemWriteRetryStartedBreadcrumb = (params: {
  retryKind: WebFileSystemWriteRetryKind;
  writePhase: WebFileSystemWritePhase;
}): void => {
  addWebFileWriteRetryBreadcrumb({ result: 'started', ...params });
};

/**
 * Adds a breadcrumb when a bounded fresh-handle retry succeeds.
 * @param params - Safe phase data for the retry.
 */
export const addWebFileSystemWriteRetrySucceededBreadcrumb = (params: {
  retryKind: WebFileSystemWriteRetryKind;
  writePhase: WebFileSystemWritePhase;
}): void => {
  addWebFileWriteRetryBreadcrumb({ result: 'succeeded', ...params });
};

/**
 * Emits a preview-only structured event for a successful bounded InvalidStateError retry.
 * Production keeps success visibility at breadcrumb level only.
 * @param params - Safe write phase for the successful retry.
 */
export const reportWebFileSystemWriteRetrySucceededForPreview = (params: {
  retryKind: WebFileSystemWriteRetryKind;
  writePhase: WebFileSystemWritePhase;
}): void => {
  if (DIAGNOSTICS_MODE !== 'preview') {
    return;
  }

  reportDiagnosticEvent({
    name: 'writeAccessRecovery.webFileWriteRetrySucceeded',
    severity: DiagnosticSeverity.Info,
    result: DiagnosticResult.Success,
    classification: DiagnosticClassification.Storage,
    error: {
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
      errorClassification: 'browserFileStateChanged',
      retryAttempted: 'true',
      retryResult: 'succeeded',
      writePhase: params.writePhase,
    },
    safeTags: {
      operation:
        params.retryKind === 'freshHandle' ? 'webFileSystemFreshHandleRetry' : 'webFileSystemWrite',
      provider: 'webFileSystem',
    },
  });
};

/**
 * Adds a breadcrumb when a bounded fresh-handle retry fails.
 * @param params - Safe phase and error summary for the retry failure.
 */
export const addWebFileSystemWriteRetryFailedBreadcrumb = (params: {
  error: WebFileSystemWriteDiagnosticSummary;
  retryKind: WebFileSystemWriteRetryKind;
  writePhase: WebFileSystemWritePhase;
}): void => {
  addWebFileWriteRetryBreadcrumb({ result: 'failed', ...params });
};
