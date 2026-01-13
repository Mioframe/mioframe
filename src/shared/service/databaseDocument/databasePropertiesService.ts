import type { AMDocumentId } from '@shared/lib/automerge';
import {
  generatePropertyId,
  type DatabasePropertyId,
  type DatabaseState,
  type DatabaseUnknownPropertiesMap,
  type DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import {
  strictRecordGet,
  strictRecordIterableKeys,
  strictRecordRemove,
  strictRecordSet,
  strictRecordSize,
} from '@shared/lib/strictRecord';
import type { PatchSource } from '@shared/lib/changeObject';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { stringPath } from '../directories';

export const useDatabasePropertiesService = (
  getDatabaseBody: (
    path: string,
    documentId: AMDocumentId,
  ) => Promise<DatabaseState | undefined>,
  changeDatabase: (
    path: string,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<void>,
) => {
  const getDatabaseProperties = async (
    path: string,
    documentId: AMDocumentId,
  ): Promise<undefined | DatabaseUnknownPropertiesMap> => {
    const database = await getDatabaseBody(path, documentId);
    if (database) {
      return database.properties;
    }

    return undefined;
  };

  const get = async (
    path: string,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
  ): Promise<DatabaseUnknownProperty | undefined> => {
    const properties = await getDatabaseProperties(path, documentId);
    if (properties) {
      return strictRecordGet(properties, id);
    }

    return undefined;
  };

  const post = async (
    path: string,
    documentId: AMDocumentId,
    property: DatabaseUnknownProperty,
    id: DatabasePropertyId = generatePropertyId(),
  ) => {
    await changeDatabase(path, documentId, (state) => {
      strictRecordSet(state.properties, id, property);
    });

    return id;
  };

  const patch = <T extends DatabaseUnknownProperty>(
    path: string,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
    property: PatchSource<T>,
  ) =>
    changeDatabase(path, documentId, (state) => {
      const oldProperty = state.properties[id];
      if (!oldProperty) {
        throw new Error(
          `there is no property ${id} in document ${stringPath(path)} ${documentId}`,
        );
      }
      void deepPatchJsonObject(oldProperty, property);
    });

  const getSize = async (
    path: string,
    documentId: AMDocumentId,
  ): Promise<number | undefined> => {
    const properties = await getDatabaseProperties(path, documentId);

    if (properties) {
      return strictRecordSize(properties);
    }

    return undefined;
  };

  const getDatabasePropertiesIdList = async (
    path: string,
    documentId: AMDocumentId,
  ): Promise<DatabasePropertyId[] | undefined> => {
    const properties = await getDatabaseProperties(path, documentId);

    if (properties) {
      return Array.from(strictRecordIterableKeys(properties)());
    }

    return undefined;
  };

  const remove = (
    path: string,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
  ) =>
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state.properties, id);
    });

  return {
    get,
    getSize,
    getDatabasePropertiesIdList,

    post,
    patch,
    remove,
  };
};
