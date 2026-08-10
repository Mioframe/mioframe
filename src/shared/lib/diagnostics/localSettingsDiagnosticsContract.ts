import { z } from 'zod/v4-mini';
import type { SentryReportingState } from './sentryRuntimeState';

/**
 * The `idb-keyval` key under which persisted local UI/privacy settings are stored,
 * on the default `idb-keyval` store (database `keyval-store`, object store `keyval`).
 * Shared so a reader outside the Vue app (e.g. the managed Service Worker) can read
 * the exact same persisted record `useLocalSettings.ts` owns.
 */
export const LOCAL_SETTINGS_STORAGE_KEY = 'settings';

/**
 * The persisted local-settings fields that determine diagnostics consent.
 * Composed into `useLocalSettings.ts`'s complete settings schema and reused
 * standalone by any reader that only needs consent, since a plain `z.object`
 * strips unrecognized keys instead of rejecting them.
 */
export const localSettingsDiagnosticsFieldsShape = {
  diagnosticsEnabled: z._default(z.boolean(), false),
  diagnosticsConsentRequested: z._default(z.boolean(), false),
};

/** Standalone schema for just the diagnostics-consent fields of the persisted settings record. */
export const zodLocalSettingsDiagnosticsFields = z._default(
  z.object(localSettingsDiagnosticsFieldsShape),
  { diagnosticsEnabled: false, diagnosticsConsentRequested: false },
);
/** A {@link zodLocalSettingsDiagnosticsFields}-validated diagnostics-consent fragment. */
export type LocalSettingsDiagnosticsFields = z.infer<typeof zodLocalSettingsDiagnosticsFields>;

/**
 * Derives the diagnostics reporting policy from persisted local-settings fields:
 * `enabled` when the user opted in; `disabled` when the user was asked and did not
 * opt in; `unknown` when consent has never been resolved (not yet asked, or the
 * persisted record could not be read/parsed).
 * @param fields - The persisted diagnostics-consent fields.
 * @returns The derived reporting policy.
 */
export const deriveDiagnosticsPolicy = (
  fields: LocalSettingsDiagnosticsFields,
): SentryReportingState => {
  if (fields.diagnosticsEnabled) return 'enabled';
  if (fields.diagnosticsConsentRequested) return 'disabled';
  return 'unknown';
};
