/// <reference lib="webworker" />

import { SENTRY_DSN, APP_BUILD_ID, APP_VERSION, IS_VERBOSE_DIAGNOSTICS } from '@shared/config';
import { registerSentryConfig } from '@shared/lib/diagnostics';
import { setupMainService, serviceId } from './setupMainService';
import { defineWorkerService } from '@shared/lib/wrapWorker/defineWorkerService';
import { registerWorkerSentrySyncService } from './sentryWorkerSync';

declare const self: DedicatedWorkerGlobalScope;

// Register the shared diagnostics runtime for the worker context.
// Static config is imported directly — the same path used by the main thread.
// Reporting state starts as `unknown` (events queued) until the main thread
// applies dynamic state via the sentryWorkerSync service.
registerSentryConfig({
  ...(SENTRY_DSN !== undefined && { dsn: SENTRY_DSN }),
  isVerbose: IS_VERBOSE_DIAGNOSTICS,
  enabled: import.meta.env.PROD,
  release: APP_BUILD_ID || APP_VERSION,
});

// Register the state sync service so the main thread can push session ID
// and reporting state changes.
registerWorkerSentrySyncService(self);

defineWorkerService(serviceId, setupMainService);

// Registered as a fully separate worker RPC service — never a field on `setupMainService`'s
// object — and only when this exact build is the managed release fixture build. A dynamic,
// statically-analyzable import behind a compile-time-constant condition lets the bundler drop
// this entire module (and its VFS provider) from every real stable/branch/PR build.
if (__RELEASE_TEST_HOOKS__) {
  void import('./fileSystem/releaseTestFileSystemWorkerService').then(
    ({ releaseTestFileSystemServiceId, setupReleaseTestFileSystemService }) => {
      defineWorkerService(releaseTestFileSystemServiceId, setupReleaseTestFileSystemService);
    },
  );
}
