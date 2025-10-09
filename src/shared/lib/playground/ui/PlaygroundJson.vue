<script setup lang="ts">
import {
  nextTick,
  onBeforeUnmount,
  shallowRef,
  useTemplateRef,
  watch,
} from 'vue';
import type { Content, JsonEditor } from 'vanilla-jsoneditor';
import { createJSONEditor } from 'vanilla-jsoneditor';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { isObjectLike } from '@shared/lib/typeGuards';

defineProps<{ label: string }>();

const value = defineModel<unknown>({ required: true });

const editorRef = useTemplateRef('editorRef');

const jsonEditor = shallowRef<JsonEditor>();

const onChange = (content: Content) => {
  valueWatchHandle.pause();

  if ('json' in content) {
    const { json } = content;

    if (isObjectLike(json) && isObjectLike(value.value)) {
      deepPutJsonObject(value.value, json);
    } else {
      value.value = json;
    }
  }

  void nextTick().then(valueWatchHandle.resume);
};

watch(
  editorRef,
  async (target) => {
    if (jsonEditor.value) {
      await jsonEditor.value.destroy();
      value.value = undefined;
      jsonEditor.value = undefined;
    }
    if (target) {
      jsonEditor.value = createJSONEditor({
        target,
        props: {
          onChange,
        },
      });
    }
  },
  { immediate: true },
);

onBeforeUnmount(async () => {
  await jsonEditor.value?.destroy();
  jsonEditor.value = undefined;
});

const valueWatchHandle = watch(
  value,
  (value) => {
    jsonEditor.value?.update({ json: value });
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div>
    <label>
      {{ label }}
    </label>

    <div ref="editorRef" />
  </div>
</template>
