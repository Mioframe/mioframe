import type {
  DatabaseItem,
  DatabaseItemId,
} from '@shared/lib/databaseDocument';
import type { Query } from 'sift';

export type ItemIdQuery = Query<DatabaseItemId>;

export type ItemQuery = Query<DatabaseItem>;
