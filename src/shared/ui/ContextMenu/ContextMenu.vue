<script setup lang="ts">
import type { MaybeElement } from '@vueuse/core';
import { useElementSize, useWindowSize } from '@vueuse/core';
import type { CSSProperties } from 'vue';
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue';

const props = defineProps<{
  originPosition?: { clientX: number; clientY: number };
  // eslint-disable-next-line vue/no-unused-properties -- only emit
  refDropdown: MaybeElement;
}>();

const emit = defineEmits<{
  'update:refDropdown': [refDropdown: MaybeElement];
}>();
const dropdownEl = ref<HTMLElement>();

watchEffect(() => {
  emit('update:refDropdown', dropdownEl.value);
});

const { width: dropdownWidth, height: dropdownHeight } =
  useElementSize(dropdownEl);

const { width: windowWidth, height: windowHeight } = useWindowSize();

const mainStyle = computed((): CSSProperties | undefined => {
  if (props.originPosition) {
    const { clientX, clientY } = props.originPosition;

    return {
      left: `${Math.min(clientX, windowWidth.value - dropdownWidth.value)}px`,
      top: `${Math.min(clientY, windowHeight.value - dropdownHeight.value)}px`,
    };
  }
  return undefined;
});

defineSlots<{
  default(): unknown;
}>();

const retTest = ref<unknown>();

onBeforeUnmount(() => {
  emit('update:refDropdown', undefined);
});
</script>

<template>
  <Teleport ref="retTest" to="body">
    <div ref="dropdownEl" class="dropdown is-position-fixed" :style="mainStyle">
      <div class="dropdown-content">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.dropdown {
  z-index: 10;
}
</style>
