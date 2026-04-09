import * as z from 'zod/mini';
import { zodDatabasePropertyId, zodDatabaseValue } from '../..';

export enum UNARY_FILTER_OPERATOR {
  $eq = '$eq',
  $ne = '$ne',
  $lt = '$lt',
  $gt = '$gt',
  $lte = '$lte',
  $gte = '$gte',
}

export const zodUNARY_FILTER_OPERATOR = z.enum(
  UNARY_FILTER_OPERATOR,
  'Invalid UNARY_FILTER_OPERATOR',
);

export const zodDatabaseUnaryCondition = z.partialRecord(
  zodUNARY_FILTER_OPERATOR,
  zodDatabaseValue,
  'Invalid DatabaseUnaryCondition',
);

export type DatabaseUnaryCondition = z.output<typeof zodDatabaseUnaryCondition>;

export enum LOGICAL_FILTER_OPERATOR {
  $and = '$and',
  $or = '$or',
}

export const zodLOGICAL_FILTER_OPERATOR = z.enum(
  LOGICAL_FILTER_OPERATOR,
  'Invalid LOGICAL_FILTER_OPERATOR',
);

export const zodDatabaseLogicalCondition: z.ZodMiniType<
  Partial<Record<LOGICAL_FILTER_OPERATOR, DatabaseLogicalFilterList>>
> = z.lazy(() =>
  z.partialRecord(
    zodLOGICAL_FILTER_OPERATOR,
    zodDatabaseLogicalFilterList,
    'Invalid DatabaseLogicalCondition',
  ),
);

export const zodDatabaseFieldFilter = z.partialRecord(
  zodDatabasePropertyId,
  zodDatabaseUnaryCondition,
  'Invalid DatabaseFieldFilter',
);

export type DatabaseFieldSelectorFilter = z.output<typeof zodDatabaseFieldFilter>;

export type DatabaseGroupCondition = z.output<typeof zodDatabaseLogicalCondition>;

export const zodDatabaseNestedFilter = z.union([
  zodDatabaseFieldFilter,
  zodDatabaseUnaryCondition,
  zodDatabaseLogicalCondition,
]);

export type DatabaseNestedFilter = z.output<typeof zodDatabaseNestedFilter>;

export const zodDatabaseLogicalFilterList = z
  .array(zodDatabaseNestedFilter, 'Invalid DatabaseLogicalFilterList')
  .check(z.minLength(1, 'DatabaseLogicalFilterList must be a nonempty'));

export type DatabaseLogicalFilterList = DatabaseNestedFilter[];

export const zodDatabaseFilter = z.union([zodDatabaseFieldFilter, zodDatabaseLogicalCondition]);

export type DatabaseFilter = z.output<typeof zodDatabaseFilter>;
