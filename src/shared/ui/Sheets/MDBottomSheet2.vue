<script setup lang="ts">
import MDBottomSheetContainer from './MDBottomSheetContainer2.vue';
import { computed, ref, toRefs, watch, watchEffect } from 'vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { usePaneContainer } from '../Layout/useMDContainer';

const props = withDefaults(
  defineProps<{
    /**
     * unique label for screen readers and navigation
     */
    label: string;
  }>(),
  {},
);

const { label } = toRefs(props);

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

/**
 * // FIXME: эта версия менее производительная
 *
 * [x] телепортируем в usePaneContainer без контейнеров(?) и плейсхолдеров
 * [x] позиционируем относительно Pane c помощью чистого css (используем main как контейнер, высчитываем размеры из переменных pane относительно контейнера)
 * избегаем чтение размеров
 * анимацию появления делаем на css
 * пользовательское управление скроллом
 * програмное скрытие анимацией css
 */

const paneContainer = usePaneContainer();

const to = computed(() => paneContainer.value ?? document.body);
</script>

<template>
  <TeleportContainer :to="to">
    <Transition>
      <MDBottomSheetContainer
        v-if="render"
        v-model:scroll-position="scrollPosition"
        v-model:open="open"
        class="md-bottom-sheet__container"
        aria-modal="true"
        :aria-label="label"
      >
        <slot />
      </MDBottomSheetContainer>
    </Transition>
  </TeleportContainer>
</template>
