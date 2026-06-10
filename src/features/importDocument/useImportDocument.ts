import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { fileOpen } from 'browser-fs-access';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { ImportDocumentErrorCode } from './importDocumentErrorCode';

/**
 * Parsed import payload ready for repository creation.
 */
export interface ImportedDocumentDraft {
  /** Selected file name retained within the feature boundary for retry flows. */
  fileName: string;
  /** Parsed Mioframe document content ready for repository creation. */
  initialValue: ReturnType<typeof zodCFRDocumentContent.parse>;
}

/**
 * Creates JSON document import actions for a target directory.
 * @returns Import actions for Mioframe JSON documents.
 */
export const useImportDocument = () => {
  const {
    repositories: { createDocument },
  } = useMainServiceClient();

  /**
   * Reads and validates a selected Mioframe JSON document before repository creation.
   * @returns The parsed draft, or `undefined` when the user cancels file selection.
   */
  const readImportDocumentDraft = async (): Promise<ImportedDocumentDraft | undefined> => {
    let file: File;

    try {
      file = await fileOpen({
        description: 'JSON files',
        extensions: ['.json'],
        mimeTypes: ['application/json'],
      });
    } catch (error) {
      if (isUserFileSelectionCancel(error)) {
        return undefined;
      }

      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not open the selected file', {
        cause: error,
        code: ImportDocumentErrorCode.fileOpenFailed,
      });
    }

    let text: string;

    try {
      text = await file.text();
    } catch (error) {
      throw new DomainError('Could not import the document', {
        cause: error,
        code: ImportDocumentErrorCode.fileReadFailed,
      });
    }

    let data: unknown;

    try {
      data = JSON.parse(text);
    } catch (error) {
      throw new DomainError('The selected file is not valid JSON', {
        cause: error,
        code: ImportDocumentErrorCode.invalidJson,
      });
    }

    let initialValue: ReturnType<typeof zodCFRDocumentContent.parse>;

    try {
      initialValue = zodCFRDocumentContent.parse(data);
    } catch (error) {
      throw new DomainError('The selected JSON file is not a Mioframe document', {
        cause: error,
        code: ImportDocumentErrorCode.invalidDocumentFormat,
      });
    }

    return {
      fileName: file.name,
      initialValue,
    };
  };

  /**
   * Creates an imported document in the target directory from a validated draft payload.
   * @param path - The directory path where the imported document should be created.
   * @param draft - Parsed import payload selected by the user.
   * @returns The created document id.
   */
  const createImportedDocument = async (path: string, draft: ImportedDocumentDraft) => {
    try {
      const documentId = await createDocument(path, draft.initialValue);

      return documentId;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw new DomainError('Could not import the document', {
        cause: error,
        code: ImportDocumentErrorCode.documentImportFailed,
      });
    }
  };

  return {
    createImportedDocument,
    readImportDocumentDraft,
  };
};
