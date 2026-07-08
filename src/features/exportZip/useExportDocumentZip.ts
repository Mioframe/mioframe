import { computed, ref } from 'vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import { DomainError } from '@shared/lib/error';
import { saveStreamWithPicker } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { EXPORT_ZIP_FALLBACK_MAX_BYTES } from './useExportDirectoryZip';
import { ExportZipErrorCode } from './exportZipErrorCode';
import type { ExportZipDialogState } from './useExportDirectoryZip';

/**
 * Creates the document ZIP export action. Exports a document's storage files, in a folder-like
 * archive layout, as a ZIP archive saved through the browser's save picker. This reads raw
 * storage files, not the decoded document state — it is not a JSON snapshot.
 * @returns The export action plus reactive progress and running state.
 */
export const useExportDocumentZip = () => {
  const { repositories } = useMainServiceClient();
  const state = ref<ExportZipDialogState>({ status: 'idle' });
  const isRunning = computed(() => state.value.status === 'running');

  /**
   * Exports a document's storage files as a ZIP archive chosen by the user. Ignores repeated
   * calls while an export is already running for this action instance. Leaves the dialog state
   * in `success` or `error` on completion instead of hiding it immediately, so the caller can
   * show the final result until the user closes the dialog.
   * @param path - Absolute path to the directory containing the document.
   * @param documentId - The document id to export.
   * @returns `true` when the export succeeds, `false` when the user cancels the save dialog, a
   * duplicate call is ignored while one is already running, or the export fails.
   */
  const exportDocumentZip = async (path: string, documentId: AMDocumentId): Promise<boolean> => {
    if (state.value.status === 'running') {
      return false;
    }

    state.value = { status: 'running' };

    try {
      const exported = await saveStreamWithPicker(
        async (write) => {
          await repositories.exportDocumentZip(
            path,
            documentId,
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
          fileName: `${documentId}.zip`,
          extensions: ['.zip'],
          mimeTypes: ['application/zip'],
          maxFallbackBytes: EXPORT_ZIP_FALLBACK_MAX_BYTES,
        },
      );

      if (!exported) {
        state.value = { status: 'idle' };
        return false;
      }

      state.value = {
        status: 'success',
        message: 'ZIP exported with this document’s source storage files.',
      };
      return true;
    } catch (error) {
      const domainError =
        error instanceof DomainError
          ? error
          : new DomainError('Could not export the document as a ZIP archive', {
              cause: error,
              code: ExportZipErrorCode.documentExportFailed,
            });

      state.value = { status: 'error', message: domainError.message };
      captureDiagnosticException(domainError, {
        feature: 'exportZip',
        action: 'exportDocumentZip',
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

  return { exportDocumentZip, state, isRunning, closeExportZipDialog };
};
