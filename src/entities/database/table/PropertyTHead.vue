<script
  setup
  lang="ts"
  generic="PT extends string, P extends GeneralProperty<PT>"
>
import type {
  GeneralProperty,
  PropertyId,
} from '@shared/lib/databaseDocument/property/general';
import type { PropertiesMap } from '@shared/lib/databaseDocument/property/property';

defineProps<{
  properties: PropertiesMap<P>;
  showActionsColumn?: boolean;
}>();

defineSlots<{
  property(props: {
    property: PropertiesMap<P>[PropertyId];
    id: PropertyId;
  }): unknown;
}>();
</script>

<template>
  <thead>
    <tr>
      <th v-if="showActionsColumn" />

      <th v-for="(property, id) in properties" :key="id">
        <slot :id name="property" :property>
          {{ property.name }}
        </slot>
      </th>
    </tr>
  </thead>
</template>
