<script setup lang="ts">
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';
import { reactive, watchEffect } from 'vue';

const props = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  submit: [name: string];
  cancel: [];
}>();

const formState = reactive<{
  name: string | undefined;
}>({
  name: undefined,
});

watchEffect(() => {
  formState.name = props.name;
});

const onSubmit = () => {
  if (formState.name) {
    emit('submit', formState.name);
  }
};
const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <FormLayout @submit="onSubmit">
    <div class="field">
      <label class="label">Name</label>

      <div class="control">
        <input
          v-model.trim="formState.name"
          required
          class="input"
          type="text"
          placeholder="View's name"
        />
      </div>
    </div>

    <template #actions>
      <UIButton type="submit" primary>Rename</UIButton>

      <UIButton @click="onCancel">Cancel</UIButton>
    </template>
  </FormLayout>
</template>
