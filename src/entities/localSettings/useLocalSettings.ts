import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';

interface SettingsStorage {
  showPerformance: boolean;
  showAutomergeFiles: boolean;
}

export const useLocalSettings = createGlobalState(() => {
  const SETTINGS_DESCRIPTION: Record<keyof SettingsStorage, string> = {
    showPerformance: 'Show performance layer',
    showAutomergeFiles: 'Show *.automerge files in explorer',
  };

  const SETTINGS_LABEL: Record<keyof SettingsStorage, string> = {
    showPerformance: 'Performance layer',
    showAutomergeFiles: 'Show *.automerge files',
  };

  const { data: storage } = useIDBKeyval<Partial<SettingsStorage>>(
    'settings',
    {},
  );

  return { settings: storage, SETTINGS_DESCRIPTION, SETTINGS_LABEL };
});
