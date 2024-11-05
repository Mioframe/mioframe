<script setup lang="ts" generic="V extends View">
import type { View, ViewId } from '@shared/lib/databaseDocument';

defineProps<{
  views: Record<ViewId, V>;
}>();

defineSlots<{
  default(props: { id: ViewId; view: V }): unknown;
  before(): unknown;
  after(): unknown;
}>();
</script>

<template>
  <aside class="menu">
    <ul class="menu-list">
      <li v-for="(view, id) in views" :key="id">
        <slot :id :view>
          <span class="menu-item">
            {{ view.name }}
          </span>
        </slot>
      </li>

      <slot name="after" />
    </ul>
  </aside>
</template>
