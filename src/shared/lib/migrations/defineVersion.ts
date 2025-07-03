import type { core, output } from 'zod/v4-mini';

/**
 * Определение нового состояния с мутацией
 * @param schema - схема нового состояния
 * @param up - метод создание нового состояния из старого, должна вернуть новый объект не мутируя старый.
 * @returns
 */
export const defineVersion = <Old, Z extends core.$ZodObject>(
  schema: Z,
  up: (old: Old) => output<Z>,
) => ({
  schema,
  up,
});
