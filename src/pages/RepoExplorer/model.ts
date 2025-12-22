import { object, string, type output } from 'zod/v4-mini';

export const zodQuery = object({ repoPath: string() });

export type Query = output<typeof zodQuery>;
