import type { App, Plugin } from 'vue';
import type {
  DiagnosticBreadcrumbCategory,
  DiagnosticBreadcrumbDataKey,
} from './diagnostics/DiagnosticBreadcrumb';

/**
 * Allowed diagnostic breadcrumb categories that may survive `beforeBreadcrumb` and `beforeSend`.
 * Automatic Sentry and browser-generated categories are stripped.
 */
const SAFE_BREADCRUMB_CATEGORIES = new Set<string>([
  'repository.storage',
  'writeAccessRecovery',
  'diagnostics.forwarding',
] satisfies DiagnosticBreadcrumbCategory[]);

/**
 * Allowed keys in breadcrumb `data`. Values must be enum-like strings or numbers.
 * Unknown keys are stripped.
 */
const SAFE_BREADCRUMB_DATA_KEYS = new Set<DiagnosticBreadcrumbDataKey>([
  'provider',
  'operation',
  'result',
  'classification',
  'failureClassification',
  'pendingCount',
  'flushedCount',
  'failedCount',
]);

const SAFE_EVENT_EXTRA_KEYS = [
  'userMessage',
  'domainErrorCode',
  'originalThrownType',
  // Diagnostic event counters — project-controlled numeric values only.
  'pendingCount',
  'failedCount',
  'flushedCount',
  // Sanitized error summary from sanitizeDiagnosticError — no raw messages, paths, or ids.
  'errorClass',
  'domExceptionName',
  'vfsErrorCode',
  'errorClassification',
  // Diagnostic correlation — project-generated random UUID, never derived from user data.
  'attemptId',
] as const;
const SAFE_EVENT_TAG_KEYS = [
  'handled',
  'feature',
  'action',
  // Structured diagnostic event fields — project-controlled enum values only.
  'eventKind',
  'severity',
  'result',
  'classification',
  // Flow-specific safe tags from diagnostic wrappers — project-controlled values only.
  // New safe tag keys must also be added here and covered by beforeSend tests.
  'provider',
  'operation',
  'failureClassification',
] as const;
type SentryTagValue = boolean | number | string | null | undefined;

const pickEventFields = (source: Record<string, unknown> | undefined, keys: readonly string[]) => {
  const result: Record<string, unknown> = {};

  if (!source) {
    return result;
  }

  for (const key of keys) {
    if (key in source) {
      result[key] = source[key];
    }
  }

  return result;
};

const isSentryTagValue = (value: unknown): value is SentryTagValue =>
  value === null ||
  value === undefined ||
  typeof value === 'boolean' ||
  typeof value === 'number' ||
  typeof value === 'string';

const pickEventTags = (source: Record<string, unknown> | undefined, keys: readonly string[]) => {
  const result: Record<string, SentryTagValue> = {};

  if (!source) {
    return result;
  }

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && isSentryTagValue(value)) {
      result[key] = value;
    }
  }

  return result;
};

type SentryBreadcrumb = import('@sentry/vue').Breadcrumb;

/**
 * Sanitizes a single breadcrumb so only safe project-controlled technical breadcrumbs survive.
 * Returns `null` to drop the breadcrumb, or a cleaned copy to keep it.
 *
 * Rules:
 * - Category must be in `SAFE_BREADCRUMB_CATEGORIES`.
 * - Data keys must be in `SAFE_BREADCRUMB_DATA_KEYS`.
 * - Data values must be enum-like strings or numbers only.
 * - All other breadcrumb fields pass through as-is (Sentry-controlled metadata).
 * @param breadcrumb - The Sentry breadcrumb to sanitize.
 * @returns A sanitized breadcrumb copy, or `null` to drop it.
 */
const sanitizeBreadcrumb = (breadcrumb: SentryBreadcrumb): SentryBreadcrumb | null => {
  if (!breadcrumb.category || !SAFE_BREADCRUMB_CATEGORIES.has(breadcrumb.category)) {
    return null;
  }

  const { data: rawData, ...rest } = breadcrumb;
  if (!rawData || typeof rawData !== 'object') {
    return rest;
  }

  const safeData: Record<string, string | number> = {};
  for (const key of SAFE_BREADCRUMB_DATA_KEYS) {
    const value: unknown = rawData[key];
    if (typeof value === 'string' || typeof value === 'number') {
      safeData[key] = value;
    }
  }

  return Object.keys(safeData).length > 0 ? { ...rest, data: safeData } : rest;
};

/**
 * Runtime configuration for the optional Sentry integration.
 */
export type SentryConfig = {
  /** Sentry DSN used for SDK initialization. */
  dsn?: string;
  /** Whether runtime configuration allows lazy Sentry initialization. */
  enabled?: boolean;
};

type SentryModule = typeof import('@sentry/vue');
type CallableExportKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: infer _Args) => infer _Return ? K : never;
}[keyof T];
type CallableSentryExports = Pick<SentryModule, CallableExportKeys<SentryModule>>;
type OptionalCallableExport<T> = T extends (...args: infer Args) => infer Return
  ? (...args: Args) => Return | undefined
  : never;
