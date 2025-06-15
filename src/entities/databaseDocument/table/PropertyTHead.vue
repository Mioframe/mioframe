<script
  setup
  lang="ts"
  generic="PT extends string, P extends GeneralProperty<PT>"
>
import type {
  GeneralProperty,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument/state/v1/property/general';
import type { PropertiesMap } from '@shared/lib/databaseDocument';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { computed } from 'vue';

const { properties } = defineProps<{
  properties: PropertiesMap<P>;
  showActionsColumn?: boolean;
}>();

defineSlots<{
  property(props: {
    property: PropertiesMap<P>[DatabasePropertyId];
    id: DatabasePropertyId;
  }): unknown;
}>();

const propertiesRef = computed(() => properties);

const propertiesCollection = useWrapStrictRecord(propertiesRef);
</script>

<template>
  <thead>
    <tr>
      <th v-if="showActionsColumn" />

      <th v-for="[id, property] in propertiesCollection" :key="id">
        <slot :id name="property" :property>
          {{ property.name }}
        </slot>
      </th>
    </tr>
  </thead>
</template>
