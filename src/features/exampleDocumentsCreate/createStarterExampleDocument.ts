import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';

export const createStarterExampleDocument = (
  recipe: Pick<CFRDocumentContent, 'body' | 'name'>,
): CFRDocumentContent =>
  zodCFRDocumentContent.parse({
    body: recipe.body,
    name: recipe.name,
    type: DATABASE_DOCUMENT_TYPE,
    version: 1,
  });
