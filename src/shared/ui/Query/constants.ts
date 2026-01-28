import type { ValueOf } from 'type-fest';

export enum OPERATOR {
  $and = '$and',
  $or = '$or',
  $not = '$not',
  $nor = '$nor',
  $eq = '$eq',
  $ne = '$ne',
  $gt = '$gt',
  $gte = '$gte',
  $lt = '$lt',
  $lte = '$lte',
  $in = '$in',
  $nin = '$nin',
  $exists = '$exists',
  $type = '$type',
  $regex = '$regex',
  $mod = '$mod',
  $where = '$where',
  $all = '$all',
  $elemMatch = '$elemMatch',
  $size = '$size',
}

export type LogicalOperator = OPERATOR.$and | OPERATOR.$or;

export const OPERATOR_LABEL = {
  $and: 'and',
  $not: 'not',
  $or: 'or',
  $all: '$all',
  $elemMatch: '$elemMatch',
  $eq: '=',
  $exists: 'exists',
  $gt: '>',
  $gte: '>=',
  $in: '$in',
  $lt: '<',
  $lte: '<=',
  $mod: '$mod',
  $ne: '!=',
  $nin: '$nin',
  $nor: '$nor',
  $regex: '$regex',
  $size: '$size',
  $type: '$type',
  $where: '$where',
} satisfies Record<ValueOf<typeof OPERATOR>, string>;
