<script setup lang="ts">
import { ref, shallowRef } from 'vue';
import type { LocalDirectoryRef, LocalFileRef } from '../../entities/entry';
import { EntryList } from '../../entities/entry';
import FormLayout from '@shared/ui/FormLayout.vue';

const props = defineProps<{
  sourceEntry: LocalDirectoryRef | LocalFileRef;
  accessibleDestination: LocalDirectoryRef;
}>();

const emit = defineEmits<{
  cancel: [];
  copied: [newEntry: LocalDirectoryRef | LocalFileRef];
}>();

const destinationDirectoryEntry = shallowRef<LocalDirectoryRef>();

const loading = ref(0);

const onSubmit = async () => {
  loading.value += 1;
  try {
    if (destinationDirectoryEntry.value) {
      const newEntry = await props.sourceEntry.copyTo(
        destinationDirectoryEntry.value,
      );
      emit('copied', newEntry);
    }
  } finally {
    loading.value -= 1;
  }
};

const onClickCancel = () => {
  destinationDirectoryEntry.value = undefined;
  emit('cancel');
};

const onClickTargetEntry = (targetEntry: LocalDirectoryRef | LocalFileRef) => {
  if ('list' in targetEntry) {
    destinationDirectoryEntry.value = targetEntry;
  }
};

const onClickTargetDirectory = () => {
  destinationDirectoryEntry.value = props.accessibleDestination;
};
</script>

<template>
  <FormLayout class="copy-form" @submit="onSubmit">
    <div class="field is-overflow-y-auto is-flex is-flex-direction-column">
      <label class="label">
        Select the destination directory for copying "{{ sourceEntry.label }}"
      </label>

      <div class="menu is-overflow-y-auto">
        <ul class="menu-list">
          <li>
            <button
              type="button"
              class="button"
              :class="{
                'is-active':
                  destinationDirectoryEntry === accessibleDestination,
              }"
              @click="onClickTargetDirectory"
            >
              <span>{{ accessibleDestination.label }}</span>
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

    <template #actions>
      <button class="button" type="submit" :class="{ 'is-loading': loading }">
        Paste
      </button>

      <button
        class="button"
        type="button"
        :disabled="!!loading"
        @click="onClickCancel"
      >
        Cancel
      </button>
    </template>
  </FormLayout>
</template>

<style lang="scss" scoped>
.copy-form {
  max-height: 100%;
}
</style>
