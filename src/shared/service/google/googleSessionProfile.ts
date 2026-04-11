import { z } from 'zod/v4-mini';

export const zodGoogleSessionProfile = z.object({
  email: z.email(),
  name: z.optional(z.string()),
  picture: z.optional(z.string()),
});

export type GoogleSessionProfile = z.output<typeof zodGoogleSessionProfile>;
