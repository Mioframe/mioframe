import { ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { saveFileWithPicker } from '@shared/lib/fileSystem';
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
 * Creates the directory ZIP export action. Exports raw directory storage contents, including
 * internal Mioframe storage files, as a ZIP archive saved through the browser's save picker.
 * @returns The export action plus reactive progress and running state for a progress sheet.
 */
export const useExportDirectoryZip = () => {
  const { repositories } = useMainServiceClient();
  const progress = ref<ExportZipDialogProgress | undefined>(undefined);
  const isRunning = ref(false);

  /**
   * Exports a directory as a ZIP archive chosen by the user.
   * @param path - Absolute path to the directory to export.
   * @returns `true` when the export succeeds, or `false` when the user cancels the save dialog.
   */
  const exportDirectoryZip = async (path: string): Promise<boolean> => {
    progress.value = undefined;

    try {
      isRunning.value = true;

      return await saveFileWithPicker(
        async () => {
          const archiveBytes = await repositories.exportDirectoryZip(path, (nextProgress) => {
            progress.value = nextProgress;
          });

          progress.value = { phase: 'saving' };

          return new Blob([new Uint8Array(archiveBytes)], { type: 'application/zip' });
        },
        {
          fileName: `${sanitizeArchiveRootName(PathUtils.basename(path), 'root')}.zip`,
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
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
    }
  };

  return { exportDirectoryZip, progress, isRunning };
};