type ProxySentryFacade = {
  [K in keyof CallableSentryExports]: OptionalCallableExport<CallableSentryExports[K]>;
};
type SentryScope = import('@sentry/vue').Scope;
type StartSpanParameters = Parameters<SentryModule['startSpan']>;
type StartSpanManualParameters = Parameters<SentryModule['startSpanManual']>;

/**
 * Function-only facade over `@sentry/vue`.
 *
 * The facade intentionally exposes only callable SDK exports. When Sentry is
 * disabled or still initializing, most methods become safe no-ops and return
 * `undefined`. Callback-based span helpers remain callable so wrapped work can
 * still run without checking whether Sentry is available.
 */
export type SentryFacade = Omit<
  ProxySentryFacade,
  'withScope' | 'startSpan' | 'startSpanManual'
> & {
  withScope: {
    <T>(callback: (scope: SentryScope) => T): T | undefined;
    <T>(scope: SentryScope | undefined, callback: (scope: SentryScope) => T): T | undefined;
  };
  startSpan: <T>(
    options: StartSpanParameters[0],
    callback: (span: Parameters<StartSpanParameters[1]>[0] | undefined) => T,
  ) => T | undefined;
  startSpanManual: <T>(
    options: StartSpanManualParameters[0],
    callback: (
      span: Parameters<StartSpanManualParameters[1]>[0] | undefined,
      finish: Parameters<StartSpanManualParameters[1]>[1],
    ) => T,
  ) => T | undefined;
};

const NOOP_FINISH: Parameters<StartSpanManualParameters[1]>[1] = () => undefined;

let sentryModulePromise: Promise<SentryModule> | undefined;
let loadedSentryModule: SentryModule | undefined;
let runtimeConfig: SentryConfig | undefined;
let initPromise: Promise<SentryFacade> | undefined;
let appRef: App | undefined;
/**
 * Tracks whether Sentry event delivery is allowed.
 * `unknown` means local settings have not been hydrated yet, so the user's
 * diagnostics preference is still unknown. Errors that arrive while in this
 * state are queued and flushed once the state transitions to `enabled`.
 */
export type SentryReportingState = 'unknown' | 'enabled' | 'disabled';

let reportingState: SentryReportingState = 'unknown';
let warnedMissingConfig = false;
let warnedInitFailure = false;

const warnMissingConfigOnce = () => {
  if (import.meta.env.PROD || warnedMissingConfig) {
    return;
  }

  warnedMissingConfig = true;
  console.warn('[sentry] Sentry is not configured. Calls will be ignored.');
};

const warnInitFailureOnce = (error: unknown) => {
  if (import.meta.env.PROD || warnedInitFailure) {
    return;
  }

  warnedInitFailure = true;
  console.warn(
    '[sentry] Sentry failed to initialize. Calls will remain no-op until a retry succeeds.',
    error,
  );
};

const getSentryModule = async () => {
  sentryModulePromise ??= import('@sentry/vue');
  return await sentryModulePromise;
};

const canInitializeSentry = (config: SentryConfig | undefined) =>
  config?.enabled === true && !!config.dsn;

/**
 * Returns whether the runtime configuration is valid for lazy Sentry initialization.
 * This only reflects registered config and does not imply delivery is currently allowed.
 * @returns Whether Sentry has valid runtime config.
 */
export const isSentryConfigured = () => canInitializeSentry(runtimeConfig);

/**
 * Returns the current Sentry reporting state.
 * `unknown` means local settings have not been hydrated yet.
 * @returns The current reporting state.
 */
export const getSentryReportingState = () => reportingState;

/**
 * Sets the Sentry reporting state at runtime.
 * Use `'enabled'` when the user opts in to diagnostics, `'disabled'` when
 * they opt out, and `'unknown'` before local settings are hydrated.
 * @param state - The reporting state to set.
 */
export const setSentryReportingState = (state: SentryReportingState) => {
  reportingState = state;
};

/**
 * Returns whether runtime delivery to Sentry is currently allowed.
 * This gate is independent from SDK initialization and can be toggled without importing Sentry.
 * @returns Whether Sentry event delivery is enabled right now.
 */
export const isSentryReportingEnabled = () => reportingState === 'enabled';

/**
 * Enables or disables Sentry event delivery at runtime.
 * Initialization still remains lazy and requires valid runtime config.
 * @param enabled - Whether Sentry should be allowed to send reports.
 */
export const setSentryReportingEnabled = (enabled: boolean) => {
  reportingState = enabled ? 'enabled' : 'disabled';
};

const readRuntimeConfig = () => {
  if (!isSentryConfigured()) {
    warnMissingConfigOnce();
    return undefined;
  }

  return runtimeConfig;
};
const invokeNoopSentryMethod = (methodName: string, args: unknown[]) => {
  if (!isSentryConfigured()) {
    warnMissingConfigOnce();
  }

  if (methodName === 'startSpan') {
    const callback = args[1];

    if (typeof callback === 'function') {
      return callback(undefined);
    }
  }

  if (methodName === 'startSpanManual') {
    const callback = args[1];

    if (typeof callback === 'function') {
      return callback(undefined, NOOP_FINISH);
    }
  }

  return undefined;
};

