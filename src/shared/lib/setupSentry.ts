import type { App, Plugin } from 'vue';
import type { Breadcrumb, CaptureContext } from '@sentry/vue';
import {
  clearDiagnosticsRuntimeEffects,
  flushDiagnosticsRuntimeEffects,
} from './diagnosticsRuntimeEffects';
import type { DiagnosticsMode } from '@shared/config';
import type { SentryReportingState, SentryRuntimeState } from './sentry/sentryRuntimeState';
import { createSentryOptions, getOrCreateSentrySessionId } from './sentry';

export type { SentryReportingState, SentryRuntimeState };

/**
 * Runtime configuration for the optional Sentry integration.
 */
export type SentryConfig = {
  /** Sentry DSN used for SDK initialization. */
  dsn?: string;
  /** Shared static diagnostics detail mode used by main and worker runtimes. */
  diagnosticsMode?: DiagnosticsMode | undefined;
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

const getRuntimeLabel = (): 'main' | 'worker' =>
  typeof WorkerGlobalScope !== 'undefined' && globalThis instanceof WorkerGlobalScope
    ? 'worker'
    : 'main';

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
  sentryFacade.addBreadcrumb({
    category: state.reportingState === 'enabled' ? 'sentry.runtime' : 'worker.runtime',
    data: {
      operation: 'applyRuntimeState',
      runtime: getRuntimeLabel(),
    },
    level: state.reportingState === 'disabled' ? 'warning' : 'info',
    message: `reporting state applied: ${state.reportingState}`,
    type: 'default',
  });

  reportingState = state.reportingState;

  if (state.reportingState === 'enabled') {
    pendingSessionId = state.sessionId;
    sentryFacade.setUser({ id: state.sessionId });
    flushDiagnosticsRuntimeEffects();
  } else if (state.reportingState === 'disabled') {
    pendingSessionId = undefined;
    sentryFacade.setUser(null);
    clearDiagnosticsRuntimeEffects();
  } else {
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
      diagnosticsMode: config.diagnosticsMode ?? 'production',
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
        runtime: getRuntimeLabel(),
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
 * Vue plugin that registers optional Sentry runtime config and stores the Vue
 * app reference for future lazy initialization.
 */
export const sentryPlugin: Plugin = {
  install(app, config: SentryConfig = {}) {
    registerSentryConfig(config);
    appRef = app;
  },
};
