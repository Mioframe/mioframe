import { setupApp } from './app/setupApp';

setupApp().mount('#app');

if (import.meta.env.DEV) {
  void import('./temp').then(({ start }) => {
    start();
  });
}
