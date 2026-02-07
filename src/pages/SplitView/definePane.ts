import type { EmptyObject, UnknownRecord } from 'type-fest';
import type { Component } from 'vue';
import type { ZodMiniType } from 'zod/v4-mini';

export type Pane<T extends UnknownRecord = UnknownRecord> = {
  component: Component;
  parseProps: (to: { query: UnknownRecord }) => T;
};

export type InferPaneQuery<P extends Pane> = ReturnType<P['parseProps']>;

export function definePane(component: Component): Pane<EmptyObject>;
export function definePane<T extends UnknownRecord>(
  component: Component,
  zodQuery: ZodMiniType<T>,
): Pane<T>;
export function definePane<T extends UnknownRecord = EmptyObject>(
  component: Component,
  zodQuery?: ZodMiniType<T>,
): Pane<T> {
  return {
    component,
    parseProps: (to: { query: UnknownRecord }) => {
      const query = zodQuery?.parse(to.query);

      return query ?? ({} as T);
    },
  };
}
