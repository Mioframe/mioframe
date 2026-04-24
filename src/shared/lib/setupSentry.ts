import type { App, Plugin } from 'vue';

/**
 * Runtime configuration for the optional Sentry integration.
 */
export type SentryConfig = {
  dsn?: string;
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

const DEFAULT_TRACES_SAMPLE_RATE = 0.7;
const DEFAULT_REPLAYS_SESSION_SAMPLE_RATE = 0.7;
const DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE = 1.0;

const NOOP_FINISH: Parameters<StartSpanManualParameters[1]>[1] = () => undefined;

let sentryModulePromise: Promise<SentryModule> | undefined;
let loadedSentryModule: SentryModule | undefined;
let runtimeConfig: SentryConfig | undefined;
let initPromise: Promise<SentryFacade> | undefined;
let appRef: App | undefined;
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

const readRuntimeConfig = () => {
  if (!canInitializeSentry(runtimeConfig)) {
    warnMissingConfigOnce();
    return undefined;
  }

  return runtimeConfig;
};

const kickoffSentryInitIfPossible = () => {
  if (loadedSentryModule || initPromise) {
    return;
  }

  if (canInitializeSentry(runtimeConfig)) {
    void ensureSentry(appRef);
    return;
  }

  warnMissingConfigOnce();
};

const invokeNoopSentryMethod = (methodName: string, args: unknown[]) => {
  kickoffSentryInitIfPossible();

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
 *
 * @param config - Runtime config used to decide whether Sentry should initialize.
 */
export const registerSentryConfig = (config: SentryConfig) => {
  runtimeConfig = config;
};

/**
 * Lazily imports and initializes `@sentry/vue` once.
 *
 * If configuration is missing, the returned facade stays in no-op mode. When
 * an app instance is provided, it is cached and passed to `Sentry.init`.
 *
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
      integrations: [sentry.replayIntegration()],
      tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
      replaysSessionSampleRate: DEFAULT_REPLAYS_SESSION_SAMPLE_RATE,
      replaysOnErrorSampleRate: DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE,
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
 * Compatibility wrapper that enables Sentry and initializes it for a Vue app.
 *
 * Prefer `sentryPlugin` for app bootstrap, but keep this helper available for
 * call sites that still want an explicit setup function.
 *
 * @param app - Vue app instance used during Sentry initialization.
 * @param dsn - Sentry DSN to register and initialize.
 * @returns The stable Sentry facade.
 */
export const setupSentry = async (app: App, dsn: string) => {
  registerSentryConfig({
    dsn,
    enabled: true,
  });

  return await ensureSentry(app);
};

/**
 * Returns the stable Sentry facade.
 *
 * The returned object is always safe to use. Before Sentry finishes
 * initializing, methods no-op or run their callback-based fallbacks.
 *
 * @returns Stable function-only Sentry facade.
 */
export const useSentry = (): SentryFacade => sentryFacade;

/**
 * Vue plugin that registers optional Sentry runtime config and starts lazy initialization.
 */
export const sentryPlugin: Plugin = {
  install(app, config: SentryConfig = {}) {
    registerSentryConfig(config);
    appRef = app;

    if (canInitializeSentry(config)) {
      void ensureSentry(app);
    }
  },
};
