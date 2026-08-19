import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';

const getSafeErrorClass = (error: unknown): string => {
  if (error instanceof DOMException) return 'DOMException';
  if (error instanceof Error) return 'Error';
  return 'unknown';
};

const messageByStepResult: Record<
  string,
  Partial<Record<WebFileSystemDiagnosticStep['result'], string>>
> = {
  rootRead: {
    failed: 'root directory read failed',
  },
  rootReadPermissionRecheck: {
    succeeded: 'root read permission recheck still granted',
    failed: 'root read permission recheck no longer granted',
  },
};

/**
 * Maps provider-owned root-read recovery milestones to narrow technical breadcrumbs.
 * @param event - Safe provider diagnostic step.
 */
export const addWebFileSystemReadDiagnosticStepBreadcrumb = (
  event: WebFileSystemDiagnosticStep,
): void => {
  const message = messageByStepResult[event.step]?.[event.result];
  if (message === undefined) {
    return;
  }

  const errorClass = event.error !== undefined ? getSafeErrorClass(event.error) : undefined;

  addTechnicalBreadcrumb({
    category: 'webFileSystem.read',
    data: {
      provider: 'webFileSystem',
      result: event.result,
      step: event.step,
      ...(errorClass !== undefined ? { errorClass } : {}),
    },
    level: event.result === 'failed' && event.step === 'rootRead' ? 'warning' : 'info',
    message,
  });
};
