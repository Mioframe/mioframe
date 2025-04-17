import { setupRootElement } from '@shared/lib/useRootElement';
import { setupApp } from './app/setupApp';
import { createLogger } from '@shared/lib/logger';

const { debug } = createLogger('main');

debug('Application build date', new Date(__BUILD_DATE__).toLocaleString());

const rootMountElement = document.getElementById('app');

if (rootMountElement) {
  const app = setupApp();
  setupRootElement(app, rootMountElement);
  app.mount(rootMountElement);
}

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- for develop
  // @ts-ignore
  void import('./temp');
}
