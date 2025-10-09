<script setup lang="ts">
import type { EntryPath } from '@shared/lib/fileSystem';
import { MDButton, MDIconButton } from '../Button';
import { MDSymbol } from '../Icon';

const {} = defineProps<{
  path: EntryPath;
}>();

defineEmits<{
  click: [indexPath: number, name?: string];
}>();
</script>

<template>
  <div class="md-navigation-path">
    <MDIconButton
      tooltip="home"
      md-symbol-name="home"
      class="md-navigation-path__item"
      @click="$emit('click', -1)"
    />

    <MDSymbol class="md-navigation-path__separator" name="chevron_right" />

    <template v-for="(name, indexPath) in path" :key="indexPath">
      <MDSymbol
        v-if="indexPath > 0"
        class="md-navigation-path__separator"
        name="chevron_right"
      />

      <MDButton
        :label="name"
        color="text"
        class="md-navigation-path__item"
        @click="$emit('click', indexPath, name)"
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
