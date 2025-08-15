<script setup lang="ts">
import { TeleportWithPlaceholder } from '@shared/lib/teleport';
import MDBottomSheetContainer from './MDBottomSheetContainer.vue';

defineProps<{
  show: boolean;
  type?: 'standard' | 'modal';
}>();

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
          :type="type"
          @click-container="emit('clickContainer')"
        >
          <slot />
        </MDBottomSheetContainer>
      </Transition>
    </template>
  </TeleportWithPlaceholder>
</template>
