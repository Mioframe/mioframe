<script setup lang="ts">
import { TeleportWithPlaceholder } from '@shared/lib/teleport';
import MDBottomSheetContainer from './MDBottomSheetContainer.vue';
import { computed, nextTick, toRefs, useTemplateRef } from 'vue';
import { type MaybeElement } from '@vueuse/core';
import { watch } from 'vue';
import { useOverlay } from '../Overlay';

const props = withDefaults(
  defineProps<{
    type?: 'standard' | 'modal';
    /**
     * unique label for screen readers and navigation
     */
    label: string;
  }>(),
  {},
);

const { label } = toRefs(props);

const showModel = defineModel<boolean>('show', { required: true });

const fullscreen = defineModel<boolean>('fullscreen', {
  default: undefined,
});

const collapsed = defineModel<boolean>('collapsed', {
  default: undefined,
});

const emit = defineEmits<{
  clickContainer: [];
}>();

defineSlots<{
  default: () => unknown;
}>();

const bottomSheetContainerEl = useTemplateRef<MaybeElement>(
  'bottomSheetContainerEl',
);

const { showOverlay, dialogContainer } = useOverlay(
  bottomSheetContainerEl,
  label,
  showModel,
  computed(() => (props.type === 'modal' ? 'dialog' : 'overlay')),
);

const openLikeModal = computed(() => props.type === 'modal' && showModel.value);

const teleportTarget = computed(() =>
  props.type === 'modal' ? dialogContainer.value : undefined,
);

const showOverlayWatchHandle = watch(showOverlay, (showOverlay) => {
  showWatchHandle.pause();
  showModel.value = showOverlay;
  void nextTick(showWatchHandle.resume);
});

const showWatchHandle = watch(
  showModel,
  (show) => {
    showOverlayWatchHandle.pause();
    showOverlay.value = show;
    void nextTick(showOverlayWatchHandle.resume);
  },
  { immediate: true },
);
</script>

<template>
  <TeleportWithPlaceholder
    :teleport-target="teleportTarget"
    with-placeholder
    class="md-bottom-sheet__placeholder"
  >
    <template #default="{ targetWidth }">
      <Transition>
        <MDBottomSheetContainer
          v-if="showModel"
          ref="bottomSheetContainerEl"
          v-model:collapsed="collapsed"
          v-model:fullscreen="fullscreen"
          :width="targetWidth"
          class="md-bottom-sheet__container"
          :type="type"
          :aria-modal="openLikeModal ? 'true' : undefined"
          :aria-label="label"
          @click-container="emit('clickContainer')"
        >
          <slot />
        </MDBottomSheetContainer>
      </Transition>
    </template>
  </TeleportWithPlaceholder>
</template>

<style lang="css" scoped>
.md-bottom-sheet {
  &__placeholder {
    position: fixed;
  }

  &__container {
    position: absolute;
    top: calc(var(--teleport-placeholder-top) * -1);
    left: calc(var(--md-bottom-sheet-width) / -2);
  }
}
</style>
