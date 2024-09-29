export type RequiredValues<T extends object> = {
  [K in keyof T]-?: NonNullable<T[K]>;
};
