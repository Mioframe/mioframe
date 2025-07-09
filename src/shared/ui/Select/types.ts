import type { MenuButtonDescription } from '../Menu';

export interface OptionOld<Key extends string | number, Value> {
  value: Value;
  key: Key;
}

export type SelectOption = MenuButtonDescription;
