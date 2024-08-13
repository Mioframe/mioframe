<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import type { DirectoryEntry, FileEntry } from '../../entities/entry';
import { EntryList } from '../../entities/entry';

const props = defineProps<{
  entry: FileEntry | DirectoryEntry;
  targetEntry: DirectoryEntry;
}>();

const emit = defineEmits<{
  cancel: [];
  moved: [newEntry: FileEntry | DirectoryEntry];
}>();

const targetDirectoryEntry = shallowRef<DirectoryEntry>();

const loading = ref(0);

const onSubmit = async () => {
  loading.value += 1;
  try {
    if (targetDirectoryEntry.value) {
      const newEntry = await props.entry.moveTo(targetDirectoryEntry.value);
      emit('moved', newEntry);
    }
  } finally {
    loading.value -= 1;
  }
};

const onClickCancel = () => {
  targetDirectoryEntry.value = undefined;
  emit('cancel');
};

const onClickTargetEntry = (targetEntry: DirectoryEntry | FileEntry) => {
  if ('list' in targetEntry) {
    targetDirectoryEntry.value = targetEntry;
  }
};

const onClickTargetDirectory = () => {
  targetDirectoryEntry.value = props.targetEntry;
};
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <div class="menu">
      <ul class="menu-list">
        <li>
          <button
            type="button"
            class="button is-link"
            :class="{ 'is-active': targetDirectoryEntry === targetEntry }"
            @click="onClickTargetDirectory"
          >
            <span>{{ targetEntry.name }}</span>
          </button>

          <EntryList
            :directory-entry="targetEntry"
            :active-entry="targetDirectoryEntry"
            @click="onClickTargetEntry"
          />
        </li>
      </ul>
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
