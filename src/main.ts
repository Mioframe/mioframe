import '~console/vue-devtools';
import { setupApp } from './app/setupApp';

console.info('Application build date', new Date(__BUILD_DATE__).toLocaleString());

const rootMountElement = document.getElementById('app');

if (rootMountElement) {
  const app = await setupApp();
  app.mount(rootMountElement);
}
