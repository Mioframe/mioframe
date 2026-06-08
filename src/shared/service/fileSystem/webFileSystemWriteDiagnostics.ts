import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';

const operationByStep: Record<string, string> = {
  fileHandleCreate: 'createFileHandle',
  fileWrite: 'writeFile',
  fileLookup: 'lookupExistingHandle',
  parentDirectoryLookup: 'lookupParentDirectory',
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
  fileWrite: {
    failed: 'file write failed',
  },
  writableOpen: {
    failed: 'writable open failed',
    started: 'writable open started',
    succeeded: 'writable open succeeded',
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

  addTechnicalBreadcrumb({
    category: 'webFileSystem.write',
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
