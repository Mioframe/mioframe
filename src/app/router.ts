import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import qs from 'qs';

const history =
  import.meta.env.BASE_URL && import.meta.env.BASE_URL !== './'
    ? createWebHistory(import.meta.env.BASE_URL)
    : createWebHashHistory(
        import.meta.env.PROD ? window.location.pathname : undefined,
      );

export const router = createRouter({
  history,
  routes: [],
  parseQuery: (search: string): LocationQuery => {
    const query = qs.parse(search, {
      allowSparse: true,
    });

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We want to allow any query parameters, so we assert the type here.
    return query as LocationQuery;
  },
  stringifyQuery: (query: LocationQueryRaw = {}) => {
    const stringified = qs.stringify(query);

    return stringified;
  },
});
