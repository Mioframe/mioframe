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
      step: 'writableOpen',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'freshHandleRetry',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.write',
      data: {
        operation: 'openWritable',
        provider: 'webFileSystem',
        result: 'started',
        step: 'writableOpen',
      },
      level: 'info',
      message: 'writable open started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'freshHandleRetry',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'freshHandleRetry',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'fresh handle retry failed',
    });
  });

  it('drops milestones that should not become breadcrumbs', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'parentDirectoryLookup',
      result: 'started',
    });

    expect(addTechnicalBreadcrumb).not.toHaveBeenCalled();
  });
});
