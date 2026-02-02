export const arrayStartsWith = <T = unknown>(
  target: T[],
  prefix: T[],
): boolean =>
  prefix.length <= target.length && prefix.every((v, i) => v === target[i]);
