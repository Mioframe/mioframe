import type { App, Plugin } from 'vue';
import type { Breadcrumb, CaptureContext } from '@sentry/browser';
import { clearDiagnosticsRuntimeEffects, flushDiagnosticsRuntimeEffects } from './runtimeEffects';
import type { SentryReportingState, SentryRuntimeState } from './sentryRuntimeState';
import { createSentryOptions } from './sentryOptions';
import { getOrCreateSentrySessionId, isSessionSentryUserId } from './sentrySession';

export type { SentryReportingState, SentryRuntimeState };

/**
 * Runtime configuration for the optional Sentry integration.
 */
export type SentryConfig = {
  /** Sentry DSN used for SDK initialization. */
  dsn?: string;
  /** When `true`, allows debug-level breadcrumbs and longer strings (preview builds). */
  isVerbose?: boolean | undefined;
  /** Whether runtime configuration allows lazy Sentry initialization. */
  enabled?: boolean;
  /** Release string matched to uploaded source map artifacts. */
  release?: string | undefined;
};

/**
 * Minimal project-owned facade over `@sentry/vue`.
 *
 * Exposes only the calls used by project diagnostic wrappers.
 * Before Sentry finishes initializing, all methods are safe no-ops.
 * Product code must not import `@sentry/vue` directly — use this facade instead.
 */
export type SentryFacade = {
  /**
   * Captures a caught Error as a Sentry exception.
   * Pass `captureContext` to attach tags, contexts, extra, and level without a scope callback.
   * Returns the event id string, or `undefined` when Sentry is not yet initialized.
   */
  captureException(exception: unknown, captureContext?: CaptureContext): string | undefined;
  /**
   * Captures a message-level event.
   * Pass `captureContext` to attach tags, contexts, extra, and level without a scope callback.
   * Returns the event id string, or `undefined` when Sentry is not yet initialized.
   */
  captureMessage(message: string, captureContext?: CaptureContext): string | undefined;
  /**
   * Sets or clears the Sentry user identity.
   * Only accepts a session-scoped `{ id: string }` — never real user identifiers.
   * No-op when Sentry is not yet initialized.
   */
  setUser(userOrNull: { id: string } | null): void;
  /**
   * Adds a breadcrumb to the current Sentry scope.
   * No-op when Sentry is not yet initialized.
   */
  addBreadcrumb(breadcrumb: Breadcrumb): void;
  /**
   * Waits, up to `timeoutMs`, for the SDK's transport to finish delivering already-queued
   * events (best-effort — used by the managed Service Worker's bounded diagnostics drain
   * to give in-flight delivery a chance to complete before its event lifetime ends).
   * Resolves `true` immediately when Sentry is not yet initialized — nothing to flush.
   */
  flush(timeoutMs?: number): Promise<boolean>;
};

/**
 * The concrete init options this runtime ever passes to a backend SDK's `init`:
 * the shared options built by `createSentryOptions`, plus the Vue app instance the
 * `@sentry/vue` backend uses for its Vue-specific error/integration wiring. A backend
 * that has no use for `app` (e.g. the managed Service Worker's `@sentry/browser`
 * backend) simply never reads it.
 */
type SentryInitOptions = ReturnType<typeof createSentryOptions> & { app?: App };

/**
 * The narrow, backend-agnostic subset of a Sentry SDK module this runtime core
 * actually calls. Both `@sentry/vue` (main thread, existing DedicatedWorker) and
 * `@sentry/browser` (managed Service Worker) satisfy this shape with compatible
 * runtime behavior.
 */
export type SentryBackendModule = {
  init: (options: SentryInitOptions) => unknown;
  captureException: (exception: unknown, captureContext?: CaptureContext) => string | undefined;
  captureMessage: (message: string, captureContext?: CaptureContext) => string | undefined;
  setUser: (user: { id: string } | null) => void;
  addBreadcrumb: (breadcrumb: Breadcrumb) => void;
  flush: (timeoutMs?: number) => Promise<boolean>;
};

/** Lazily resolves the backend SDK module this runtime should initialize. */
export type SentryBackendLoader = () => Promise<SentryBackendModule>;

let backendLoader: SentryBackendLoader | undefined;

/**
 * Registers which backend SDK module `ensureSentry()` loads and initializes.
 *
 * This runtime core never imports a concrete Sentry SDK itself, so a bootstrap
 * context must call this once, before any diagnostics call that may trigger
 * initialization: browser main-thread and DedicatedWorker bootstraps register
 * `@sentry/vue`'s lazy dynamic import (see `sentryVueBackend.ts`); the managed
 * Service Worker registers a statically bundled `@sentry/browser` module instead,
 * so its build never contains a dynamic `import('@sentry/vue')`.
 * @param loader - Resolves the backend SDK module to initialize.
 */
export const registerSentryBackend = (loader: SentryBackendLoader): void => {
  backendLoader = loader;
};

