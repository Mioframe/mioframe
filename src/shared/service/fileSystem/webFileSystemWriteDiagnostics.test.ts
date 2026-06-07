import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addWebFileSystemDiagnosticStepBreadcrumb } from './webFileSystemWriteDiagnostics';

vi.mock('@shared/lib/diagnostics', () => ({
  addTechnicalBreadcrumb: vi.fn(),
}));

describe('webFileSystemWriteDiagnostics', () => {
  beforeEach(() => {
    vi.mocked(addTechnicalBreadcrumb).mockReset();
  });

  it('adds safe breadcrumbs for writable open and fresh retry milestones', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'createWritable',
      result: 'attempted',
      writePhase: 'createWritableStarted',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'freshHandleRetry',
      result: 'failed',
      retryKind: 'freshHandle',
      writePhase: 'createWritableStarted',
      error: {
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
      },
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'writeAccessRecovery',
      data: {
        operation: 'openWritable',
        provider: 'webFileSystem',
        result: 'attempted',
        step: 'createWritable',
        writePhase: 'createWritableStarted',
      },
      level: 'info',
      message: 'writable open attempted',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'writeAccessRecovery',
      data: {
        operation: 'freshHandleRetry',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'freshHandleRetry',
        writePhase: 'createWritableStarted',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
      },
      level: 'warning',
      message: 'fresh handle retry failed',
    });
  });

  it('drops milestones that should not become breadcrumbs', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'lookupParentDirectory',
      result: 'started',
    });

    expect(addTechnicalBreadcrumb).not.toHaveBeenCalled();
  });
});
