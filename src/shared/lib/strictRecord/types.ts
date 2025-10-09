export type StrictRecord<K extends string, T> = Record<K, T | undefined> & {
  [k in never]?: never;
};
