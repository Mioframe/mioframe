import type { EmptyObject } from 'type-fest';

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
type MigrationResult<T, Ops extends MigrateFunction[]> = Ops extends [
  MigrateFunction<T, infer R>,
  ...infer Rest,
]
  ? Rest extends MigrateFunction[]
    ? MigrationResult<R, Rest>
    : R
  : T;

/**
 * applying migration to data
 */
type ApplyMigration<Ops extends MigrateFunction[], T extends EmptyObject> = (
  data: object,
  version?: number,
) => MigrationResult<T, Ops>;

/**
 * Creates a method for applying migrations
 * @argument migrations - list of migration methods
 */
export function defineMigration<
  T extends object,
  Ops extends MigrateFunction[],
>(...migrations: Ops & MigrateConstraint<T, Ops>): ApplyMigration<Ops, T> {
  return (targetData: object, version: number = 0) =>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- there is nothing to break here
    migrations.slice(version).reduce(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- there is nothing to break here
      (data, migrate) => migrate(data),
      targetData,
    ) as MigrationResult<T, Ops>;
}
