import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { z } from 'zod/v4-mini';

const zodSettingsStorage = z._default(
  z.object({
    diagnosticsEnabled: z.optional(z.boolean()),
    showPerformance: z.optional(z.boolean()),
    showAutomergeFiles: z.optional(z.boolean()),
    googleDriveIntegrationEnabled: z.optional(z.boolean()),
    hideStarterWidget: z.optional(z.boolean()),
    panesWidth: z._default(z.array(z.number()), []),
  }),
  { panesWidth: [] },
);
export const useLocalSettings = createGlobalState(() => {
  const defaultValue = zodSettingsStorage.parse(undefined);

  const { data: settings } = useIDBKeyval('settings', defaultValue, {
    serializer: {
      read: (v) => zodSettingsStorage.safeParse(v).data ?? defaultValue,
      write: (v) => zodSettingsStorage.safeParse(v).data,
    },
  });

  return { settings };
});
