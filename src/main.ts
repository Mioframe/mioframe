import { restoreGhPagesSpaFallbackPath } from './app/ghPagesSpaFallback';

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
  const app = await setupApp();
  app.mount(rootMountElement);
  const [{ router }, { setupManagedAppUpdates }] = await Promise.all([
    import('./app/router'),
    import('@shared/serviceClient/appUpdate'),
  ]);
  await router.isReady();
  await setupManagedAppUpdates();
}
