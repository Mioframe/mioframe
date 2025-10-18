import type { LocationQueryRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';
import qs from 'query-string';
import { queryStringOptions } from '@shared/config/queryStringOptions';

export const router = createRouter({
  history: createWebHashHistory(
    import.meta.env.PROD ? window.location.pathname : undefined,
  ),
  routes: [],
  parseQuery: (search: string) => qs.parse(search, queryStringOptions),
  stringifyQuery: (query: LocationQueryRaw) =>
    qs.stringify(query, queryStringOptions),
});
