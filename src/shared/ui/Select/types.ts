import type { BaseMenuButton } from '../Menu';

export interface OptionOld<Key extends PropertyKey, Value> {
  value: Value;
  key: Key;
}

export type SelectOption = BaseMenuButton;
