<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { MDButton, MDIconButton } from '../Button';
import { MDSymbol } from '../Icon';
import { PathUtils } from '@shared/lib/virtualFileSystem';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

const emit = defineEmits<{
  click: [path: string];
}>();

const pathArray = computed(() => path.value.split(PathUtils.SEPARATOR));

const onClickPath = (index: number) => {
  emit('click', PathUtils.join(...pathArray.value.slice(0, index + 1)));
};
</script>

<template>
  <div class="md-navigation-path">
    <template v-for="(name, indexPath) in pathArray" :key="indexPath">
      <MDIconButton
        v-if="indexPath === 0"
        tooltip="home"
        md-symbol-name="home"
        class="md-navigation-path__item"
        @click="onClickPath(indexPath)"
      />

      <template v-else>
        <MDSymbol class="md-navigation-path__separator" name="chevron_right" />

        <MDButton
          :label="name"
          color="text"
          class="md-navigation-path__item"
          @click="onClickPath(indexPath)"
        />
      </template>
    </template>
  </div>
</template>

<style lang="css" scoped>
.md-navigation-path {
  display: flex;
  flex-wrap: wrap;
  pointer-events: none;
  align-items: center;

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
