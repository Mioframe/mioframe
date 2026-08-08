import { get } from 'idb-keyval';
import {
  deriveDiagnosticsPolicy,
  LOCAL_SETTINGS_STORAGE_KEY,
  zodLocalSettingsDiagnosticsFields,
} from './localSettingsDiagnosticsContract';
import type { SentryReportingState } from './sentryRuntimeState';

/**
 * Reads the persisted local-settings diagnostics-consent fields directly through
 * `idb-keyval`'s default store — the exact same persisted record `useLocalSettings.ts`
 * owns — and derives the diagnostics reporting policy from it.
 *
 * Safe to call before the Vue application has booted (e.g. from the managed Service
 * Worker's own startup). Never imports `entity/localSettings`. A missing record, a
 * storage read failure, or a structurally invalid record all fail closed to `'unknown'`
 * — this never resolves to `'enabled'`.
 * @returns The derived diagnostics reporting policy.
 */
export const readPersistedDiagnosticsPolicy = async (): Promise<SentryReportingState> => {
  try {
    const raw = await get(LOCAL_SETTINGS_STORAGE_KEY);
    const parsed = zodLocalSettingsDiagnosticsFields.safeParse(raw);
    if (!parsed.success) return 'unknown';
    return deriveDiagnosticsPolicy(parsed.data);
  } catch {
    return 'unknown';
  }
};