let sentryModulePromise: Promise<SentryBackendModule> | undefined;
let loadedSentryModule: SentryBackendModule | undefined;
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
  sentryModulePromise ??= backendLoader
    ? backendLoader()
    : Promise.reject(
        new Error('No Sentry backend registered; call registerSentryBackend() at bootstrap.'),
      );
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
 * Returns whether runtime delivery to Sentry is currently allowed.
 * @returns Whether Sentry event delivery is enabled right now.
 */
export const isSentryReportingEnabled = () => reportingState === 'enabled';

/**
 * Applies dynamic runtime state (reporting consent + session ID) received from
 * the main thread or set locally when consent changes.
 *
 * Works identically in both the main-thread and worker runtimes and owns the
 * runtime-local queue side effects for diagnostic delivery.
 * @param state - Dynamic runtime state to apply.
 */
export const setDiagnosticsRuntimeState = (state: SentryRuntimeState): void => {
  if (state.reportingState === 'enabled') {
    // Validate session id before committing to enabled state so that an invalid
    // id never results in a breadcrumb or a flush on the wrong reporting state.
    if (!isSessionSentryUserId(state.sessionId)) {
      reportingState = 'disabled';
      pendingSessionId = undefined;
      sentryFacade.setUser(null);
      clearDiagnosticsRuntimeEffects();
      return;
    }

    reportingState = 'enabled';
    sentryFacade.addBreadcrumb({
      category: 'sentry.runtime',
      data: {
        operation: 'applyRuntimeState',
      },
      level: 'info',
      message: `reporting state applied: ${state.reportingState}`,
      type: 'default',
    });
    pendingSessionId = state.sessionId;
    sentryFacade.setUser({ id: state.sessionId });
    flushDiagnosticsRuntimeEffects();
    if (isSentryConfigured()) {
      void ensureSentry();
    }
  } else if (state.reportingState === 'disabled') {
    reportingState = 'disabled';
    pendingSessionId = undefined;
    sentryFacade.setUser(null);
    clearDiagnosticsRuntimeEffects();
  } else {
    reportingState = state.reportingState;
    pendingSessionId = state.sessionId;
  }
};

/**
 * Minimal facade instance shared across both runtimes.
 * Methods are safe no-ops before the SDK loads; they call the real SDK after.
 */
export const sentryFacade: SentryFacade = {
  captureException(exception: unknown, captureContext?: CaptureContext): string | undefined {
    if (!loadedSentryModule) {
      if (!isSentryConfigured()) warnMissingConfigOnce();
      return undefined;
    }
    return loadedSentryModule.captureException(exception, captureContext);
  },
  captureMessage(message: string, captureContext?: CaptureContext): string | undefined {
    if (!loadedSentryModule) {
      if (!isSentryConfigured()) warnMissingConfigOnce();
      return undefined;
    }
    return loadedSentryModule.captureMessage(message, captureContext);
  },
  setUser(userOrNull: { id: string } | null): void {
    loadedSentryModule?.setUser(userOrNull);
  },
  addBreadcrumb(breadcrumb: Breadcrumb): void {
    loadedSentryModule?.addBreadcrumb(breadcrumb);
  },
  flush(timeoutMs?: number): Promise<boolean> {
    if (!loadedSentryModule) return Promise.resolve(true);
    return loadedSentryModule.flush(timeoutMs);
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
      isVerbose: config.isVerbose ?? false,
      dsn,
      release: config.release,
      getReportingState: getSentryReportingState,
    });

    sentry.init({
      ...options,
      ...(appRef ? { app: appRef } : {}),
    });

    loadedSentryModule = sentry;
    sentry.addBreadcrumb({
      category: 'sentry.runtime',
      data: {
        result: 'success',
      },
      level: 'info',
      message: 'Sentry runtime initialized',
      type: 'default',
    });

    if (reportingState === 'enabled') {
      sentry.setUser({ id: pendingSessionId ?? getOrCreateSentrySessionId() });
    } else {
      sentry.setUser(null);
    }

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
 * Returns the stable Sentry facade.
 * The returned object is always safe to use. Before Sentry finishes
 * initializing, methods are safe no-ops that return `undefined`.
 * @returns Stable Sentry facade.
 */
export const useSentry = (): SentryFacade => sentryFacade;

/**
 * Applies diagnostics runtime state and lazily initializes Sentry when enabled.
 * Use this from product and service code instead of calling `setDiagnosticsRuntimeState`
 * and `ensureSentry` separately.
 * @param state - Dynamic runtime state to apply.
 * @returns Promise that resolves once Sentry initialization completes, or immediately when disabled.
 */
export const applyDiagnosticsRuntimeState = (state: SentryRuntimeState): Promise<void> => {
  setDiagnosticsRuntimeState(state);
  if (state.reportingState === 'enabled' && isSentryConfigured()) {
    return ensureSentry().then(() => undefined);
  }
  return Promise.resolve();
};

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
