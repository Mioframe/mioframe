export const hasOwnKey = <O extends object>(
  obj: O,
  key: PropertyKey,
): key is keyof O => {
  return Object.hasOwn(obj, key);
};

export const hasKey = <O extends object>(
  obj: O,
  key: PropertyKey,
): key is keyof O => {
  return key in obj;
};
