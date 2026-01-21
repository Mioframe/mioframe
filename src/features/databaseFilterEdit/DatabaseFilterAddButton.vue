<script setup lang="ts">
import {
  DatabasePropertyMenuItem,
  useDatabaseProperties,
} from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDMenuBase } from '@shared/ui/Menu';
import type { MaybeElement } from '@vueuse/core';
import { shallowRef, toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const { path, documentId } = toRefs(props);

const addButton = useTemplateRef<MaybeElement>('addButton');

const showMenu = shallowRef(false);

const onClickAdd = () => {
  showMenu.value = true;
};

const { propertiesIdList } = useDatabaseProperties(path, documentId);
</script>

<template>
  <MDButton ref="addButton" label="add filter" @click="onClickAdd">
    <template #icon>
      <MDSymbol name="add" />
    </template>
  </MDButton>

  <MDMenuBase v-model:show="showMenu" :target="addButton">
    <template v-for="propertyId in propertiesIdList" :key="propertyId">
      <DatabasePropertyMenuItem
        :path="path"
        :document-id="documentId"
        :property-id="propertyId"
      >
        <template #submenu>
          <!--  -->
        </template>
      </DatabasePropertyMenuItem>
    </template>
  </MDMenuBase>
</template>
