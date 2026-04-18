import { setupApp } from './app/setupApp';

console.info('Application build date', new Date(__BUILD_DATE__).toLocaleString());

if (import.meta.env.DEV) {
  const optionalDevtoolsModule = '~console/vue-devtools';

  void import(/* @vite-ignore */ optionalDevtoolsModule).catch(() => {
    // Local dev helper is optional outside the author's shell setup.
  });
}

const rootMountElement = document.getElementById('app');

if (rootMountElement) {
  const app = await setupApp();
  app.mount(rootMountElement);
}
