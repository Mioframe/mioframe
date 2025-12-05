import type { Query } from 'sift';
import sift from 'sift';

export const filter = <TItem, TSchema extends TItem = TItem>(
  data: TItem[],
  query: Query<TSchema>,
): TItem[] => data.filter(sift(query));
