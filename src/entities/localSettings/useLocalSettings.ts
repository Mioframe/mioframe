import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { z } from 'zod/v4-mini';

const zodSettingsStorage = z._default(
  z.object({
    showPerformance: z.optional(z.boolean()),
    showAutomergeFiles: z.optional(z.boolean()),
    panesWidth: z._default(z.array(z.number()), []),
  }),
  { panesWidth: [] },
);

type SettingsStorage = z.infer<typeof zodSettingsStorage>;

export const useLocalSettings = createGlobalState(() => {
  const SETTINGS_DESCRIPTION: Record<keyof SettingsStorage, string> = {
    showPerformance: 'Show performance layer',
    showAutomergeFiles: 'Show *.automerge files in explorer',
    panesWidth: 'Store panes width',
  };

  const SETTINGS_LABEL: Record<keyof SettingsStorage, string> = {
    showPerformance: 'Performance layer',
    showAutomergeFiles: 'Show *.automerge files',
    panesWidth: 'Pane widths',
  };

  const { data: storage } = useIDBKeyval('settings', () =>
    zodSettingsStorage.parse(undefined),
  );

  return { settings: storage, SETTINGS_DESCRIPTION, SETTINGS_LABEL };
});
