import type { core, output } from 'zod/v4-mini';

/**
 * Определение нового состояния с мутацией
 * @param zod - схема нового состояния
 * @param migration - миграция старого состояния в новое, должна возвращать строго старое изменённое состояние без создания нового
 * @returns
 */
export const defineVersionState = <OS, Z extends core.$ZodType>(
  zod: Z,
  migration: (oldState: OS) => output<Z>,
) => ({
  zod,
  migration,
});
