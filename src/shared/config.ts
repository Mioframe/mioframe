export const APP_NAME = 'Mioframe';
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_DATE = __BUILD_DATE__;
export const APP_BUILD_ID = __BUILD_ID__ || undefined;
export const APP_RELEASE_ID = __RELEASE_ID__ || undefined;
export const APP_RELEASE_CHANNEL = __RELEASE_CHANNEL__;
export const MANAGED_APP_UPDATES_AVAILABLE = APP_RELEASE_CHANNEL === 'stable' && !!APP_RELEASE_ID;
/** `true` in preview builds — enables verbose breadcrumbs and longer safe strings. */
export const IS_VERBOSE_DIAGNOSTICS = __DIAGNOSTICS_MODE__ === 'preview';

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_DRIVE_INTEGRATION_AVAILABLE = Boolean(GOOGLE_CLIENT_ID);
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const SENTRY_DIAGNOSTICS_AVAILABLE = Boolean(SENTRY_DSN && import.meta.env.PROD);
