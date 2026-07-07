import { ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { saveFileWithPicker } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { ExportZipErrorCode } from './exportZipErrorCode';
import type { ExportZipDialogProgress } from './useExportDirectoryZip';

/**
 * Creates the document ZIP export action. Exports a document's storage files, in a folder-like
 * archive layout, as a ZIP archive saved through the browser's save picker. This reads raw
 * storage files, not the decoded document state — it is not a JSON snapshot.
 * @returns The export action plus reactive progress and running state for a progress sheet.
 */
export const useExportDocumentZip = () => {
  const { repositories } = useMainServiceClient();
  const progress = ref<ExportZipDialogProgress | undefined>(undefined);
  const isRunning = ref(false);

  /**
   * Exports a document's storage files as a ZIP archive chosen by the user.
   * @param path - Absolute path to the directory containing the document.
   * @param documentId - The document id to export.
   * @returns `true` when the export succeeds, or `false` when the user cancels the save dialog.
   */
  const exportDocumentZip = async (path: string, documentId: AMDocumentId): Promise<boolean> => {
    progress.value = undefined;

    try {
      isRunning.value = true;

      return await saveFileWithPicker(
        async () => {
          const archiveBytes = await repositories.exportDocumentZip(
            path,
            documentId,
            (nextProgress) => {
              progress.value = nextProgress;
            },
          );

          progress.value = { phase: 'saving' };

          return new Blob([new Uint8Array(archiveBytes)], { type: 'application/zip' });
        },
        {
          fileName: `${documentId}.zip`,
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
        },
      );
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not export the document as a ZIP archive', {
        cause: error,
        code: ExportZipErrorCode.documentExportFailed,
      });
    } finally {
      isRunning.value = false;
    }
  };

  return { exportDocumentZip, progress, isRunning };
};
