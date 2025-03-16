<script setup lang="ts">
import { computed } from 'vue';
import { useWindowSizeClass, WindowClass } from './useWindowSizeClass';
import { MDTopAppBar } from '../TopAppBar';
import { MDIconButton } from '../Button';
import { MDSymbol } from '../Icon';

const { showSecond = false, secondHeadline = '' } = defineProps<{
  showSecond?: boolean;
  secondHeadline?: string;
}>();

const emit = defineEmits<{
  clickCloseSecond: [];
}>();

const slots = defineSlots<{
  navigation(): unknown;
  firstPane(): unknown;
  secondPane(): unknown;
}>();

const { windowClass } = useWindowSizeClass();

const isShowFirstPane = computed(
  () => !showSecond || windowClass.value !== WindowClass.Compact,
);

const onClickBack = () => {
  emit('clickCloseSecond');
};
</script>

<template>
  <main class="md-layer">
    <nav v-if="!!slots.navigation" class="md-layer__navigation">
      <slot name="navigation" />
    </nav>

    <section class="md-layer__body body">
      <div v-if="isShowFirstPane" class="body__first-pane">
        <slot name="firstPane" />
      </div>

      <div v-if="showSecond" class="body__second-pane">
        <div class="body__container">
          <MDTopAppBar :headline="secondHeadline">
            <template #leadingNavigation>
              <MDIconButton tooltip="back" @click="onClickBack">
                <template #icon>
                  <MDSymbol v-if="isShowFirstPane" name="close" />

                  <MDSymbol v-else name="arrow_back" />
                </template>
              </MDIconButton>
            </template>
          </MDTopAppBar>

          <slot name="secondPane" />
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.md-layer {
  flex-grow: 1;
  display: flex;
  flex-direction: column-reverse;
  /* padding-left: 16px;
  padding-right: 16px; */
  overflow: auto;
  --md-container-color: var(--md-sys-color-surface-container);

  &__navigation {
    flex-grow: 1;
    flex-shrink: 0;
  }

  &__body {
    flex-grow: 1;
    flex-shrink: 0;
    max-height: 100%;
  }
}

.body {
  display: flex;

  &__second-pane,
  &__first-pane {
    --md-pane-padding: 16px;

    display: flex;
    flex-direction: column;
    flex: 1 0;
    padding: 4px var(--md-pane-padding);
    overflow-y: auto;
  }

  &__container {
    position: relative;
    flex: 1 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: 16px;
    --md-container-color: var(--md-sys-color-surface);
    overflow-y: auto;
  }
}
</style>
