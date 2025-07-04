<script setup lang="ts">
import { zodIs } from '@shared/lib/validateZodScheme';
import { MDSymbol } from '@shared/ui/Icon';
import { isNil } from 'es-toolkit';
import { computed, toRefs } from 'vue';
import type { RelationProperty, RelationValue } from './model';
import { zodRelationValue } from './model';
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';

const props = defineProps<{
  value: unknown;
  property: RelationProperty;
  directory: DirectoryFSEntry;
}>();

const { directory, property, value } = toRefs(props);

defineSlots<{
  default: (p: {
    value: RelationValue;
    docHandle: AMDocHandle;
    directory: DirectoryFSEntry;
    viewId?: DatabaseViewId;
  }) => unknown;
}>();

const verifiedValue = computed(() =>
  zodIs(value.value, zodRelationValue) && value.value.length > 0
    ? value.value
    : undefined,
);

const directoryRepo = useDirectoryRepo(directory);

const relationDocumentId = computed(() => property.value.relation.documentId);

const relationViewId = computed(() => property.value.relation.viewId);

const relationDocHandle = computed(() =>
  directoryRepo.value?.map.get(relationDocumentId.value),
);
</script>

<template>
  <div class="relation-value">
    <MDSymbol
      v-if="isNil(verifiedValue)"
      name="unknown_med"
      class="relation-value__empty"
    />

    <template v-else-if="relationDocHandle">
      <slot
        :value="verifiedValue"
        :doc-handle="relationDocHandle"
        :directory="directory"
        :view-id="relationViewId"
      >
        {{ verifiedValue }}
      </slot>
    </template>
  </div>
</template>

<style lang="css" scoped>
.relation-value {
  display: inline-block;

  &__empty {
    opacity: 0.5;
  }
}
</style>
