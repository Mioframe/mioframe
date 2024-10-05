import type { PartialDeep } from 'type-fest';
import { putObject } from '../changeObject';
import type { CFRDocument, DocumentContent } from '../cfrDocument';
import { parseSelf } from '../validateZodScheme';
import { generateItemId, type ItemId } from './item';
import {
  type AnyProperty,
  type PropertyId,
  generatePropertyId,
} from './property';
import {
  type DatabaseDocument,
  type Item,
  type DatabaseDocumentContent,
  zodDatabaseDocumentContent,
  zodDatabaseType,
} from './types';
import { migrationsMap } from './migrations';
import { createLogger } from '../logger';
import { cloneDeep, isNumber, isObject, keys, toInteger } from 'lodash-es';

const { debug } = createLogger('createDatabaseDocument');

const documentUpdate = (doc: DocumentContent): DatabaseDocumentContent => {
  debug('documentUpdate', cloneDeep(doc));
  const dbDocument = parseSelf(doc, zodDatabaseType);

  const currentVersion: number =
    'body' in dbDocument
      ? isObject(dbDocument.body)
        ? 'version' in dbDocument.body
          ? isNumber(dbDocument.body.version)
            ? dbDocument.body.version
            : 0
          : 0
        : 0
      : 0;

  if (currentVersion in migrationsMap) {
    migrationsMap[currentVersion](doc);
    return documentUpdate(doc);
  }
  return parseSelf(doc, zodDatabaseDocumentContent);
};

export const createDatabaseDocument = (
  cfrDocument: CFRDocument,
): DatabaseDocument => {
  const migrate = async <D>(doc: D): Promise<DatabaseDocumentContent> => {
    debug('migrate', doc);
    const dbDocument = parseSelf(doc, zodDatabaseType);

    const currentVersion: number =
      'body' in dbDocument
        ? isObject(dbDocument.body)
          ? 'version' in dbDocument.body
            ? isNumber(dbDocument.body.version)
              ? dbDocument.body.version
              : 0
            : 0
          : 0
        : 0;

    const latestVersion = Math.max(...keys(migrationsMap).map(toInteger));

    debug('migrate', currentVersion, latestVersion);

    if (latestVersion >= currentVersion) {
      cfrDocument.change((doc) => {
        documentUpdate(doc);
      });
      return parseSelf(await cfrDocument.doc(), zodDatabaseDocumentContent);
    }
    return parseSelf(doc, zodDatabaseDocumentContent);
  };

  const addProperty = (column: AnyProperty): PropertyId => {
    const columnId = generatePropertyId();

    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      body.properties[columnId] = column;
    });

    return columnId;
  };

  const updateProperty = (
    columnId: PropertyId,
    column: PartialDeep<AnyProperty>,
  ) => {
    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.properties, { [columnId]: column });
    });
  };

  const removeProperty = (propertyId: PropertyId) => {
    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- delete any property
      delete body.properties[propertyId];

      // todo: добавить параметр очистки data от значений
    });
  };

  const addItem = (item: Item) => {
    const itemId = generateItemId();

    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: item });
    });

    return itemId;
  };

  const updateItem = (itemId: ItemId, partialItem: PartialDeep<Item>) => {
    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: partialItem });
    });
  };

  const removeItem = (itemId: ItemId) => {
    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: undefined });
    });
  };

  const read = async (): Promise<DatabaseDocumentContent> => {
    debug('read');
    const doc = await cfrDocument.doc();

    debug('read', doc);
    return await migrate(doc);
  };

  const onChange = (fn: (doc: DatabaseDocumentContent) => unknown) => {
    const insideFn = ({ doc }: { doc: DocumentContent }) =>
      fn(parseSelf(doc, zodDatabaseDocumentContent));

    cfrDocument.on('change', insideFn);

    const off = () => {
      cfrDocument.off('change', insideFn);
    };

    return off;
  };

  const databaseDocument: DatabaseDocument = {
    addProperty,
    updateProperty,
    removeProperty,

    addItem,
    updateItem,
    removeItem,

    read,
    onChange,
  };

  return databaseDocument;
};
