import { defineSetupVue3 } from '@histoire/plugin-vue';
import { setupApp } from './app/setupApp';

export const setupVue3 = defineSetupVue3(async ({ app }) => {
  await setupApp(app);
});
