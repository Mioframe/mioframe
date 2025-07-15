import type { MenuButtonDescription } from '../Menu';

export interface OptionOld<Key extends PropertyKey, Value> {
  value: Value;
  key: Key;
}

export type SelectOption = MenuButtonDescription;
