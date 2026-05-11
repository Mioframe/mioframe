import { createApp } from 'vue';
import VisualPlaygroundApp from './VisualPlaygroundApp.vue';
import { setupVisualPlaygroundApp } from './setupVisualPlaygroundApp';

const root = document.getElementById('app');

if (!root) {
  throw new Error('Visual playground root element was not found.');
}

const app = createApp(VisualPlaygroundApp);

await setupVisualPlaygroundApp(app);

app.mount(root);
