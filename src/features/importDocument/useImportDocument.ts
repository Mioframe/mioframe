import { useMainServiceClient } from '@shared/service';
import { fileOpen } from 'browser-fs-access';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';

export const useImportDocument = () => {
  const {
    repositories: { createDocument },
  } = useMainServiceClient();

  const importJsonFile = async (path: string) => {
    const file = await fileOpen({
      description: 'JSON files',
      extensions: ['.json'],
      mimeTypes: ['application/json'],
    });

    const text = await file.text();
    const data = JSON.parse(text);

    const initialValue = zodCFRDocumentContent.parse(data);

    const documentId = await createDocument(path, initialValue);

    return documentId;
  };

  return {
    importJsonFile,
  };
};
