import { ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { saveStreamWithPicker } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { EXPORT_ZIP_FALLBACK_MAX_BYTES } from './useExportDirectoryZip';
import { ExportZipErrorCode } from './exportZipErrorCode';
import type { ExportZipDialogProgress } from './useExportDirectoryZip';

/**
 * Creates the document ZIP export action. Exports a document's storage files, in a folder-like
 * archive layout, as a ZIP archive saved through the browser's save picker. This reads raw
 * storage files, not the decoded document state — it is not a JSON snapshot.
 * @returns The export action plus reactive progress and running state.
 */
export const useExportDocumentZip = () => {
  const { repositories } = useMainServiceClient();
  const progress = ref<ExportZipDialogProgress | undefined>(undefined);
  const isRunning = ref(false);

  /**
   * Exports a document's storage files as a ZIP archive chosen by the user. Ignores repeated
   * calls while an export is already running for this action instance.
   * @param path - Absolute path to the directory containing the document.
   * @param documentId - The document id to export.
   * @returns `true` when the export succeeds, `false` when the user cancels the save dialog or a
   * duplicate call is ignored while one is already running.
   */
  const exportDocumentZip = async (path: string, documentId: AMDocumentId): Promise<boolean> => {
    if (isRunning.value) {
      return false;
    }

    progress.value = undefined;
    isRunning.value = true;

    try {
      return await saveStreamWithPicker(
        async (write) => {
          await repositories.exportDocumentZip(
            path,
            documentId,
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
          fileName: `${documentId}.zip`,
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
          maxFallbackBytes: EXPORT_ZIP_FALLBACK_MAX_BYTES,
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
