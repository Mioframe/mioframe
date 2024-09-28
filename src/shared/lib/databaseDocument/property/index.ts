export { type PropertyId, generatePropertyId, zodPropertyId } from './general';
export {
  type StringPropertyDescription,
  createStringColumn,
  PROPERTY_TYPE_STRING,
} from './string';
export {
  type NumberPropertyDescription,
  createNumberColumn,
  PROPERTY_TYPE_NUMBER,
} from './number';
export {
  type BooleanPropertyDescription,
  createBooleanColumn,
  PROPERTY_TYPE_BOOLEAN,
} from './boolean';
export type {
  AnyProperty,
  PropertiesMap,
  ALL_TYPE_PROPERTIES,
  PropertyType,
  zodAnyProperty,
  zodPropertiesMap,
  zodPropertyType,
} from './property';
