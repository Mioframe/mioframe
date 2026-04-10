<script setup lang="ts">
import MDBottomSheetContainer from './MDBottomSheetContainer2.vue';
import { shallowRef, toRefs, useTemplateRef, watch } from 'vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { type MaybeElement } from '@vueuse/core';
import { useOverlayContainer } from '../Overlay';

const props = withDefaults(
  defineProps<{
    /**
     * unique label for screen readers and navigation
     */
    label: string;
    class?: string | undefined;
  }>(),
  {},
);

const { label, class: classProp } = toRefs(props);

const emit = defineEmits<{
  /**
   * signals the complete hiding of the sheet
   */
  closed: [];
}>();

defineSlots<{
  default: () => unknown;
}>();

const to = useOverlayContainer();

const sheetContainer = useTemplateRef<MaybeElement>('sheetContainer');

const scrollPosition = shallowRef<number>();

watch(scrollPosition, (nextScrollPosition) => {
  if (nextScrollPosition === 0) {
    emit('closed');
  }
});
</script>

<template>
  <TeleportContainer :to="to" :container="sheetContainer">
    <Transition>
      <MDBottomSheetContainer
        ref="sheetContainer"
        v-model:scroll-position="scrollPosition"
        open
        class="md-bottom-sheet__container"
        :class="classProp"
        aria-modal="true"
        :aria-label="label"
      >
        <slot />
      </MDBottomSheetContainer>
    </Transition>
  </TeleportContainer>
</template>
