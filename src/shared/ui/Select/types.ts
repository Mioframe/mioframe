export interface OptionOld<Key extends string | number, Value> {
  value: Value;
  key: Key;
}

export type Option = string | number | undefined | { labelText: string };
