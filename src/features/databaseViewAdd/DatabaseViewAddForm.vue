<script setup lang="ts">
import { VIEW_LAYOUT } from '@shared/lib/databaseDocument/view/general';
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';
import type { ValueOf } from 'type-fest';
import { reactive } from 'vue';

const emit = defineEmits<{
  submit: [
    {
      name: string;
      layout: string;
    },
  ];
  cancel: [];
}>();

const formState = reactive<{
  layout: ValueOf<typeof VIEW_LAYOUT>;
  name: string | undefined;
}>({
  layout: VIEW_LAYOUT.TABLE,
  name: undefined,
});

const onSubmit = () => {
  if (formState.name) {
    emit('submit', {
      name: formState.name,
      layout: formState.layout,
    });
  }
};
const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <FormLayout @submit="onSubmit">
    <div class="field">
      <label class="label">View layout</label>

      <div class="control">
        <div class="select">
          <select v-model="formState.layout" required>
            <option v-for="(value, key) in VIEW_LAYOUT" :key :value>
              {{ value }}
            </option>
          </select>
        </div>
      </div>
    </div>

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
      <UIButton type="submit" primary>Add</UIButton>

      <UIButton @click="onCancel">Cancel</UIButton>
    </template>
  </FormLayout>
</template>
