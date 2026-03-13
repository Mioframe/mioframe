import { deepPutJsonObject } from '../changeObject';
import { writableDeepClone } from '../writableDeepClone';

function isObject(value: unknown): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic type defaults are needed for migration function type inference
type MigrateFunction<T = any, R = any> = (input: T) => R;

// Type constraint: each migration must accept output of previous
type MigrateConstraint<T, Ops extends MigrateFunction[]> = Ops extends []
  ? []
  : Ops extends [MigrateFunction<T, infer R>, ...infer Rest]
    ? Rest extends MigrateFunction[]
      ? [MigrateFunction<T, R>, ...MigrateConstraint<R, Rest>]
      : never
    : never;

// Computes final type after all migrations
type UpdateResult<T, Ops extends MigrateFunction[]> = Ops extends [
  MigrateFunction<T, infer R>,
  ...infer Rest,
]
  ? Rest extends MigrateFunction[]
    ? UpdateResult<R, Rest>
    : R
  : T;

type CreateUpdatedData<Ops extends MigrateFunction[], T extends object> = (
  data: object,
  version?: number,
) => UpdateResult<T, Ops>;

/**
 * Define migrations with compile-time type safety
 *
 * Migration chain is validated: each migration must accept output of previous.
 * First migration accepts any type T.
 */
export function defineMigrations<
  T extends object,
  Ops extends MigrateFunction[],
>(
  ...migrations: Ops & MigrateConstraint<T, Ops>
): {
  getLatestData: CreateUpdatedData<Ops, T>;
  applyUpdate: (targetData: object, version?: number) => UpdateResult<T, Ops>;
} {
  const getLatestData: CreateUpdatedData<Ops, T> = (
    targetData: object,
    version: number = 0,
  ) => {
    const v = (version < 0 ? 0 : version) | 0;

    if (!isObject(targetData)) {
      throw new Error('[migrations] Invalid data: expected object');
    }

    if (v >= migrations.length) {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-return -- Generic type constraint requires assertion
      return targetData as UpdateResult<T, Ops>;
    }

    const data = writableDeepClone(targetData);
    const result = migrations.slice(v).reduce((currentData, migrate) => {
      const newData = migrate(currentData);
      if (!isObject(newData)) {
        throw new Error('[migrations] Migration returned invalid value');
      }
      return newData;
    }, data);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-return -- Generic type constraint requires assertion
    return result as UpdateResult<T, Ops>;
  };

  const applyUpdate = (
    targetData: object,
    version: number = 0,
  ): UpdateResult<T, Ops> => {
    const migrated = getLatestData(targetData, version);
    if (migrated !== targetData) {
      deepPutJsonObject(targetData, migrated);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-unsafe-return -- Generic type constraint requires assertion
    return targetData as UpdateResult<T, Ops>;
  };

  return { getLatestData, applyUpdate };
}
