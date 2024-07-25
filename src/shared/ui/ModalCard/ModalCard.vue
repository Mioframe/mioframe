<script setup lang="ts">
defineProps<{
  showHead?: boolean;
  title?: string;
  showCloseBtn?: boolean;
  showFoot?: boolean;
}>();

defineSlots<{
  default(): unknown;
  foot(): unknown;
}>();

const emit = defineEmits<{
  clickClose: [];
}>();
</script>

<template>
  <div class="modal is-active">
    <div class="modal-background" />

    <div class="modal-card">
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

      <section class="modal-card-body">
        <slot />
      </section>

      <footer v-if="showFoot" class="modal-card-foot">
        <slot name="foot" />
      </footer>
    </div>

    <button
      v-if="showCloseBtn && !showHead"
      class="modal-close is-large"
      aria-label="close"
      type="button"
      @click="emit('clickClose')"
    />
  </div>
</template>
