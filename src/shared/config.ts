export const APP_NAME = 'Mioframe';
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_DATE = __BUILD_DATE__;
export const APP_BUILD_ID = __BUILD_ID__ || undefined;
/** `true` in preview builds — enables verbose breadcrumbs and longer safe strings. */
export const IS_VERBOSE_DIAGNOSTICS = __DIAGNOSTICS_MODE__ === 'preview';
/**
 * This build's managed application-update channel, or `undefined` for a
 * build with no managed controller worker (an ordinary branch, a PR
 * preview, a PWA-disabled build, or a development/Storybook build). See
 * `config/plugins/pwa.ts`'s `resolveManagedAppUpdateChannel` for how this
 * build-time value is derived.
 */
export const MANAGED_APP_UPDATE_CHANNEL = __MANAGED_APP_UPDATE_CHANNEL__;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_DRIVE_INTEGRATION_AVAILABLE = Boolean(GOOGLE_CLIENT_ID);
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const SENTRY_DIAGNOSTICS_AVAILABLE = Boolean(SENTRY_DSN && import.meta.env.PROD);
