import { setupApp } from './app/setupApp';

setupApp().mount('#app');

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- for only dev
  /* @ts-nocheck */
  void import('./temp').then(({ start }) => {
    start();
  });
  /* @ts-check */
}
