<script setup lang="ts">
import { nextTick, onBeforeUnmount, shallowRef, useTemplateRef, watch } from 'vue';
import type { JsonEditor } from 'vanilla-jsoneditor';
import { createJSONEditor } from 'vanilla-jsoneditor';
import { deepPutJsonObject } from '@shared/lib/changeObject';
import { isObjectLike } from '@shared/lib/typeGuards';
import { debounce, isEqual, isUndefined } from 'es-toolkit';

const value = defineModel<unknown>({ required: true });

defineProps<{ label: string }>();

const editorRef = useTemplateRef('editorRef');

const jsonEditor = shallowRef<JsonEditor>();

const getJsonContent = (): unknown => {
  const content = jsonEditor.value?.get();
  if (content) {
    if ('json' in content) {
      return content.json;
    }
    if ('text' in content) {
      try {
        return JSON.parse(content.text);
      } catch {}
    }
  }
  return undefined;
};

const setJsonContent = (json: unknown) => {
  const oldJson = getJsonContent();

  if (!isEqual(oldJson, json)) {
    jsonEditor.value?.update({
      json,
    });
  }
};

const onChange = debounce(() => {
  valueWatchHandle.pause();

  const json = getJsonContent();

  if (!isUndefined(json)) {
    if (isObjectLike(json) && isObjectLike(value.value)) {
      deepPutJsonObject(value.value, json);
    } else {
      value.value = json;
    }
  }

  void nextTick().then(valueWatchHandle.resume);
}, 1e3);

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
          content: {
            json: value.value,
          },
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
  (nextValue) => {
    setJsonContent(nextValue);
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
