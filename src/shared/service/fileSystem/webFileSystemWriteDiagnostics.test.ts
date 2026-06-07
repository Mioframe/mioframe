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

  it('adds safe breadcrumbs for ASCII write probe success path', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbe',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeWritableOpen',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeWrite',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeClose',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbe',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeCleanup',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeCleanup',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbe',
        provider: 'webFileSystem',
        result: 'started',
        step: 'asciiWriteProbe',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbe started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeWritableOpen',
        provider: 'webFileSystem',
        result: 'started',
        step: 'asciiWriteProbeWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbeWritableOpen started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeWritableOpen',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'asciiWriteProbeWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbeWritableOpen succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeWrite',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'asciiWriteProbeWrite',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbeWrite succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(5, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeClose',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'asciiWriteProbeClose',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbeClose succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbe',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'asciiWriteProbe',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbe succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(7, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeCleanup',
        provider: 'webFileSystem',
        result: 'started',
        step: 'asciiWriteProbeCleanup',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbeCleanup started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(8, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeCleanup',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'asciiWriteProbeCleanup',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'asciiWriteProbeCleanup succeeded',
    });
  });

  it('adds safe breadcrumbs for ASCII write probe writable-open failure path', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbe',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeWritableOpen',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbe',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeCleanup',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbeCleanup',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      errorClass: 'DOMException',
      domExceptionName: 'NotFoundError',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeWritableOpen',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'asciiWriteProbeWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'asciiWriteProbeWritableOpen failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbe',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'asciiWriteProbe',
        writeStrategy: 'directCreateWriteProbe',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'asciiWriteProbe failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
      category: 'webFileSystem.write',
      data: {
        operation: 'asciiWriteProbeCleanup',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'asciiWriteProbeCleanup',
        writeStrategy: 'directCreateWriteProbe',
        errorClass: 'DOMException',
        domExceptionName: 'NotFoundError',
      },
      level: 'warning',
      message: 'asciiWriteProbeCleanup failed',
    });
  });

  it('breadcrumb data for probe steps contains only allowed fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'asciiWriteProbe',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
    });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    const allowedKeys = new Set([
      'operation',
      'provider',
      'result',
      'step',
      'writeStrategy',
      'errorClass',
      'domExceptionName',
    ]);
    for (const key of Object.keys(data)) {
      expect(allowedKeys).toContain(key);
    }
  });
});
