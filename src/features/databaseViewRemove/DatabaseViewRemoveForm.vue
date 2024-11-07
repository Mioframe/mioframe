<script setup lang="ts">
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';

defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  cancel: [];
  remove: [];
}>();

const onSubmit = () => {
  emit('remove');
};
const onClickCancel = () => {
  emit('cancel');
};
</script>

<template>
  <FormLayout @submit="onSubmit">
    <p>
      Are you sure you want to remove view
      <template v-if="name?.length"> "{{ name }}" </template>

      <template v-else>this</template>
      ?
    </p>

    <div class="button-grid">
      <UIButton type="submit" danger> Remove </UIButton>

      <UIButton @click="onClickCancel"> Cancel </UIButton>
    </div>
  </FormLayout>
</template>
