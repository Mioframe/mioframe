import { computed, ref } from 'vue';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { saveStreamWithPicker } from '@shared/lib/fileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { sanitizeArchiveRootName } from '@shared/lib/zipArchive';
import { useMainServiceClient } from '@shared/service';
import type { ZipExportProgress } from '@shared/service';
import { ExportZipErrorCode } from './exportZipErrorCode';

/** Progress phase shown by the export ZIP progress sheet, including the client-owned save step. */
export type ExportZipDialogPhase = ZipExportProgress['phase'] | 'saving';

/** Progress reported to the export ZIP progress sheet. */
export type ExportZipDialogProgress = {
  /** Current export phase. */
  phase: ExportZipDialogPhase;
  /** Number of storage files processed so far, when known. */
  current?: number;
  /** Total number of storage files to process, when known. */
  total?: number;
};

/**
 * Explicit lifecycle state for a ZIP export dialog. Distinguishes running progress from a final
 * success or error result so the dialog can stay open after completion until the user closes it.
 */
export type ExportZipDialogState =
  | { status: 'idle' }
  | { status: 'running'; progress?: ExportZipDialogProgress }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

/** Visible-only export ZIP dialog states. The dialog component must never render `idle`. */
export type ExportZipVisibleDialogState = Exclude<
  ExportZipDialogState,
  {
    /** Discriminant excluded from the visible dialog state. */
    status: 'idle';
  }
>;

/**
 * Bounded buffer size for the browser-fs-access fallback save path, used only when the browser
 * has no File System Access API and archive bytes can't be streamed straight to disk.
 */
export const EXPORT_ZIP_FALLBACK_MAX_BYTES = 200 * 1024 * 1024;

/**
 * Creates the directory ZIP export action. Exports raw directory storage contents, including
 * internal Mioframe storage files, as a ZIP archive saved through the browser's save picker.
 * @returns The export action plus reactive progress and running state.
 */
export const useExportDirectoryZip = () => {
  const { repositories } = useMainServiceClient();
  const state = ref<ExportZipDialogState>({ status: 'idle' });
  const isRunning = computed(() => state.value.status === 'running');

  /**
   * Exports a directory as a ZIP archive chosen by the user. Ignores repeated calls while an
   * export is already running for this action instance. Leaves the dialog state in `success` or
   * `error` on completion instead of hiding it immediately, so the caller can show the final
   * result until the user closes the dialog.
   * @param path - Absolute path to the directory to export.
   * @returns `true` when the export succeeds, `false` when the user cancels the save dialog, a
   * duplicate call is ignored while one is already running, or the export fails.
   */
  const exportDirectoryZip = async (path: string): Promise<boolean> => {
    if (state.value.status === 'running') {
      return false;
    }

    state.value = { status: 'running' };

    try {
      const exported = await saveStreamWithPicker(
        async (write) => {
          await repositories.exportDirectoryZip(
            path,
            async (chunk) => {
              await write(chunk);
            },
            (nextProgress) => {
              state.value = { status: 'running', progress: nextProgress };
            },
          );

          state.value = { status: 'running', progress: { phase: 'saving' } };
        },
        {
          fileName: `${sanitizeArchiveRootName(PathUtils.basename(path), 'root')}.zip`,
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
          maxFallbackBytes: EXPORT_ZIP_FALLBACK_MAX_BYTES,
        },
      );

      if (!exported) {
        state.value = { status: 'idle' };
        return false;
      }

      state.value = { status: 'success', message: 'ZIP archive exported.' };
      return true;
    } catch (error) {
      const domainError =
        error instanceof DomainError
          ? error
          : new DomainError('Could not export the directory as a ZIP archive', {
              cause: error,
              code: ExportZipErrorCode.directoryExportFailed,
            });

      state.value = { status: 'error', message: domainError.message };
      captureDiagnosticException(domainError, {
        feature: 'exportZip',
        action: 'exportDirectoryZip',
      });
      return false;
    }
  };

  /**
   * Closes the export ZIP dialog. Does nothing while the export is running; only `success` and
   * `error` states can be dismissed.
   */
  const closeExportZipDialog = () => {
    if (state.value.status === 'running') {
      return;
    }

    state.value = { status: 'idle' };
  };

  return { exportDirectoryZip, state, isRunning, closeExportZipDialog };
};
