import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import FileManager from './FileManager.vue';
import MainView from '@widget/MainView/MainView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', component: MainView },
  { path: '/file-manager', component: FileManager },
];

if (import.meta.env.DEV) {
  routes.push({
    path: '/ui',
    children: [
      {
        path: 'button',
        component: () => import('@shared/ui/Button/DemoPage.vue'),
      },
    ],
  });
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
