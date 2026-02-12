import type { AMDocumentId } from '@shared/lib/automerge';
import { DomainError } from '@shared/lib/error';
import { useMainServiceClient } from '@shared/service';
import { stringify } from 'safe-stable-stringify';
import { fileSave } from 'browser-fs-access';

export const useExportDocument = () => {
  const {
    documents: { cfrDocumentState },
  } = useMainServiceClient();

  const saveJsonFile = async (path: string, documentId: AMDocumentId) => {
    const documentState = await cfrDocumentState.fetch({
      path,
      documentId,
    });

    if (!documentState) {
      throw new DomainError("Don't have document content");
    }

    const jsonString = stringify(documentState);

    const extension = 'json';

    const mimeType = `application/${extension}`;

    await fileSave(new Blob([jsonString], { type: mimeType }), {
      fileName: `${documentId}.${extension}`,
      extensions: [`.${extension}`],
      mimeTypes: [mimeType],
    });
  };

  return {
    saveJsonFile,
  };
};
