import quickselect from 'quickselect';
import type { ComparePath } from '../../../../entities/databaseData/types';
import { get, isObject } from 'es-toolkit/compat';

const singlePathCompare = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- support any
  aItem: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- support any
  bItem: any,
  [desc, ...path]: ComparePath,
) => {
  let a = aItem;
  let b = bItem;

  if (path.length && isObject(a) && isObject(b)) {
    a = get(a, path) ?? -1;
    b = get(b, path) ?? -1;
  }

  const direction = desc ? -1 : 1;

  return a < b ? -direction : a > b ? direction : 0;
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

/**
 * partial selection sort
 * @param arr
 * @param comparePathList
 * @param firstIndex
 * @param lastIndex
 * @returns
 */
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

  const slicedArr = arr.slice(firstIndex, lastIndex + 1);

  if (compareFn) {
    return slicedArr.sort(compareFn);
  }

  return slicedArr;
};
