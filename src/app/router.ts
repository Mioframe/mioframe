import type { LocationQueryRaw } from 'vue-router';
import { createRouter, createWebHistory } from 'vue-router';
import qs from 'query-string';
import { queryStringOptions } from '@shared/config/queryStringOptions';
import { setupMainRouter } from '@page/routes';

export const router = createRouter({
  history: createWebHistory(
    import.meta.env.PROD ? window.location.pathname : undefined,
  ),
  routes: [],
  parseQuery: (search: string) => qs.parse(search, queryStringOptions),
  stringifyQuery: (query: LocationQueryRaw) =>
    qs.stringify(query, queryStringOptions),
});

setupMainRouter(router);
