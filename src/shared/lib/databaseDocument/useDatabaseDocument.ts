import type { PartialDeep } from 'type-fest';
import { putObject } from '../changeObject';
import { checkSchema, is } from '../validateZodScheme';
import type { Item } from './item';
import { generateItemId, type ItemId } from './item';
import {
  type UnknownProperty,
  type PropertyId,
  generatePropertyId,
} from './property';
import type { DatabaseTypeDocument } from './types';
import {
  type DatabaseDocument,
  type DatabaseDocumentWithContent,
  zodDatabaseDocumentWithContent,
  zodDatabaseTypeDocument,
} from './types';
import { applyDatabaseDocumentMigration } from './migrations';
import { createLogger } from '../logger';
import { get, isNil } from 'lodash-es';
import type { ViewId } from './view';
import { generateViewId, type View } from './view';
import { ZodError } from 'zod';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { computed, toValue } from 'vue';
import { pickDictionaryBy } from '../pickDictionaryBy';
import type { MaybeRef } from '@vueuse/core';
import type { ViewsMap } from './versions';

const { debug } = createLogger('createDatabaseDocument');

/**
 * Обновление версии документа, проведение миграций
 * @param doc
 * @returns
 */
const documentUpdate = (
  doc: DatabaseTypeDocument,
): DatabaseDocumentWithContent => {
  return applyDatabaseDocumentMigration(doc);
};

export const useDatabaseDocument = (
  reactiveCFRDocument: MaybeRef<ReactiveCFRDocument | undefined>,
): DatabaseDocument => {
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

        return checkSchema(newDoc, zodDatabaseDocumentWithContent);
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
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);
        putObject(databaseDocument, {
          body: {
            properties: {
              [columnId]: column,
            },
          },
        });
      }
    });

    return columnId;
  };

  const updateProperty = (
    columnId: PropertyId,
    column: PartialDeep<UnknownProperty>,
  ) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        putObject(databaseDocument, {
          body: {
            properties: { [columnId]: column },
          },
        });
      }
    });
  };

  const removeProperty = (propertyId: PropertyId) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        delete databaseDocument.body?.properties[propertyId];

        // todo: добавить параметр очистки data от значений
      }
    });
  };

  const addItem = (item: Item) => {
    const itemId = generateItemId();

    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        putObject(databaseDocument, {
          body: {
            data: { [itemId]: item },
          },
        });
      }
    });

    return itemId;
  };

  const updateItem = (itemId: ItemId, partialItem: PartialDeep<Item>) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        putObject(databaseDocument, {
          body: {
            data: { [itemId]: partialItem },
          },
        });
      }
    });
  };

  const removeItem = (itemId: ItemId) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        putObject(databaseDocument, {
          body: {
            data: { [itemId]: undefined },
          },
        });
      }
    });
  };

  const addView = (view: View) => {
    const viewId = generateViewId();

    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        putObject(databaseDocument, { body: { views: { [viewId]: view } } });
      }
    });

    return viewId;
  };

  const removeView = (viewId: ViewId) => {
    toValue(reactiveCFRDocument)?.change((doc) => {
      if (is(doc, zodDatabaseTypeDocument)) {
        const databaseDocument = documentUpdate(doc);

        delete databaseDocument.body?.views?.[viewId];
      }
    });
  };

  const content = computed(
    () =>
      zodDatabaseDocumentWithContent.safeParse(
        toValue(reactiveCFRDocument)?.doc,
      ).data,
  );

  const properties = computed(() =>
    content.value?.body?.properties
      ? pickDictionaryBy(content.value.body.properties, (v) => !isNil(v))
      : undefined,
  );

  const views = computed(
    (): ViewsMap | undefined => content.value?.body?.views,
  );

  const data = computed(() => content.value?.body?.data);

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
