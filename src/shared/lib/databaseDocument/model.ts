import type { PartialDeep } from 'type-fest';
import type { ColumnId } from './column';
import { generateColumnId, zodColumnId } from './column';
import { zodDocument, type CRDocument, type DocumentApi } from '../documentApi';
import { putObject } from '../putObject';
import type { ItemId } from './item';
import { generateItemId, zodItemId } from './item';
import type { AnyColumn } from './column';
import type { TypeOf } from 'zod';
import { intersection, literal, object, record, unknown } from 'zod';
import { zodColumnMap } from './column/column';
import { parseSelf } from '../validateZodScheme';

const zodValue = unknown();

type Value = TypeOf<typeof zodValue>;

const zodItem = record(zodColumnId, zodValue);

type Item = TypeOf<typeof zodItem>;

const zodData = record(zodItemId, zodItem);

const zodDatabaseStateV1 = object({
  version: literal(1),
  data: zodData,
  columns: zodColumnMap,
  // todo: добавить view: zodViewMap
});

type DataBaseStateV1 = TypeOf<typeof zodDatabaseStateV1>;

const initialDatabaseStateV1 = (): DataBaseStateV1 => ({
  version: 1,
  columns: {},
  data: {},
});

const zodDataBaseStateLatest = zodDatabaseStateV1;

export type DataBaseStateLatest = TypeOf<typeof zodDataBaseStateLatest>;

const zodDatabaseExtentionDocument = object({
  body: zodDataBaseStateLatest,
  type: literal('database'),
});

export const zodDatabaseDocument = intersection(
  zodDocument,
  zodDatabaseExtentionDocument,
);

export type DatabaseDocument = TypeOf<typeof zodDatabaseDocument>;

/**
 * Миграция должна проверять текущую версию документа
 * Запускать последжовательные миграции начиная с нужной версии до конца
 */

const migrationsMap: {
  [CURRENT_VERSION: number]: <D extends CRDocument>(doc: D) => void;
} = {
  0: (doc: CRDocument) => {
    putObject(doc, { body: initialDatabaseStateV1() });
  },
};

const documentUpdate = (doc: CRDocument): DatabaseDocument => {
  const { body } = parseSelf(doc, zodDatabaseExtentionDocument);
  const currentVersion: number = body.version;

  if (currentVersion in migrationsMap) {
    migrationsMap[currentVersion](doc);
    return documentUpdate(doc);
  }
  return parseSelf(doc, zodDatabaseDocument);
};

export const createDatabaseApi = (document: DocumentApi): DatabaseApi => {
  const addColumn = (column: AnyColumn): ColumnId => {
    const columnId = generateColumnId();

    document.change((doc) => {
      const { body } = documentUpdate(doc);

      body.columns[columnId] = column;
    });

    return columnId;
  };

  const updateColumn = (columnId: ColumnId, column: PartialDeep<AnyColumn>) => {
    document.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.columns, { [columnId]: column });
    });
  };

  const removeColumn = (columnId: ColumnId) => {
    document.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.columns, { [columnId]: undefined });
    });
  };

  const addItem = (item: Item) => {
    const itemId = generateItemId();

    document.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: item });
    });

    return itemId;
  };

  const updateItem = (itemId: ItemId, partialItem: PartialDeep<Item>) => {
    document.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: partialItem });
    });
  };

  const removeItem = (itemId: ItemId) => {
    document.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: undefined });
    });
  };

  const read = async (): Promise<DatabaseDocument> => {
    const doc = await document.doc();
    return parseSelf(doc, zodDatabaseDocument);
  };

  const on = (event: 'change', fn: (doc: DatabaseDocument) => unknown) => {
    const insideFn = ({ doc }: { doc: CRDocument }) =>
      fn(parseSelf(doc, zodDatabaseDocument));

    document.on(event, insideFn);

    const off = () => {
      document.off(event, insideFn);
    };

    return off;
  };

  const api: DatabaseApi = {
    addColumn,
    updateColumn,
    removeColumn,

    addItem,
    updateItem,
    removeItem,

    read,
    on,
  };

  return api;
};

// todo: описать интерфейс работы с db

export interface DatabaseApi {
  addColumn(column: AnyColumn): ColumnId;
  removeColumn(columnId: ColumnId): void;
  updateColumn(columnId: ColumnId, partialColumn: PartialDeep<AnyColumn>): void;

  addItem(item: Item): ItemId;
  removeItem(itemId: ItemId): void;
  updateItem(itemId: ItemId, partialItem: PartialDeep<Item>): void;

  read(): Promise<DatabaseDocument>;

  on(event: 'change', fn: (doc: DatabaseDocument) => unknown): () => void;

  // addView(): void;
  // removeView(): void;
  // updateView(): void;
}

// todo: тип документа должен быть неизмняемый
