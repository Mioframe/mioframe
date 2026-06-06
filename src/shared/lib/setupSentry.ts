import type { App, Plugin } from 'vue';
import type { Scope as SentryScope } from '@sentry/vue';
import type { SentryReportingState, SentryRuntimeState } from './sentry/sentryRuntimeState';
import { createSentryOptions, getOrCreateSentrySessionId } from './sentry';

export type { SentryReportingState, SentryRuntimeState };

/**
 * Runtime configuration for the optional Sentry integration.
 */
export type SentryConfig = {
  /** Sentry DSN used for SDK initialization. */
  dsn?: string;
  /** Whether runtime configuration allows lazy Sentry initialization. */
  enabled?: boolean;
  /** Release string matched to uploaded source map artifacts. */
  release?: string | undefined;
  /**
   * Pass `false` to disable all default Sentry integrations.
   * Required for worker contexts where DOM integrations would throw.
   */
  defaultIntegrations?: false;
};

/**
 * Minimal project-owned facade over `@sentry/vue`.
 *
 * Exposes only the three calls actually used by project diagnostic wrappers.
 * Before Sentry finishes initializing, all methods return `undefined` without throwing.
 * Product code must not import `@sentry/vue` directly — use this facade instead.
 */
export type SentryFacade = {
  /**
   * Runs `callback` with an isolated Sentry scope and returns its return value.
   * Returns `undefined` when Sentry is not yet initialized.
   */
  withScope<T>(callback: (scope: SentryScope) => T): T | undefined;
  /**
   * Captures a caught Error as a Sentry exception.
   * Returns the event id string, or `undefined` when Sentry is not yet initialized.
   */
  captureException(exception: unknown): string | undefined;
  /**
   * Captures a message-level event.
   * Returns the event id string, or `undefined` when Sentry is not yet initialized.
   */
  captureMessage(message: string): string | undefined;
};

type SentryModule = typeof import('@sentry/vue');

let sentryModulePromise: Promise<SentryModule> | undefined;
let loadedSentryModule: SentryModule | undefined;
let runtimeConfig: SentryConfig | undefined;
let initPromise: Promise<SentryFacade> | undefined;
let appRef: App | undefined;

let reportingState: SentryReportingState = 'unknown';
/** Session ID to apply to Sentry after SDK init. Set by setDiagnosticsRuntimeState. */
let pendingSessionId: string | undefined;
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
 * @param state - The reporting state to set.
 */
export const setSentryReportingState = (state: SentryReportingState) => {
  reportingState = state;
};

/**
 * Returns whether runtime delivery to Sentry is currently allowed.
 * @returns Whether Sentry event delivery is enabled right now.
 */
export const isSentryReportingEnabled = () => reportingState === 'enabled';

/**
 * Enables or disables Sentry event delivery at runtime.
 * @param enabled - Whether Sentry should be allowed to send reports.
 */
export const setSentryReportingEnabled = (enabled: boolean) => {
  reportingState = enabled ? 'enabled' : 'disabled';
};

/**
 * Applies dynamic runtime state (reporting consent + session ID) received from
 * the main thread or set locally when consent changes.
 *
 * Works identically in both the main-thread and worker runtimes:
 * - When `enabled`: stores the session ID and calls `setUser` if the SDK is already loaded.
 *   If the SDK is still loading, the session ID is applied when `ensureSentry` completes.
 * - When `disabled`: clears the pending session ID and calls `setUser(null)`.
 * - When `unknown`: updates the reporting state only (events remain queued).
 *
 * Queue flush and clear must be triggered separately by the caller (e.g.
 * `useDiagnosticsReporting` on main or `sentryWorkerSync` on worker).
 * @param state - Dynamic runtime state to apply.
 */
export const setDiagnosticsRuntimeState = (state: SentryRuntimeState): void => {
  reportingState = state.reportingState;

  if (state.reportingState === 'enabled') {
    pendingSessionId = state.sessionId;
    loadedSentryModule?.setUser({ id: state.sessionId });
  } else if (state.reportingState === 'disabled') {
    pendingSessionId = undefined;
    loadedSentryModule?.setUser(null);
  }
  // 'unknown': no user change — events remain queued until state is resolved.
};

/**
 * Minimal facade instance shared across both runtimes.
 * Methods are safe no-ops before the SDK loads; they call the real SDK after.
 */
export const sentryFacade: SentryFacade = {
  withScope<T>(callback: (scope: SentryScope) => T): T | undefined {
    if (!loadedSentryModule) {
      if (!isSentryConfigured()) warnMissingConfigOnce();
      return undefined;
    }
    return loadedSentryModule.withScope(callback);
  },
  captureException(exception: unknown): string | undefined {
    if (!loadedSentryModule) {
      if (!isSentryConfigured()) warnMissingConfigOnce();
      return undefined;
    }
    return loadedSentryModule.captureException(exception);
  },
  captureMessage(message: string): string | undefined {
    if (!loadedSentryModule) {
      if (!isSentryConfigured()) warnMissingConfigOnce();
      return undefined;
    }
    return loadedSentryModule.captureMessage(message);
  },
};

/**
 * Registers runtime Sentry configuration without loading the SDK.
 * @param config - Runtime config used to decide whether Sentry should initialize.
 */
export const registerSentryConfig = (config: SentryConfig) => {
  runtimeConfig = config;
};

/**
 * Lazily imports and initializes `@sentry/vue` once.
 * Sets the session-scoped user identity after initialization.
 * If configuration is missing, the returned facade stays in no-op mode.
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

  if (!isSentryConfigured()) {
    return sentryFacade;
  }

  const config = runtimeConfig;
  if (!config) {
    return sentryFacade;
  }

  initPromise ??= (async () => {
    const sentry = await getSentryModule();
    const dsn = config.dsn;

    if (!dsn) {
      return sentryFacade;
    }

    const options = createSentryOptions({
      dsn,
      release: config.release,
      getReportingState: getSentryReportingState,
      ...(config.defaultIntegrations === false ? { defaultIntegrations: false as const } : {}),
    });

    sentry.init({
      ...options,
      ...(appRef ? { app: appRef } : {}),
    });

    loadedSentryModule = sentry;

    // Apply session identity: use the ID set by setDiagnosticsRuntimeState, or
    // auto-generate one when no external state sync has arrived (main thread default).
    sentry.setUser({ id: pendingSessionId ?? getOrCreateSentrySessionId() });

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
 * for a Vue app. Prefer `sentryPlugin` for app bootstrap.
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
 * initializing, methods are safe no-ops that return `undefined`.
 * @returns Stable Sentry facade.
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
