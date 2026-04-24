export {
  PROPERTY_TYPE_RELATION,
  createRelationProperty,
  zodRelationProperty,
  zodRelationValue,
  type Relation,
  type RelationProperty,
  type RelationValue,
  type ParentRelation,
} from './model';
export { default as RelationValueInline } from './RelationValueInline.vue';
export { default as RelationValueField } from './RelationValueField.vue';
export { default as RelationPropertyField } from './RelationPropertyField.vue';
export { default as RelationPropertySettingsSection } from './RelationPropertySettingsSection.vue';
export { useRelationProperty } from './useRelationProperty';
