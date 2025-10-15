import { zodDocumentId } from '@shared/lib/automerge';
import { zodEntryPath } from '@shared/lib/fileSystem/GeneralFSEntry';
import { z } from 'zod/v4-mini';

export const zodQuery = z.object({
  documentId: zodDocumentId,
  documentDirectory: zodEntryPath,
});

export type Query = z.infer<typeof zodQuery>;
