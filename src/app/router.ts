import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import FileManager from './FileManager.vue';
import MainView from '@widget/MainView/MainView.vue';

const routes: RouteRecordRaw[] = [
  { path: '/', component: MainView },
  { path: '/file-manager', component: FileManager },
  {
    path: '/v2',
    component: () => import('@widget/MainViewV2/MainView.vue'),
  },
];

if (import.meta.env.DEV) {
  routes.push({
    path: '/ui',
    children: [
      {
        path: 'layers',
        component: () => import('@shared/ui/Layers/DemoPage.vue'),
      },
      {
        path: 'button',
        component: () => import('@shared/ui/Button/DemoPage.vue'),
      },
      {
        path: 'tooltips',
        component: () => import('@shared/ui/Tooltips/DemoPage.vue'),
      },
    ],
  });
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
