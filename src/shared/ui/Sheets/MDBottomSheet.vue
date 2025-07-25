<script setup lang="ts">
import { TeleportWithPlaceholder } from '@shared/lib/teleport';
import MDBottomSheetContainer from './MDBottomSheetContainer.vue';

defineProps<{
  show: boolean;
}>();

const fullscreen = defineModel<boolean>('fullscreen', {
  default: undefined,
});

const collapsed = defineModel<boolean>('collapsed', {
  default: undefined,
});

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <TeleportWithPlaceholder>
    <template #default="{ targetWidth }">
      <Transition>
        <MDBottomSheetContainer
          v-if="show"
          v-model:collapsed="collapsed"
          v-model:fullscreen="fullscreen"
          :width="targetWidth"
          class="md-bottom-sheet__container"
        >
          <slot />
        </MDBottomSheetContainer>
      </Transition>
    </template>
  </TeleportWithPlaceholder>
</template>
