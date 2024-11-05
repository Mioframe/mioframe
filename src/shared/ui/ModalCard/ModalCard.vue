<script setup lang="ts">
import { SlideYDownTransition } from '@noction/vue-bezier';
import { useCurrentElement } from '@vueuse/core';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { nextTick, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';

const props = defineProps<{
  showHead?: boolean;
  title?: string;
  showCloseBtn?: boolean;
  showFoot?: boolean;
  unlockFocus?: boolean;
}>();

defineSlots<{
  default(): unknown;
  foot(): unknown;
}>();

const emit = defineEmits<{
  clickClose: [];
}>();

const currentElement = useCurrentElement();

const { activate, deactivate } = useFocusTrap(currentElement);

// eslint-disable-next-line @typescript-eslint/no-misused-promises -- for await render
watchEffect(async () => {
  if (props.unlockFocus) {
    deactivate();
  } else {
    await nextTick();
    activate();
  }
});

onBeforeUnmount(() => {
  deactivate();
});

const showCard = ref(false);

onMounted(() => {
  showCard.value = true;
});
onBeforeUnmount(() => {
  showCard.value = false;
});
</script>

<template>
  <dialog open class="modal is-active" role="dialog">
    <div class="modal-background" />

    <SlideYDownTransition>
      <div v-if="showCard" class="modal-card card">
        <header v-if="showHead" class="modal-card-head">
          <p v-if="title?.length" class="modal-card-title">{{ title }}</p>

          <button
            v-if="showCloseBtn"
            class="delete"
            aria-label="close"
            type="button"
            @click="emit('clickClose')"
          />
        </header>

        <section class="modal-card-body is-flex is-flex-direction-column">
          <slot />
        </section>

        <footer v-if="showFoot" class="modal-card-foot">
          <slot name="foot" />
        </footer>
      </div>
    </SlideYDownTransition>

    <button
      v-if="showCloseBtn && !showHead"
      class="modal-close is-large"
      aria-label="close"
      type="button"
      @click="emit('clickClose')"
    />
  </dialog>
</template>

<style lang="css" scoped>
dialog.modal {
  width: 100%;
  height: 100%;
  background: transparent;
  justify-content: flex-end;

  @media screen and (orientation: landscape) {
    justify-content: center;
  }
}
</style>
