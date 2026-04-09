import type {
  DatabaseFilter,
  DatabaseItem,
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

const isUnaryOperator = (key: string): key is UNARY_FILTER_OPERATOR => key in UNARY_FILTER_OPERATOR;

const isLogicalOperator = (key: string): key is LOGICAL_FILTER_OPERATOR =>
  key in LOGICAL_FILTER_OPERATOR;

const matchEffectiveExists = (effectiveValue: unknown, exists: unknown) =>
  exists ? effectiveValue !== undefined : effectiveValue === undefined;

type ParsedFieldOperatorCondition = {
  existsCondition: unknown;
  hasExistsCondition: boolean;
  unaryCondition: Record<string, unknown> | undefined;
};

const createLogicalFilterMatcher = (
  operator: LOGICAL_FILTER_OPERATOR,
  value: unknown,
  properties: DatabaseUnknownPropertiesMap | undefined,
): ((item: DatabaseItem) => boolean) => {
  if (!isArray(value)) {
    return () => true;
  }

  const nestedMatcherList = value.map((nestedFilter) =>
    isUnknownRecord(nestedFilter)
      ? createDatabaseFilterMatcher(nestedFilter, properties)
      : () => true,
  );

  return operator === LOGICAL_FILTER_OPERATOR.$and
    ? (item) => nestedMatcherList.every((matcher) => matcher(item))
    : (item) => nestedMatcherList.some((matcher) => matcher(item));
};

const getFieldConditionOperators = (condition: unknown): Record<string, unknown> => {
  if (isArray(condition) || !isUnknownRecord(condition)) {
    throw new TypeError('Database field condition must be an operator record');
  }

  return condition;
};

const parseFieldOperatorCondition = (conditionValue: unknown): ParsedFieldOperatorCondition => {
  const condition = getFieldConditionOperators(conditionValue);
  let existsCondition: unknown;
  let hasExistsCondition = false;
  let unaryCondition: Record<string, unknown> | undefined;

  for (const [key, value] of recordEntries(condition)) {
    if (key === '$exists') {
      hasExistsCondition = true;
      existsCondition = value;
      continue;
    }

    unaryCondition ??= {};
    unaryCondition[key] = value;
  }

  return {
    existsCondition,
    hasExistsCondition,
    unaryCondition,
  };
};

const createUnaryConditionPredicate = (unaryCondition: Record<string, unknown> | undefined) =>
  unaryCondition ? sift(unaryCondition) : undefined;

const createFieldFilterMatcher = (
  propertyId: DatabasePropertyId,
  conditionValue: unknown,
  properties: DatabaseUnknownPropertiesMap | undefined,
): ((item: DatabaseItem) => boolean) => {
  const { existsCondition, hasExistsCondition, unaryCondition } =
    parseFieldOperatorCondition(conditionValue);
  const predicate = createUnaryConditionPredicate(unaryCondition);

  return (item) => {
    const effectiveValue = getDatabaseEffectiveValue(item, propertyId, properties?.[propertyId]);

    if (hasExistsCondition && !matchEffectiveExists(effectiveValue, existsCondition)) {
      return false;
    }

    return predicate ? predicate(effectiveValue) : true;
  };
};

const createRootUnaryFilterMatcher = (
  operator: UNARY_FILTER_OPERATOR,
  value: unknown,
): ((item: DatabaseItem) => boolean) => {
  const predicate = sift({ [operator]: value });

  return (item) => predicate(item);
};

export const createDatabaseFilterMatcher = (
  filter: DatabaseFilter,
  properties: DatabaseUnknownPropertiesMap | undefined,
): ((item: DatabaseItem) => boolean) => {
  const matcherList = recordEntries(filter).map(([key, value]) => {
    if (isLogicalOperator(key)) {
      return createLogicalFilterMatcher(key, value, properties);
    }

    if (!isUnaryOperator(key)) {
      return createFieldFilterMatcher(key, value, properties);
    }

    return createRootUnaryFilterMatcher(key, value);
  });

  return (item) => matcherList.every((matcher) => matcher(item));
};
