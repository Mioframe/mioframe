<script setup lang="ts" generic="P extends PropertiesMap">
import type { PropertiesMap } from '@shared/lib/databaseDocument/property';
import { MDDialog } from '@shared/ui/Dialog';

const { properties } = defineProps<{
  properties: P;
}>();

defineSlots<{
  default(props: { properties: P }): unknown;
}>();
</script>

<template>
  <MDDialog
    headline="Add item"
    supporting-text="Fill in the properties of the new item."
    apply-label="Add"
    class="db-item-add-dialog"
  >
    //TODO: генерировать форму на основе описания свойств
    <div class="db-item-add-dialog__body">
      <slot :properties> // TODO: зациклить слот до одного поля </slot>
    </div>
  </MDDialog>
</template>

<style lang="css" scoped>
.db-item-add-dialog {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
