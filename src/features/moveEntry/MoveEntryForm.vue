<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import type { DirectoryEntryRef, FileEntryRef } from '../../entities/entry';
import { EntryList } from '../../entities/entry';

const props = defineProps<{
  sourceEntry: DirectoryEntryRef | FileEntryRef;
  accessibleDestination: DirectoryEntryRef;
}>();

const emit = defineEmits<{
  cancel: [];
  moved: [newEntry: DirectoryEntryRef | FileEntryRef];
}>();

const destinationDirectoryEntry = shallowRef<DirectoryEntryRef>();

const loading = ref(0);

const onSubmit = async () => {
  loading.value += 1;
  try {
    if (destinationDirectoryEntry.value) {
      const newEntry = await props.sourceEntry.moveTo(
        destinationDirectoryEntry.value,
      );
      emit('moved', newEntry);
    }
  } finally {
    loading.value -= 1;
  }
};

const onClickCancel = () => {
  destinationDirectoryEntry.value = undefined;
  emit('cancel');
};

const onClickTargetEntry = (targetEntry: DirectoryEntryRef | FileEntryRef) => {
  if ('list' in targetEntry) {
    destinationDirectoryEntry.value = targetEntry;
  }
};

const onClickTargetDirectory = () => {
  destinationDirectoryEntry.value = props.accessibleDestination;
};
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column move-form"
    @submit.prevent="onSubmit"
  >
    <div class="field is-overflow-y-auto is-flex is-flex-direction-column">
      <label class="label">
        Select the destination directory to move "{{ sourceEntry.name }}"
      </label>

      <div class="menu is-overflow-y-auto">
        <ul class="menu-list">
          <li>
            <button
              type="button"
              class="button is-link"
              :class="{
                'is-active':
                  destinationDirectoryEntry === accessibleDestination,
              }"
              @click="onClickTargetDirectory"
            >
              <span>{{ accessibleDestination.name }}</span>
            </button>

            <EntryList
              :directory-entry="accessibleDestination"
              :active-entry="destinationDirectoryEntry"
              @click="onClickTargetEntry"
            />
          </li>
        </ul>
      </div>
    </div>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit" :class="{ 'is-loading': loading }">
          Move
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

<style lang="scss" scoped>
.move-form {
  max-height: 100%;
}
</style>
