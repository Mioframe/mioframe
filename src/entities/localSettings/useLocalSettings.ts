import { createGlobalState } from '@vueuse/core';
import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { z } from 'zod/v4-mini';
import {
  LOCAL_SETTINGS_STORAGE_KEY,
  localSettingsDiagnosticsFieldsShape,
} from '@shared/lib/diagnostics';

const zodSettingsStorage = z._default(
  z.object({
    ...localSettingsDiagnosticsFieldsShape,
    diagnosticsErrorPromptDismissedVersion: z.optional(z.string()),
    showPerformance: z.optional(z.boolean()),
    showAutomergeFiles: z.optional(z.boolean()),
    googleDriveIntegrationEnabled: z.optional(z.boolean()),
    hideStarterWidget: z.optional(z.boolean()),
    panesWidth: z._default(z.array(z.number()), []),
    pwaInstallWidgetDismissedUntil: z.optional(z.number()),
  }),
  { diagnosticsEnabled: false, diagnosticsConsentRequested: false, panesWidth: [] },
);

/**
 * Persistent local UI and privacy settings stored in IndexedDB.
 */
export const useLocalSettings = createGlobalState(() => {
  const defaultValue = zodSettingsStorage.parse(undefined);

  const { data: settings, isFinished } = useIDBKeyval(LOCAL_SETTINGS_STORAGE_KEY, defaultValue, {
    serializer: {
      read: (v) => zodSettingsStorage.safeParse(v).data ?? defaultValue,
      write: (v) => zodSettingsStorage.safeParse(v).data,
    },
  });

  return { settings, isFinished };
});
