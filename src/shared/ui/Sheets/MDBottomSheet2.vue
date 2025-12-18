<script setup lang="ts">
import MDBottomSheetContainer from './MDBottomSheetContainer2.vue';
import { computed, ref, toRefs, useTemplateRef, watch, watchEffect } from 'vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import type { MaybeElement } from '@vueuse/core';
import { useOverlayContainer } from '../Overlay';

const props = withDefaults(
  defineProps<{
    /**
     * unique label for screen readers and navigation
     */
    label: string;
    class?: string;
  }>(),
  {},
);

const { label, class: classProp } = toRefs(props);

const showModel = defineModel<boolean>('show', { required: true });

defineSlots<{
  default: () => unknown;
}>();

const open = ref(false);

watchEffect(() => {
  open.value = showModel.value;
});

const scrollPosition = ref<number>(0);

watch(scrollPosition, (scrollPosition) => {
  if (!scrollPosition) {
    showModel.value = false;
  }
});

const render = computed(() => open.value || scrollPosition.value > 0);

const to = useOverlayContainer();

const sheetContainer = useTemplateRef<MaybeElement>('sheetContainer');
</script>

<template>
  <TeleportContainer :to="to" :container="sheetContainer" :disabled="!render">
    <Transition>
      <MDBottomSheetContainer
        v-if="render"
        ref="sheetContainer"
        v-model:scroll-position="scrollPosition"
        v-model:open="open"
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
