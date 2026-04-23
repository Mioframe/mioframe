import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { z } from 'zod/v4-mini';

const zodSettingsStorage = z._default(
  z.object({
    showPerformance: z.optional(z.boolean()),
    showAutomergeFiles: z.optional(z.boolean()),
    hideStarterWidget: z.optional(z.boolean()),
    panesWidth: z._default(z.array(z.number()), []),
  }),
  { panesWidth: [] },
);

type SettingsStorage = z.infer<typeof zodSettingsStorage>;

export const useLocalSettings = createGlobalState(() => {
  const SETTINGS_DESCRIPTION: Record<keyof SettingsStorage, string> = {
    showPerformance: 'Show performance layer',
    showAutomergeFiles: 'Show *.automerge files in explorer',
    hideStarterWidget: 'Hide starter examples on the home screen',
    panesWidth: 'Store panes width',
  };

  const SETTINGS_LABEL: Record<keyof SettingsStorage, string> = {
    showPerformance: 'Performance layer',
    showAutomergeFiles: 'Show *.automerge files',
    hideStarterWidget: 'Hide starter examples',
    panesWidth: 'Pane widths',
  };

  const defaultValue = zodSettingsStorage.parse(undefined);

  const { data: settings } = useIDBKeyval('settings', defaultValue, {
    serializer: {
      read: (v) => zodSettingsStorage.safeParse(v).data ?? defaultValue,
      write: (v) => zodSettingsStorage.safeParse(v).data,
    },
  });

  return { settings, SETTINGS_DESCRIPTION, SETTINGS_LABEL };
});
