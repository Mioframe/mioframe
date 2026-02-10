import type { UnknownRecord } from 'type-fest';
import type { Component } from 'vue';

export type Pane = {
  name: string;
  component: Component;
  props: UnknownRecord;
};
