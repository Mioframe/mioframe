import quickselect from 'quickselect';
import type { ComparePath } from './types';
import { get, isNumber, isObject } from 'es-toolkit/compat';
import { isBoolean, isString } from 'es-toolkit';

const singlePathCompare = (
  aItem: unknown,
  bItem: unknown,
  [desc, path]: ComparePath,
) => {
  let a = aItem;
  let b = bItem;

  if (path?.length && isObject(a) && isObject(b)) {
    a = get(a, path);
    b = get(b, path);
  }

  const direction = desc ? -1 : 1;

  if (
    (isString(a) || isNumber(a) || isBoolean(a)) &&
    (isString(b) || isNumber(b) || isBoolean(b))
  ) {
    return a < b ? -direction : a > b ? direction : 0;
  }

  return 0;
};

const multiPathCompare = (
  a: unknown,
  b: unknown,
  comparePathList: ComparePath[],
) => {
  for (const comparePath of comparePathList) {
    const result = singlePathCompare(a, b, comparePath);
    if (result !== 0) {
      return result;
    }
  }

  return 0;
};

// Алгоритм: Quickselect + сортировка диапазона
export const partialSort = <T>(
  arr: T[],
  comparePathList?: ComparePath[],
  firstIndex: number = 0,
  lastIndex: number = arr.length - 1,
): T[] => {
  const compareFn = comparePathList
    ? (a: T, b: T) => multiPathCompare(a, b, comparePathList)
    : undefined;

  quickselect(arr, firstIndex, 0, arr.length - 1, compareFn);

  const slicedArr = arr.slice(firstIndex, lastIndex);

  if (compareFn) {
    return slicedArr.sort(compareFn);
  }

  return slicedArr;
};
