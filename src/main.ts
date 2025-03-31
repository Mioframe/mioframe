import { setupRootElement } from '@shared/lib/useRootElement';
import { setupApp } from './app/setupApp';

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
