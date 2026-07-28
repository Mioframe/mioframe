import { nextTick } from 'vue';
import { restoreGhPagesSpaFallbackPath } from './app/ghPagesSpaFallback';
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
}
