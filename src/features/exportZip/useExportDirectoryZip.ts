import { ref } from 'vue';
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
 * Bounded buffer size for the browser-fs-access fallback save path, used only when the browser
 * has no File System Access API and archive bytes can't be streamed straight to disk.
 */
export const EXPORT_ZIP_FALLBACK_MAX_BYTES = 200 * 1024 * 1024;

/**
 * Creates the directory ZIP export action. Exports raw directory storage contents, including
 * internal Mioframe storage files, as a ZIP archive saved through the browser's save picker.
 * @returns The export action plus reactive progress, running, and progress-sheet visibility state.
 */
export const useExportDirectoryZip = () => {
  const { repositories } = useMainServiceClient();
  const progress = ref<ExportZipDialogProgress | undefined>(undefined);
  const isRunning = ref(false);
  const isProgressVisible = ref(false);

  /**
   * Exports a directory as a ZIP archive chosen by the user. Ignores repeated calls while an
   * export is already running for this action instance.
   * @param path - Absolute path to the directory to export.
   * @returns `true` when the export succeeds, `false` when the user cancels the save dialog or a
   * duplicate call is ignored while one is already running.
   */
  const exportDirectoryZip = async (path: string): Promise<boolean> => {
    if (isRunning.value) {
      return false;
    }

    progress.value = undefined;
    isRunning.value = true;
    isProgressVisible.value = true;

    try {
      return await saveStreamWithPicker(
        async (write) => {
          await repositories.exportDirectoryZip(
            path,
            async (chunk) => {
              await write(chunk);
            },
            (nextProgress) => {
              progress.value = nextProgress;
            },
          );

          progress.value = { phase: 'saving' };
        },
        {
          fileName: `${sanitizeArchiveRootName(PathUtils.basename(path), 'root')}.zip`,
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
          maxFallbackBytes: EXPORT_ZIP_FALLBACK_MAX_BYTES,
        },
      );
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not export the directory as a ZIP archive', {
        cause: error,
        code: ExportZipErrorCode.directoryExportFailed,
      });
    } finally {
      isRunning.value = false;
      isProgressVisible.value = false;
    }
  };

  /** Hides the progress sheet without affecting the export itself, which keeps running. */
  const dismissProgress = () => {
    isProgressVisible.value = false;
  };

  return { exportDirectoryZip, progress, isRunning, isProgressVisible, dismissProgress };
};
