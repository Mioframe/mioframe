// oxlint-disable no-underscore-dangle -- Vite compile-time constants intentionally use sentinel names.
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
declare const __RELEASE_ID__: string;
declare const __RELEASE_SEQUENCE__: string;
declare const __RELEASE_TEST_HOOKS__: boolean;
declare const __RELEASE_CHANNEL__: 'stable' | 'branch';

interface FetchEvent {
  readonly replacesClientId: string;
}
declare const __DIAGNOSTICS_MODE__: 'preview' | 'production';
// oxlint-enable no-underscore-dangle
