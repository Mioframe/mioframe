import '~console/vue-devtools';
import { setupApp } from './app/setupApp';

// eslint-disable-next-line no-console -- intentional build info log on startup
console.info('Application build date', new Date(__BUILD_DATE__).toLocaleString());

const rootMountElement = document.getElementById('app');

if (rootMountElement) {
  const app = await setupApp();
  app.mount(rootMountElement);
}
