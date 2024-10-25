import { defineAsyncComponent } from 'vue';

export const DocumentEditForm = defineAsyncComponent(
  () => import('./DocumentJsonEditForm.vue'),
);
