import { zodEntryPath } from '@shared/lib/fileSystem/GeneralFSEntry';
import { object, type output } from 'zod/v4-mini';

export const zodQuery = object({ repoPath: zodEntryPath });

export type Query = output<typeof zodQuery>;
