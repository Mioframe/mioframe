import { object, string, type output } from 'zod/v4-mini';

export const zodQuery = object({ slug: string() });

/**
 * Query props accepted by the generic help article pane.
 */
export type Query = output<typeof zodQuery>;
