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

  it('adds safe breadcrumbs for create re-lookup, cleanup, writable open, file write, and fresh retry milestones', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileHandleLookupAfterCreate',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'createdFileCleanup',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidModificationError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileWrite',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'QuotaExceededError',
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
        operation: 'lookupHandleAfterCreate',
        provider: 'webFileSystem',
        result: 'started',
        step: 'fileHandleLookupAfterCreate',
      },
      level: 'info',
      message: 'file handle lookup after create started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'cleanupCreatedFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'createdFileCleanup',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidModificationError',
      },
      level: 'warning',
      message: 'created file cleanup failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.write',
      data: {
        operation: 'openWritable',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'writableOpen',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'writable open failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(5, {
      category: 'webFileSystem.write',
      data: {
        operation: 'writeFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'fileWrite',
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
      },
      level: 'warning',
      message: 'file write failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
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
