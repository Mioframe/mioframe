import type { TypeOf } from 'zod';
import { record, union } from 'zod';
import { zodBooleanColumnDescription } from './boolean';
import { zodColumnId } from './general';
import { zodNumberColumnDescription } from './number';
import { zodStringColumnDescription } from './string';

// todo: каждый тип данных должен быть отдельным entity с конструктором, рендером и правилами, т.к. типы данных могут пополняться бесконечно
// или типы будут существовать только в библиотеке, т.к. нужен только базовый набор

/**
 * нужно описать интерфейсы для колонок. констурктор типа колонок
 * какие артифакты нужны для использования колонок
 * что записывеается в базу
 * правила создания значения
 * рендер (компонент отображения)
 */

export const zodAnyColumn = union([
  zodStringColumnDescription,
  zodNumberColumnDescription,
  zodBooleanColumnDescription,
]);

export type AnyColumn = TypeOf<typeof zodAnyColumn>;

export const zodColumnMap = record(zodColumnId, zodAnyColumn);

export type ColumnMap = TypeOf<typeof zodColumnMap>;
