import type { EntryPath } from '@shared/lib/fileSystem';
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
import { defineSubscribeByQueryService } from '@shared/lib/subscriptions';
import type { PatchSource } from '@shared/lib/changeObject';
import { deepPatchJsonObject } from '@shared/lib/changeObject';
import { stringPath } from '../directories';
import { DomainError } from '@shared/lib/error';

export const useDatabasePropertiesService = (
  getDatabaseBody: (
    path: EntryPath,
    documentId: AMDocumentId,
  ) => DatabaseState | DomainError | undefined,
  changeDatabase: (
    path: EntryPath,
    documentId: AMDocumentId,
    callback: (state: DatabaseState) => unknown,
  ) => Promise<void>,
) => {
  const getDatabaseProperties = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): undefined | DomainError | DatabaseUnknownPropertiesMap => {
    const database = getDatabaseBody(path, documentId);
    if (database instanceof DomainError) {
      return database;
    }
    if (database) {
      return database.properties;
    }
  };

  const get = (
    path: EntryPath,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
  ): DomainError | DatabaseUnknownProperty | undefined => {
    const properties = getDatabaseProperties(path, documentId);
    if (properties instanceof DomainError) {
      return properties;
    }
    if (properties) {
      return strictRecordGet(properties, id);
    }
  };

  const post = async (
    path: EntryPath,
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
    path: EntryPath,
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
      deepPatchJsonObject(oldProperty, property);
    });

  const getSize = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): number | DomainError | undefined => {
    const properties = getDatabaseProperties(path, documentId);

    if (properties instanceof DomainError) {
      return properties;
    }

    if (properties) {
      return strictRecordSize(properties);
    }
  };

  const getDatabasePropertiesIdList = (
    path: EntryPath,
    documentId: AMDocumentId,
  ): DomainError | DatabasePropertyId[] | undefined => {
    const properties = getDatabaseProperties(path, documentId);

    if (properties) {
      if (properties instanceof DomainError) {
        return properties;
      }

      return Array.from(strictRecordIterableKeys(properties)());
    }

    return undefined;
  };

  const remove = (
    path: EntryPath,
    documentId: AMDocumentId,
    id: DatabasePropertyId,
  ) =>
    changeDatabase(path, documentId, (state) => {
      strictRecordRemove(state.properties, id);
    });

  return {
    get,
    subscribeGet: defineSubscribeByQueryService(get),

    subscribeDatabaseProperties: defineSubscribeByQueryService(
      getDatabaseProperties,
    ),

    subscribeDatabasePropertiesIdList: defineSubscribeByQueryService(
      getDatabasePropertiesIdList,
    ),

    subscribeSize: defineSubscribeByQueryService(getSize),

    post,
    patch,
    remove,
  };
};
