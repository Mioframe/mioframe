export const APP_NAME = __APP_NAME__;
export const APP_VERSION = __APP_VERSION__;
export const APP_BUILD_DATE = __BUILD_DATE__;
export const APP_BUILD_ID = __BUILD_ID__ || undefined;

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_DRIVE_INTEGRATION_AVAILABLE = Boolean(GOOGLE_CLIENT_ID);
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const SENTRY_DIAGNOSTICS_AVAILABLE = Boolean(SENTRY_DSN && import.meta.env.PROD);
