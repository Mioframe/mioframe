import type { TypeOf } from 'zod';
import { custom, record, union } from 'zod';
import {
  PROPERTY_TYPE_BOOLEAN,
  zodBooleanPropertyDescription,
} from './boolean';
import { zodPropertyId } from './general';
import { PROPERTY_TYPE_NUMBER, zodNumberPropertyDescription } from './number';
import { PROPERTY_TYPE_STRING, zodStringPropertyDescription } from './string';

// todo: каждый тип данных должен быть отдельным entity с конструктором, рендером и правилами, т.к. типы данных могут пополняться бесконечно
// или типы будут существовать только в библиотеке, т.к. нужен только базовый набор

/**
 * нужно описать интерфейсы для колонок. констурктор типа колонок
 * какие артифакты нужны для использования колонок
 * что записывеается в базу
 * правила создания значения
 * рендер (компонент отображения)
 */

export const zodAnyProperty = union([
  zodStringPropertyDescription,
  zodNumberPropertyDescription,
  zodBooleanPropertyDescription,
]);

export const zodPropertyType = custom<AnyProperty['type']>((data) =>
  zodAnyProperty.options.find((v) => v.shape.type.safeParse(data).success),
);

export type PropertyType = TypeOf<typeof zodPropertyType>;

export type AnyProperty = TypeOf<typeof zodAnyProperty>;

export const zodPropertiesMap = record(zodPropertyId, zodAnyProperty);

export type PropertiesMap = TypeOf<typeof zodPropertiesMap>;

export const ALL_TYPE_PROPERTIES = {
  PROPERTY_TYPE_STRING,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_BOOLEAN,
} as const;
