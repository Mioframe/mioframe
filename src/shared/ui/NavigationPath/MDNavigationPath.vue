<script setup lang="ts" generic="T extends { name: string }">
import { MDButton } from '../Button';
import { MDSymbol } from '../Icon';

const {} = defineProps<{
  path: T[];
}>();

defineEmits<{
  click: [indexPath: number, item: T];
}>();
</script>

<template>
  <div class="md-navigation-path">
    <template v-for="(item, indexPath) in path" :key="indexPath">
      <MDSymbol
        v-if="indexPath > 0"
        class="md-navigation-path__separator"
        name="chevron_right"
      />

      <MDButton
        :label="item.name"
        color="text"
        class="md-navigation-path__item"
        @click="$emit('click', indexPath, item)"
      />
    </template>
  </div>
</template>

<style lang="css" scoped>
.md-navigation-path {
  display: flex;
  flex-wrap: wrap;
  pointer-events: none;

  &__separator {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  &__item {
    pointer-events: auto;
  }
}
</style>
