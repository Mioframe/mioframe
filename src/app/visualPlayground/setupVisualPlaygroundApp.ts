import type { App } from 'vue';
import { createHead } from '@unhead/vue/client';
import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import qs from 'qs';
import { setupPlayground } from '@shared/lib/playground';
import { playgroundPages } from '../playgroundPages';
import '../styles/styles.css';

/**
 * Initializes the isolated visual playground runtime used by Playwright visual tests.
 * @param app - Pre-created Vue app instance for the visual playground shell.
 */
export const setupVisualPlaygroundApp = async (app: App): Promise<void> => {
  const router = createRouter({
    history: createWebHashHistory(window.location.pathname),
    routes: [],
    parseQuery: (search: string): LocationQuery => {
      const query = qs.parse(search, {
        allowSparse: true,
      });

      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We want to allow any query parameters, so we assert the type here.
      return query as LocationQuery;
    },
    stringifyQuery: (query: LocationQueryRaw = {}) => qs.stringify(query),
  });

  setupPlayground(router, playgroundPages);

  app.use(
    createHead({
      init: [
        {
          meta: [
            {
              name: 'viewport',
              content: 'width=device-width, initial-scale=1.0, interactive-widget=resizes-content',
            },
          ],
        },
      ],
    }),
  );
  app.use(router);

  await router.push('/playground');
  await router.isReady();
};