const invokeSentryMethod = (methodName: string, args: unknown[]) => {
  const sentry = loadedSentryModule;

  if (!sentry) {
    return invokeNoopSentryMethod(methodName, args);
  }

  const method = Reflect.get(sentry, methodName);

  if (!(method instanceof Function)) {
    return undefined;
  }

  return Reflect.apply(method, sentry, args);
};

const createSentryFacade = (): SentryFacade => {
  const target: object = {};

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Proxy keeps the facade stable while forwarding function calls lazily
  return new Proxy(target, {
    get: (_target, prop) => {
      if (typeof prop !== 'string' || prop === 'then') {
        return undefined;
      }

      return (...args: unknown[]) => invokeSentryMethod(prop, args);
    },
  }) as SentryFacade;
};

const sentryFacade = createSentryFacade();

/**
 * Registers runtime Sentry configuration without loading the SDK.
 * @param config - Runtime config used to decide whether Sentry should initialize.
 */
export const registerSentryConfig = (config: SentryConfig) => {
  runtimeConfig = config;
};

/**
 * Lazily imports and initializes `@sentry/vue` once.
 * If configuration is missing, the returned facade stays in no-op mode. When
 * an app instance is provided, it is cached and passed to `Sentry.init`.
 * @param app - Optional Vue app instance used for Vue-specific Sentry wiring.
 * @returns The stable Sentry facade, backed by the real SDK after initialization.
 */
export const ensureSentry = async (app?: App): Promise<SentryFacade> => {
  if (app) {
    appRef = app;
  }

  if (loadedSentryModule) {
    return sentryFacade;
  }

  const config = readRuntimeConfig();
  if (!config) {
    return sentryFacade;
  }

  initPromise ??= (async () => {
    const sentry = await getSentryModule();
    const dsn = config.dsn;

    if (!dsn) {
      return sentryFacade;
    }

    sentry.init({
      dsn,
      ...(appRef ? { app: appRef } : {}),
      tracesSampleRate: 0,
      beforeBreadcrumb: (breadcrumb) => sanitizeBreadcrumb(breadcrumb),
      beforeSend: (event) => {
        if (getSentryReportingState() !== 'enabled') {
          return null;
        }

        const {
          breadcrumbs,
          contexts: _contexts,
          extra,
          request: _request,
          tags,
          user: _user,
          ...safeEvent
        } = event;
        const safeTags = pickEventTags(tags, SAFE_EVENT_TAG_KEYS);
        const safeExtra = pickEventFields(extra, SAFE_EVENT_EXTRA_KEYS);

        // Defense-in-depth: re-sanitize breadcrumbs that bypassed beforeBreadcrumb
        // (e.g. added before SDK initialization or by third-party integrations).
        const safeBreadcrumbs = Array.isArray(breadcrumbs)
          ? breadcrumbs.map(sanitizeBreadcrumb).filter((b): b is SentryBreadcrumb => b !== null)
          : undefined;

        return {
          ...safeEvent,
          ...(Object.keys(safeExtra).length > 0 ? { extra: safeExtra } : {}),
          ...(Object.keys(safeTags).length > 0 ? { tags: safeTags } : {}),
          ...(safeBreadcrumbs && safeBreadcrumbs.length > 0
            ? { breadcrumbs: safeBreadcrumbs }
            : {}),
        };
      },
    });

    loadedSentryModule = sentry;

    return sentryFacade;
  })();

  try {
    return await initPromise;
  } catch (error) {
    initPromise = undefined;
    sentryModulePromise = undefined;
    warnInitFailureOnce(error);
    return sentryFacade;
  }
};

/**
 * Compatibility wrapper that registers runtime config and initializes Sentry
 * for a Vue app.
 * Prefer `sentryPlugin` for app bootstrap, but keep this helper available for
 * call sites that still want an explicit setup function. This compatibility API
 * preserves the legacy behavior where an explicit setup call enables delivery.
 * @param app - Vue app instance used during Sentry initialization.
 * @param dsn - Sentry DSN to register before lazy initialization.
 * @returns The stable Sentry facade.
 */
export const setupSentry = async (app: App, dsn: string) => {
  registerSentryConfig({
    dsn,
    enabled: true,
  });

  setSentryReportingEnabled(true);

  return await ensureSentry(app);
};

/**
 * Returns the stable Sentry facade.
 * The returned object is always safe to use. Before Sentry finishes
 * initializing, methods no-op or run their callback-based fallbacks.
 * @returns Stable function-only Sentry facade.
 */
export const useSentry = (): SentryFacade => sentryFacade;

/**
 * Vue plugin that registers optional Sentry runtime config and stores the Vue
 * app reference for future lazy initialization.
 */
export const sentryPlugin: Plugin = {
  install(app, config: SentryConfig = {}) {
    registerSentryConfig(config);
    appRef = app;
  },
};
