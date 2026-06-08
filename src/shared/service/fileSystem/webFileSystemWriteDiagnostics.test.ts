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

  it('adds safe breadcrumbs for file handle create, lookup-after-create, cleanup, writable open, file write, and fresh retry', () => {
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
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'writableOpen', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableCompatibilityOpen',
      result: 'succeeded',
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
        operation: 'openWritableCompatibility',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'writableCompatibilityOpen',
      },
      level: 'info',
      message: 'writable compatibility open succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(7, {
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
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'parentDirectoryLookup', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'unknownStep', result: 'succeeded' });

    expect(addTechnicalBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds safe breadcrumbs for read, stat, and directory boundary operations only', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileRead', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileRead',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileStat', result: 'succeeded' });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directoryRead',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'NotAllowedError',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.read',
      data: {
        operation: 'readFile',
        provider: 'webFileSystem',
        result: 'started',
        step: 'fileRead',
      },
      level: 'info',
      message: 'file read started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.read',
      data: {
        operation: 'readFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'fileRead',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'file read failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.stat',
      data: {
        operation: 'statFileHandle',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'fileStat',
      },
      level: 'info',
      message: 'file stat succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.directory',
      data: {
        operation: 'readDirectory',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'directoryRead',
        errorClass: 'DOMException',
        domExceptionName: 'NotAllowedError',
      },
      level: 'warning',
      message: 'directory read failed',
    });
  });

  it('breadcrumb data contains only allowed fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    const allowedKeys = new Set([
      'operation',
      'provider',
      'result',
      'step',
      'errorClass',
      'domExceptionName',
    ]);
    for (const key of Object.keys(data)) {
      expect(allowedKeys).toContain(key);
    }
  });

  it('non-write breadcrumbs do not include probe or filename fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileRead', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileStat', result: 'succeeded' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'directoryRead', result: 'started' });

    for (const call of vi.mocked(addTechnicalBreadcrumb).mock.calls) {
      expect(call[0].data).not.toHaveProperty('writeStrategy');
      expect(call[0].data).not.toHaveProperty('probeFileName');
      expect(call[0].data).not.toHaveProperty('targetFileName');
    }
  });

  it('fileLookup breadcrumbs are emitted for started, missing, and succeeded', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'missing' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'succeeded' });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledTimes(3);
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'file lookup started' }),
    );
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'file lookup missing' }),
    );
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ message: 'file lookup succeeded' }),
    );
  });
});
