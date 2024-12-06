import type { PartialDeep } from 'type-fest';
import { putObject } from '../changeObject';
import type { DocumentContent } from '../cfrDocument';
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
import { get, isNil, isNumber, isObject } from 'lodash-es';
import type { ViewId } from './view';
import { generateViewId, type View } from './view';
import { ZodError } from 'zod';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { computed, toValue } from 'vue';
import { pickDictionaryBy } from '../pickDictionaryBy';
import type { MaybeRef } from '@vueuse/core';
import type { ViewsMap } from './versions';

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

export const useDatabaseDocument = (
  reactiveCFRDocument: MaybeRef<ReactiveCFRDocument | undefined>,
): DatabaseDocument => {
  // миграции запускать только при записи
  // const migrate = async (doc: unknown): Promise<DatabaseDocumentContent> => {
  //   debug('migrate', doc);

  //   const currentVersion: number = readVersion(doc);

  //   debug('migrate', currentVersion, latestVersion);

  //   try {
  //     if (latestVersion >= currentVersion) {
  //       reactiveCFRDocument.change((doc) => {
  //         documentUpdate(doc);
  //       });
  //       return parseSelf(reactiveCFRDocument.doc, zodDatabaseDocumentContent);
  //     }

  //     return parseSelf(doc, zodDatabaseDocumentContent);
  //   } catch (error) {
  //     if (error instanceof ZodError) {
  //       return fixDocument(reactiveCFRDocument, error);
  //     }
  //     throw error;
  //   }
  // };

  // const documentChange = () => {};

  /**
   * Исправление документа, очистка от невалидных данных
   * @param doc
   */
  const fixDocument = async (
    // todo: подумать, нужен ли фикс документа.
    document: ReactiveCFRDocument,
    error: ZodError,
  ) => {
    debug('fixDocument', { error, cfrDocument: document });

    const { issues } = error;

    if (issues.length) {
      try {
        const newDoc = await document.change((doc) => {
          issues.forEach(({ path, fatal }) => {
            debug('issues', { path });
            const parentPath = path.slice(0, -1);
            const lastKey = path.at(-1);
            if (fatal && lastKey) {
              const parentObj = get(doc, parentPath);
              // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @typescript-eslint/no-unsafe-member-access -- remove invalid data
              delete parentObj[lastKey];
            }
          });
        })?.();

        return parseSelf(newDoc, zodDatabaseDocumentContent);
      } catch (error) {
        if (error instanceof ZodError) {
          return fixDocument(document, error);
        }
        throw error;
      }
    } else {
      throw new Error('Unable to fix document, no list of errors');
    }
  };

  const addProperty = (column: UnknownProperty): PropertyId => {
    const columnId = generatePropertyId();

    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      body.properties[columnId] = column;
    });

    return columnId;
  };

  const updateProperty = (
    columnId: PropertyId,
    column: PartialDeep<UnknownProperty>,
  ) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.properties, { [columnId]: column });
    });
  };

  const removeProperty = (propertyId: PropertyId) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- delete any property
      delete body.properties[propertyId];

      // todo: добавить параметр очистки data от значений
    });
  };

  const addItem = (item: Item) => {
    const itemId = generateItemId();

    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: item });
    });

    return itemId;
  };

  const updateItem = (itemId: ItemId, partialItem: PartialDeep<Item>) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: partialItem });
    });
  };

  const removeItem = (itemId: ItemId) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body.data, { [itemId]: undefined });
    });
  };

  const addView = (view: View) => {
    const viewId = generateViewId();

    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      putObject(body, { views: { [viewId]: view } });
    });

    return viewId;
  };

  const removeView = (viewId: ViewId) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      const { body } = documentUpdate(doc);

      delete body.views?.[viewId];
    });
  };

  const content = computed(
    () =>
      zodDatabaseDocumentContent.safeParse(toValue(reactiveCFRDocument)?.doc)
        .data,
  );

  const properties = computed(() =>
    content.value?.body.properties
      ? pickDictionaryBy(content.value.body.properties, (v) => !isNil(v))
      : undefined,
  );

  const views = computed((): ViewsMap | undefined => content.value?.body.views);

  const data = computed(() => content.value?.body.data);

  const databaseDocument: DatabaseDocument = {
    content,
    properties,
    views,
    data,

    addProperty,
    updateProperty,
    removeProperty,

    addItem,
    updateItem,
    removeItem,

    addView,
    removeView,
  };

  return databaseDocument;
};
