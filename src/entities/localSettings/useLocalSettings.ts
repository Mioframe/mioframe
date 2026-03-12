import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { toMerged } from 'es-toolkit';

interface SettingsStorage {
  showPerformance: boolean;
  showAutomergeFiles: boolean;
  panesWidth: number[];
}

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

  const initialSettings: () => SettingsStorage = () => ({
    showAutomergeFiles: false,
    showPerformance: false,
    panesWidth: [],
  });

  const { data: storage, set } = useIDBKeyval<SettingsStorage>(
    'settings',
    initialSettings(),
  );

  void set(toMerged(initialSettings(), storage.value));

  return { settings: storage, SETTINGS_DESCRIPTION, SETTINGS_LABEL };
});
