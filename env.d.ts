/// <reference types="vite/client" />
/// <reference types="unplugin-turbo-console/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __BUILD_DATE__: string;
declare const __APP_VERSION__: string;
declare const __BUILD_ID__: string;
declare const __DIAGNOSTICS_MODE__: 'preview' | 'production';
declare const __WEB_FILE_SYSTEM_WRITE_STRATEGY__: 'directCreateWriteProbe' | 'safeCurrent';
