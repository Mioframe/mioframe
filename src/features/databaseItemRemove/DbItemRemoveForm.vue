<script setup lang="ts">
import { ref } from 'vue';
import type { ItemId } from '../../shared/lib/databaseDocument/item';
import type { DatabaseDocument } from '../../shared/lib/databaseDocument';

const props = defineProps<{
  databaseApi: DatabaseDocument;
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
    props.databaseApi.removeItem(props.itemId);
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
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <p>Are you sure you want to remove item?</p>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit" :class="{ 'is-loading': loading }">
          Remove
        </button>
      </div>

      <div class="control">
        <button
          class="button"
          type="button"
          :disabled="!!loading"
          @click="onClickCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>
