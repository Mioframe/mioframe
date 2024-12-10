<script setup lang="ts">
import { ref } from 'vue';
import type { ItemId } from '../../shared/lib/databaseDocument/item';
import type { DatabaseDocument } from '../../shared/lib/databaseDocument';
import { UIButton } from '@shared/ui/Button';
import FormLayout from '@shared/ui/FormLayout.vue';
import { ButtonGrid } from '@shared/ui/ButtonGrid';

const props = defineProps<{
  databaseDocument: DatabaseDocument;
  itemId: ItemId;
}>();

const emit = defineEmits<{
  cancel: [];
  removed: [];
}>();

const loading = ref(0);

const onSubmit = () => {
  loading.value += 1;
  try {
    props.databaseDocument.removeItem(props.itemId);
    emit('removed');
  } finally {
    loading.value -= 1;
  }
};
const onClickCancel = () => {
  emit('cancel');
};
</script>

<template>
  <FormLayout
    class="block-spacing is-flex is-flex-direction-column"
    @submit="onSubmit"
  >
    <p>Are you sure you want to remove item?</p>

    <ButtonGrid>
      <UIButton type="submit" :loading="!!loading" danger> Remove </UIButton>

      <UIButton :disabled="!!loading" @click="onClickCancel"> Cancel </UIButton>
    </ButtonGrid>
  </FormLayout>
</template>
