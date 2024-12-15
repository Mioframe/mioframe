export interface Option<Key extends string | number, Value> {
  value: Value;
  key: Key;
}
