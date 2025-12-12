import { zodDocumentId } from '@shared/lib/automerge';
import { string, z } from 'zod/v4-mini';

export const zodQuery = z.object({
  documentId: zodDocumentId,
  documentDirectory: string(),
});

export type Query = z.infer<typeof zodQuery>;
