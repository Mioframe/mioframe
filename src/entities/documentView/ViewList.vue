<script setup lang="ts">
import type { View, ViewId } from '@shared/lib/databaseDocument';
import type { ViewsMap } from '@shared/lib/databaseDocument/versions';
import TreeIterable from '@shared/ui/TreeMenu/TreeIterable.vue';
import { computed } from 'vue';

const props = defineProps<{
  views: ViewsMap;
}>();

const slots = defineSlots<{
  default(props: { id: ViewId; view: View }): unknown;
  before(): unknown;
  after(): unknown;
}>();

const collection = computed(() => props.views);
</script>

<template>
  <section class="menu">
    <TreeIterable :collection>
      <template #item="{ item: view, key }">
        <slot :id="key" :view>
          <span> {{ view.name }} </span>
        </slot>
      </template>

      <template v-if="!!slots.after">
        <slot name="after" />
      </template>
    </TreeIterable>
  </section>
</template>
