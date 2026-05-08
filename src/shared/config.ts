export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
export const GOOGLE_DRIVE_INTEGRATION_AVAILABLE = Boolean(GOOGLE_CLIENT_ID);
export const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
export const SENTRY_DIAGNOSTICS_AVAILABLE = Boolean(SENTRY_DSN && import.meta.env.PROD);
