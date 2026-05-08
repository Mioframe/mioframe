import type { App, Plugin } from 'vue';

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
      beforeSend: (event) => {
        if (getSentryReportingState() !== 'enabled') {
          return null;
        }

        return event;
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
