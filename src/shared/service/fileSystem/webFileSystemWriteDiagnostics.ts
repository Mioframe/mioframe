import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import type {
  WebFileSystemWriteDiagnosticSummary,
  WebFileSystemWritePhase,
} from '@shared/lib/webFileSystemProvider/webFileSystemWriteDiagnosticSummary';

type WebFileSystemWriteRetryResult = 'failed' | 'started' | 'succeeded';

const addWebFileWriteRetryBreadcrumb = ({
  error,
  result,
  writePhase,
}: {
  error?: WebFileSystemWriteDiagnosticSummary | undefined;
  result: WebFileSystemWriteRetryResult;
  writePhase: WebFileSystemWritePhase;
}): void => {
  addTechnicalBreadcrumb({
    category: 'writeAccessRecovery',
    data: {
      operation: 'webFileSystemWrite',
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
  writePhase: WebFileSystemWritePhase;
}): void => {
  addWebFileWriteRetryBreadcrumb({ result: 'started', ...params });
};

/**
 * Adds a breadcrumb when a bounded fresh-handle retry succeeds.
 * @param params - Safe phase data for the retry.
 */
export const addWebFileSystemWriteRetrySucceededBreadcrumb = (params: {
  writePhase: WebFileSystemWritePhase;
}): void => {
  addWebFileWriteRetryBreadcrumb({ result: 'succeeded', ...params });
};

/**
 * Adds a breadcrumb when a bounded fresh-handle retry fails.
 * @param params - Safe phase and error summary for the retry failure.
 */
export const addWebFileSystemWriteRetryFailedBreadcrumb = (params: {
  error: WebFileSystemWriteDiagnosticSummary;
  writePhase: WebFileSystemWritePhase;
}): void => {
  addWebFileWriteRetryBreadcrumb({ result: 'failed', ...params });
};
