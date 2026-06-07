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
      step: 'writeStrategySelected',
      result: 'directCreateWriteProbe',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWriteWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWrite',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
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
        operation: 'writeStrategySelected',
        provider: 'webFileSystem',
        result: 'directCreateWriteProbe',
        step: 'writeStrategySelected',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'write strategy selected',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWriteWritableOpen',
        provider: 'webFileSystem',
        result: 'started',
        step: 'directCreateWriteWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'direct create write writable open started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWrite',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'directCreateWrite',
        writeStrategy: 'directCreateWriteProbe',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'direct create write failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(5, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(7, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(8, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(9, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(10, {
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

  it('adds safe breadcrumbs for read, stat, and directory boundary operations only', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileRead',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileRead',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileStat',
      result: 'succeeded',
    });
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
});
