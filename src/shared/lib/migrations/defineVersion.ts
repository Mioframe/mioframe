import type { core, output } from 'zod/v4-mini';

/**
 * Определение нового состояния с мутацией
 * @param schema - схема нового состояния
 * @param up - миграция старого состояния в новое, должна возвращать строго старое изменённое состояние без создания нового
 * @returns
 */
export const defineVersion = <Old, Z extends core.$ZodObject>(
  schema: Z,
  up: (old: Old) => output<Z>,
) => ({
  schema,
  up,
});
