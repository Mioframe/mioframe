import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { useMainServiceClient } from '@shared/service';
import { useFileSystemService } from '@shared/service/fileSystem';
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

const parseDocumentDraftText = (text: string): ReturnType<typeof zodCFRDocumentContent.parse> => {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new DomainError('The selected file is not valid JSON', {
      cause: error,
      code: ImportDocumentErrorCode.invalidJson,
    });
  }

  try {
    return zodCFRDocumentContent.parse(data);
  } catch (error) {
    throw new DomainError('The selected JSON file is not a Mioframe document', {
      cause: error,
      code: ImportDocumentErrorCode.invalidDocumentFormat,
    });
  }
};

/**
 * Creates JSON document import actions for a target directory.
 * @returns Import actions for Mioframe JSON documents.
 */
export const useImportDocument = () => {
  const {
    repositories: { createDocument },
  } = useMainServiceClient();
  const { readText } = useFileSystemService();

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

    return {
      fileName: file.name,
      initialValue: parseDocumentDraftText(text),
    };
  };

  /**
   * Reads and validates a Mioframe JSON document from an existing VFS path before repository creation.
   * @param filePath - The VFS path to the JSON file.
   * @returns The parsed draft.
   */
  const readImportDocumentDraftFromPath = async (
    filePath: string,
  ): Promise<ImportedDocumentDraft> => {
    let text: string;

    try {
      text = await readText(filePath);
    } catch (error) {
      throw new DomainError('Could not import the document', {
        cause: error,
        code: ImportDocumentErrorCode.fileReadFailed,
      });
    }

    const fileName = filePath.split('/').at(-1) ?? filePath;

    return {
      fileName,
      initialValue: parseDocumentDraftText(text),
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
    readImportDocumentDraftFromPath,
  };
};
