import type { EmptyObject, UnknownRecord } from 'type-fest';
import type { Component } from 'vue';
import type { RouteLocationNormalizedGeneric } from 'vue-router';
import type { ZodMiniType } from 'zod/v4-mini';

export type Pane<T extends UnknownRecord = UnknownRecord> = {
  component: () => Promise<Component>;
  props: (to: RouteLocationNormalizedGeneric) => T;
};

export type InferPaneQuery<P extends Pane> = ReturnType<P['props']>;

export function definePane(
  component: () => Promise<Component>,
): Pane<EmptyObject>;
export function definePane<T extends UnknownRecord>(
  component: () => Promise<Component>,
  zodQuery: ZodMiniType<T>,
): Pane<T>;
export function definePane<T extends UnknownRecord = EmptyObject>(
  component: () => Promise<Component>,
  zodQuery?: ZodMiniType<T>,
): Pane<T> {
  return {
    component,
    props: (to) => {
      const query = zodQuery?.parse(to.query);

      return query ?? ({} as T);
    },
  };
}
