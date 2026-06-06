import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import { describe, expect, it, vi } from 'vitest';
import {
  addWebFileSystemWriteRetryFailedBreadcrumb,
  addWebFileSystemWriteRetryStartedBreadcrumb,
  addWebFileSystemWriteRetrySucceededBreadcrumb,
} from './webFileSystemWriteDiagnostics';

vi.mock('@shared/lib/diagnostics', () => ({
  addTechnicalBreadcrumb: vi.fn(),
}));

describe('webFileSystemWriteDiagnostics', () => {
  it('adds retry started and succeeded breadcrumbs with safe write metadata', () => {
    addWebFileSystemWriteRetryStartedBreadcrumb({ writePhase: 'createWritable' });
    addWebFileSystemWriteRetrySucceededBreadcrumb({ writePhase: 'createWritable' });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'writeAccessRecovery',
      data: {
        operation: 'webFileSystemWrite',
        provider: 'webFileSystem',
        retryAttempted: 'true',
        retryResult: 'started',
        writePhase: 'createWritable',
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
        writePhase: 'createWritable',
      },
      level: 'info',
      message: 'web file write retry succeeded',
    });
  });

  it('adds retry failed breadcrumb with sanitized error summary', () => {
    addWebFileSystemWriteRetryFailedBreadcrumb({
      writePhase: 'createWritable',
      error: {
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
        errorClassification: 'unknown',
      },
    });

    expect(addTechnicalBreadcrumb).toHaveBeenCalledWith({
      category: 'writeAccessRecovery',
      data: {
        operation: 'webFileSystemWrite',
        provider: 'webFileSystem',
        retryAttempted: 'true',
        retryResult: 'failed',
        writePhase: 'createWritable',
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
        errorClassification: 'unknown',
      },
      level: 'warning',
      message: 'web file write retry failed',
    });
  });
});
