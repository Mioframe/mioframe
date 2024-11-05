import type { PartialDeep } from 'type-fest';
import { putObject } from '../changeObject';
import type { CFRDocument, DocumentContent } from '../cfrDocument';
import { parseSelf } from '../validateZodScheme';
import type { Item } from './item';
import { generateItemId, type ItemId } from './item';
import {
  type UnknownProperty,
  type PropertyId,
  generatePropertyId,
} from './property';
import {
  type DatabaseDocument,
  type DatabaseDocumentContent,
  zodDatabaseDocumentContent,
  zodDatabaseType,
} from './types';
import { migrationsMap } from './migrations';
import { createLogger } from '../logger';
import { get, isNumber, isObject, keys, toInteger } from 'lodash-es';
import { generateViewId, type View } from './view';
import { ZodError } from 'zod';

const { debug } = createLogger('createDatabaseDocument');

const readVersion = (doc: unknown) => {
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

  return currentVersion;
};

const latestVersion = Math.max(...keys(migrationsMap).map(toInteger));

/**
 * Обновление версии документа, проведение миграций
 * @param doc
 * @returns
 */
const documentUpdate = (doc: DocumentContent): DatabaseDocumentContent => {
  const currentVersion: number = readVersion(doc);

  if (currentVersion in migrationsMap) {
    migrationsMap[currentVersion](doc);
    return documentUpdate(doc);
  }
  return parseSelf(doc, zodDatabaseDocumentContent);
};

export const createDatabaseDocument = (
  cfrDocument: CFRDocument,
): DatabaseDocument => {
  const migrate = async (doc: unknown): Promise<DatabaseDocumentContent> => {
    debug('migrate', doc);

    const currentVersion: number = readVersion(doc);

    debug('migrate', currentVersion, latestVersion);

    try {
      if (latestVersion >= currentVersion) {
        cfrDocument.change((doc) => {
          documentUpdate(doc);
        });
        return parseSelf(await cfrDocument.doc(), zodDatabaseDocumentContent);
      }

      return parseSelf(doc, zodDatabaseDocumentContent);
    } catch (error) {
      if (error instanceof ZodError) {
        return fixDocument(cfrDocument, error);
      }
      throw error;
    }
  };

  /**
   * Исправление документа, очистка от невалидных данных
   * @param doc
   */
  const fixDocument = async (cfrDocument: CFRDocument, error: ZodError) => {
    debug('fixDocument', { error, cfrDocument });

    const { issues } = error;

    issues.forEach(({ path, fatal }) => {
      debug('issues', { path });
      const parentPath = path.slice(0, -1);
      const lastKey = path.at(-1);
      if (fatal && lastKey) {
        cfrDocument.change((doc) => {
          const parentObj = get(doc, parentPath);
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-unsafe-member-access -- remove invalid data
          delete parentObj[lastKey];
        });
      }
    });

    const newDoc = await cfrDocument.doc();

    try {
      return parseSelf(newDoc, zodDatabaseDocumentContent);
    } catch (error) {
      if (error instanceof ZodError) {
        return fixDocument(cfrDocument, error);
      }
      throw error;
    }
  };

  const addProperty = (column: UnknownProperty): PropertyId => {
    const columnId = generatePropertyId();

    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      body.properties[columnId] = column;
    });

    return columnId;
  };

  const updateProperty = (
    columnId: PropertyId,
    column: PartialDeep<UnknownProperty>,
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

    const migratedDoc = await migrate(doc);

    debug('read', { migratedDoc });

    return migratedDoc;
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

  const addView = (view: View) => {
    const viewId = generateViewId();

    cfrDocument.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body, { views: { [viewId]: view } });
    });

    return viewId;
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

    addView,
  };

  return databaseDocument;
};
