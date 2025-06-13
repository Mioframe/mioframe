export enum SORT_DIRECTION {
  ascending,
  descending,
}

type Desc = boolean;

export type DatabaseItemId = `itemId${string}`;

export type ComparePath = [Desc] | [Desc, ...string[]];

export type DatabaseData = {
  [x: `itemId${string}`]: Partial<Record<`propertyId${string}`, unknown>>;
};

export interface Sorting {
  [key: `propertyId${string}`]: {
    priority: number;
    direction: SORT_DIRECTION;
  };
}

export interface SortWorkerApi {
  sortData: (
    data: DatabaseData,
    sorting: Sorting,
    firstIndex?: number,
    lastIndex?: number,
  ) => DatabaseItemId[];

  partialSort: <T>(
    arr: T[],
    comparePathList?: ComparePath[],
    firstIndex?: number,
    lastIndex?: number,
  ) => T[];
}
