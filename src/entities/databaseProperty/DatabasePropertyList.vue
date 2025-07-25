<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { toRefs } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const slots = defineSlots<{
  trailingIcon: (p: {
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
}>();

const propertiesMap = useDatabasePropertiesMap(docHandle);
</script>

<template>
  <MDListContainer>
    <MDListItem
      v-for="[propertyId, property] in propertiesMap.entries"
      :key="propertyId"
      :headline="property.name"
      :supporting-text="String(property.type)"
    >
      <template v-if="!!slots.trailingIcon" #trailingIcon>
        <slot
          name="trailingIcon"
          :property="property"
          :property-id="propertyId"
        />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
