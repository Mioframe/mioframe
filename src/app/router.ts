import type { LocationQueryRaw } from 'vue-router';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import qs from 'query-string';
import { queryStringOptions } from '@shared/config/queryStringOptions';

const history =
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== './'
    ? createWebHistory(import.meta.env.BASE_URL)
    : createWebHashHistory(
        import.meta.env.PROD ? window.location.pathname : undefined,
      );

export const router = createRouter({
  history,
  routes: [],
  parseQuery: (search: string) => qs.parse(search, queryStringOptions),
  stringifyQuery: (query: LocationQueryRaw = {}) =>
    qs.stringify(query, queryStringOptions),
});
