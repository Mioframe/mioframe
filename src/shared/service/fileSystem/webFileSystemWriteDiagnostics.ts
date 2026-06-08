import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';

const operationByStep: Record<string, string> = {
  createdFileCleanup: 'cleanupCreatedFile',
  directoryRead: 'readDirectory',
  fileHandleCreate: 'createFileHandle',
  fileHandleLookupAfterCreate: 'lookupHandleAfterCreate',
  fileRead: 'readFile',
  fileStat: 'statFileHandle',
  fileWrite: 'writeFile',
  freshHandleRetry: 'freshHandleRetry',
  fileLookup: 'lookupExistingHandle',
  parentDirectoryLookup: 'lookupParentDirectory',
  writableCompatibilityOpen: 'openWritableCompatibility',
  writableOpen: 'openWritable',
};

const messageByStepResult: Record<
  string,
  Partial<Record<WebFileSystemDiagnosticStep['result'], string>>
> = {
  fileHandleCreate: {
    failed: 'file handle create failed',
    started: 'file handle create started',
    succeeded: 'file handle create succeeded',
  },
  fileHandleLookupAfterCreate: {
    failed: 'file handle lookup after create failed',
    started: 'file handle lookup after create started',
    succeeded: 'file handle lookup after create succeeded',
  },
  fileWrite: {
    failed: 'file write failed',
  },
  fileRead: {
    failed: 'file read failed',
    started: 'file read started',
    succeeded: 'file read succeeded',
  },
  fileStat: {
    failed: 'file stat failed',
    started: 'file stat started',
    succeeded: 'file stat succeeded',
  },
  createdFileCleanup: {
    failed: 'created file cleanup failed',
    started: 'created file cleanup started',
    succeeded: 'created file cleanup succeeded',
  },
  directoryRead: {
    failed: 'directory read failed',
    started: 'directory read started',
    succeeded: 'directory read succeeded',
  },
  writableOpen: {
    failed: 'writable open failed',
    started: 'writable open started',
    succeeded: 'writable open succeeded',
  },
  writableCompatibilityOpen: {
    failed: 'writable compatibility open failed',
    started: 'writable compatibility open started',
    succeeded: 'writable compatibility open succeeded',
  },
  freshHandleRetry: {
    failed: 'fresh handle retry failed',
    started: 'fresh handle retry started',
    succeeded: 'fresh handle retry succeeded',
  },
  fileLookup: {
    missing: 'file lookup missing',
    started: 'file lookup started',
    succeeded: 'file lookup succeeded',
  },
  parentDirectoryLookup: {
    succeeded: 'parent directory lookup succeeded',
  },
};

/**
 * Maps provider-owned write milestones to narrow technical breadcrumbs.
 * @param event - Safe provider diagnostic step.
 */
export const addWebFileSystemDiagnosticStepBreadcrumb = (
  event: WebFileSystemDiagnosticStep,
): void => {
  const message = messageByStepResult[event.step]?.[event.result];
  if (message === undefined) {
    return;
  }

  const categoryByStep: Partial<
    Record<
      string,
      | 'webFileSystem.directory'
      | 'webFileSystem.read'
      | 'webFileSystem.stat'
      | 'webFileSystem.write'
    >
  > = {
    directoryRead: 'webFileSystem.directory',
    fileRead: 'webFileSystem.read',
    fileStat: 'webFileSystem.stat',
  };

  addTechnicalBreadcrumb({
    category: categoryByStep[event.step] ?? 'webFileSystem.write',
    data: {
      operation: operationByStep[event.step] ?? event.step,
      provider: 'webFileSystem',
      result: event.result,
      step: event.step,
      ...(event.errorClass !== undefined ? { errorClass: event.errorClass } : {}),
      ...(event.domExceptionName !== undefined ? { domExceptionName: event.domExceptionName } : {}),
    },
    level: event.result === 'failed' ? 'warning' : 'info',
    message,
  });
};
