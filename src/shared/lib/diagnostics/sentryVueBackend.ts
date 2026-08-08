import { registerSentryBackend } from './sentryRuntime';

/**
 * Registers `@sentry/vue`'s lazy dynamic import as this runtime's backend.
 *
 * Call once during bootstrap in any browser main-thread or DedicatedWorker context
 * that wants Sentry delivered through `@sentry/vue`. Intentionally not exported from
 * `@shared/lib/diagnostics`'s barrel and must never be imported by the managed Service
 * Worker (`src/sw.ts`) or anything in its import graph: importing this module would
 * reintroduce a dynamic `import('@sentry/vue')` into that Service Worker's bundle,
 * which its classic-script build must never contain. The managed Service Worker
 * registers a statically bundled `@sentry/browser` backend instead.
 */
export const registerLazyVueSentryBackend = (): void => {
  registerSentryBackend(() => import('@sentry/vue'));
};
