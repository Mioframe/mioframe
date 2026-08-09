import { nextTick } from 'vue';
import { restoreGhPagesSpaFallbackPath } from './app/ghPagesSpaFallback';
import { MANAGED_APP_UPDATE_CHANNEL } from './shared/config';
import { reportAppBootOk } from './shared/serviceClient/appUpdate/bootReport';

console.info('Application build date', new Date(__BUILD_DATE__).toLocaleString());

if (import.meta.env.DEV) {
  const optionalDevtoolsModule = '~console/vue-devtools';

  void import(/* @vite-ignore */ optionalDevtoolsModule).catch(() => {
    // Local dev helper is optional outside the author's shell setup.
  });
}

const rootMountElement = document.getElementById('app');

if (rootMountElement) {
  restoreGhPagesSpaFallbackPath(import.meta.env.BASE_URL);
  const { setupApp } = await import('./app/setupApp');
  const { router } = await import('./app/router');
  const app = await setupApp();

  // For managed builds, an unhandled error anywhere in this initial boot
  // window (mount, first navigation, first render tick) must reach the
  // watchdog's `error`/`unhandledrejection` handling instead of being
  // silently logged by Vue's default production error behavior. Vue only
  // rethrows unhandled errors in production when this flag is set, so it is
  // enabled for the duration of the boot window and always restored
  // afterward — ordinary post-boot Vue production error handling is
  // unaffected.
  const previousThrowUnhandledErrorInProduction =
    app.config.throwUnhandledErrorInProduction ?? false;
  if (MANAGED_APP_UPDATE_CHANNEL !== undefined) {
    app.config.throwUnhandledErrorInProduction = true;
  }
  try {
    app.mount(rootMountElement);
    // `BOOT_OK` must only be reported once the initial router navigation has
    // actually resolved and the root app has rendered — not merely once
    // `app.mount()` returns, which happens before either. `router.isReady()`
    // rejects when the initial navigation itself fails (e.g. a lazy-loaded
    // route component's dynamic import throws); left uncaught here, that
    // becomes an unhandled module-evaluation rejection, which the managed
    // update watchdog's own `unhandledrejection` listener already treats as an
    // early fatal boot failure (see scripts/pages/lib/watchdogInject.mjs) —
    // `reportAppBootOk()` correctly never runs in that case.
    await router.isReady();
    await nextTick();
    reportAppBootOk();
  } finally {
    app.config.throwUnhandledErrorInProduction = previousThrowUnhandledErrorInProduction;
  }
}
