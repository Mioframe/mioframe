import type {
  DatabaseFilter,
  DatabaseItem,
  DatabaseLogicalFilterList,
  DatabasePropertyId,
  DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument';
import {
  LOGICAL_FILTER_OPERATOR,
  UNARY_FILTER_OPERATOR,
  getDatabaseEffectiveValue,
} from '@shared/lib/databaseDocument';
import { isUnknownRecord } from '@shared/lib/changeObject';
import { recordEntries } from '@shared/lib/objectEntries';
import { isArray } from '@shared/lib/typeGuards';
import sift from 'sift';

const isUnaryOperator = (key: string): key is UNARY_FILTER_OPERATOR =>
  key in UNARY_FILTER_OPERATOR;

const isLogicalOperator = (key: string): key is LOGICAL_FILTER_OPERATOR =>
  key in LOGICAL_FILTER_OPERATOR;

const createUnaryConditionMatcher = (
  propertyId: DatabasePropertyId,
  condition: Record<string, unknown>,
  properties: DatabaseUnknownPropertiesMap | undefined,
): ((item: DatabaseItem) => boolean) => {
  const predicate = sift(condition);

  return (item) => {
    const effectiveValue = getDatabaseEffectiveValue(
      item,
      propertyId,
      properties?.[propertyId],
    );

    if ('$exists' in condition) {
      return condition.$exists
        ? effectiveValue !== undefined
        : effectiveValue === undefined;
    }

    return predicate(effectiveValue);
  };
};

const createLogicalFilterListMatcher = (
  filters: DatabaseLogicalFilterList,
  properties: DatabaseUnknownPropertiesMap | undefined,
): ((item: DatabaseItem) => boolean)[] =>
  filters.map((filter) => createDatabaseFilterMatcher(filter, properties));

const resolveUnaryCondition = (value: unknown): Record<string, unknown> => {
  if (isArray(value) || !isUnknownRecord(value)) {
    return {};
  }

  return value;
};

export const createDatabaseFilterMatcher = (
  filter: DatabaseFilter,
  properties: DatabaseUnknownPropertiesMap | undefined,
): ((item: DatabaseItem) => boolean) => {
  const matcherList = recordEntries(filter).map(([key, value]) => {
    if (isLogicalOperator(key)) {
      if (!isArray(value)) {
        return () => true;
      }

      const nestedMatcherList = createLogicalFilterListMatcher(
        value,
        properties,
      );

      return key === LOGICAL_FILTER_OPERATOR.$and
        ? (item: DatabaseItem) =>
            nestedMatcherList.every((matcher) => matcher(item))
        : (item: DatabaseItem) =>
            nestedMatcherList.some((matcher) => matcher(item));
    }

    if (isUnaryOperator(key)) {
      const predicate = sift({ [key]: value });

      return (item: DatabaseItem) => predicate(item);
    }

    return createUnaryConditionMatcher(
      key,
      resolveUnaryCondition(value),
      properties,
    );
  });

  return (item) => matcherList.every((matcher) => matcher(item));
};
