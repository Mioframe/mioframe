<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { MDButton, MDIconButton } from '../Button';
import { MDSymbol } from '../Icon';
import { PathUtils } from '@shared/lib/virtualFileSystem';

const props = withDefaults(
  defineProps<{
    path: string;
    omitCurrent?: boolean | undefined;
  }>(),
  {
    omitCurrent: true,
  },
);

const emit = defineEmits<{
  click: [path: string];
  clickHome: [];
}>();

const { path, omitCurrent } = toRefs(props);

const pathSegments = computed(() =>
  PathUtils.split(path.value).map((name, index, array) => ({
    name,
    path: PathUtils.join(PathUtils.SEPARATOR, ...array.slice(0, index + 1)),
  })),
);

const visibleSegments = computed(() =>
  omitCurrent.value ? pathSegments.value.slice(0, -1) : pathSegments.value,
);

const onClickHome = () => {
  emit('clickHome');
};

const onClickPath = (targetPath: string) => {
  emit('click', targetPath);
};
</script>

<template>
  <div class="md-navigation-path" role="navigation" aria-label="Path">
    <MDIconButton
      tooltip="Home"
      md-symbol-name="home"
      class="md-navigation-path__home-button"
      @click="onClickHome"
    />

    <template v-for="{ name, path: segmentPath } in visibleSegments" :key="segmentPath">
      <MDSymbol class="md-navigation-path__separator" name="chevron_right" />

      <MDButton
        :label="name"
        color="text"
        class="md-navigation-path__item"
        @click="() => onClickPath(segmentPath)"
      />
    </template>
  </div>
</template>

<style lang="css" scoped>
.md-navigation-path {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &__home-button,
  &__item,
  &__separator {
    flex-shrink: 0;
  }

  &__item {
    --md-button-horizontal-padding: 8px;
  }

  &__separator {
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
