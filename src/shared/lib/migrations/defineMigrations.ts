import { deepPutJsonObject } from '../changeObject';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- no restrictions
type MigrateFunction<T = any, R = any> = (input: T) => R;

// Вспомогательный тип для ограничения миграций
type MigrateConstraint<T, Ops extends MigrateFunction[]> = Ops extends []
  ? []
  : Ops extends [MigrateFunction<T, infer R>, ...infer Rest]
    ? Rest extends MigrateFunction[]
      ? [MigrateFunction<T, R>, ...MigrateConstraint<R, Rest>]
      : never
    : never;

// Вспомогательный тип для вычисления результата
type UpdateResult<T, Ops extends MigrateFunction[]> = Ops extends [
  MigrateFunction<T, infer R>,
  ...infer Rest,
]
  ? Rest extends MigrateFunction[]
    ? UpdateResult<R, Rest>
    : R
  : T;

/**
 * applying migration to data
 */
type CreateUpdatedData<Ops extends MigrateFunction[], T extends object> = (
  data: object,
  version?: number,
) => UpdateResult<T, Ops>;

/**
 * Creates a method for applying migrations
 * @argument migrations - list of migration methods
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
  ) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- there is nothing to break here
    migrations.slice(version).reduce(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- there is nothing to break here
      (data, migrate) => migrate(data),
      targetData,
    ) as UpdateResult<T, Ops>;

  const applyUpdate = (
    targetData: object,
    version: number = 0,
  ): UpdateResult<T, Ops> => {
    const newStateData = getLatestData(targetData, version);

    const updatedTarget: UpdateResult<T, Ops> = deepPutJsonObject(
      targetData,
      newStateData,
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- don't know why unsafe
    return updatedTarget;
  };

  return { getLatestData, applyUpdate };
}
