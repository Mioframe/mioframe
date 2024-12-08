<script setup lang="ts">
import { JSONEditor } from 'vanilla-jsoneditor';
import { computed, ref, shallowRef, toRef, watch, watchEffect } from 'vue';
import type { ReactiveCFRDocument } from '../../entities/document/createReactiveCFRDocument';
import { cloneDeep } from 'lodash-es';
import { createLogger } from '../../shared/lib/logger';
import { isUnknownRecord } from '../../shared/lib/changeObject/isUnknownRecord';
import { replaceObject } from '../../shared/lib/changeObject/replaceObject';

const { debug } = createLogger('DocumentEditForm');

const props = defineProps<{
  reactiveCfrDocument: ReactiveCFRDocument;
}>();

const reactiveCFRDocument = toRef(() => props.reactiveCfrDocument);

const mainElement = ref<HTMLElement>();

const editor = shallowRef<JSONEditor>();

const onChangeJSON = (value: unknown) => {
  debug('onChangeJSON', value);
  reactiveCFRDocument.value.change((doc) => {
    if (!isUnknownRecord(doc.body)) {
      doc.body = value;
    } else if (isUnknownRecord(value)) {
      replaceObject(doc.body, value);
    }
  });
};

const docBody = computed(() => reactiveCFRDocument.value.doc?.body);

const getContentJson = () => {
  if (editor.value) {
    const content = editor.value.get();
    if ('json' in content) {
      return content.json;
    }
  }
  return undefined;
};

watchEffect(() => {
  debug('watchEffect', editor.value, docBody.value);
  const contentJson = getContentJson();
  if (docBody.value !== contentJson) {
    debug('editor update', docBody.value);
    void editor.value?.update({ json: cloneDeep(docBody.value ?? null) });
  }
});

watch(
  mainElement,
  async (target) => {
    if (editor.value) {
      await editor.value.destroy();
    }
    if (target) {
      editor.value = new JSONEditor({
        target,
        props: {
          content: { json: null },
          onChange: (updatedContent) => {
            debug('onChange', updatedContent);

            const contentJson: unknown =
              'json' in updatedContent
                ? updatedContent.json
                : JSON.parse(updatedContent.text);

            onChangeJSON(contentJson);
          },
        },
      });
    }
  },
  { immediate: true },
);
</script>

<template>
  <form class="is-flex" @submit.prevent>
    <div ref="mainElement" class="is-flex-grow-1" />
  </form>
</template>
