<script setup lang="ts">
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';

const props = defineProps<{
  name: string;
  description?: string | undefined;
  canDisconnect?: boolean | undefined;
}>();

const emit = defineEmits<{
  clickPath: [name: string];
  disconnect: [name: string];
}>();

const onClickItem = () => {
  emit('clickPath', props.name);
};

const onClickDisconnect = (event: MouseEvent) => {
  event.stopPropagation();
  emit('disconnect', props.name);
};
</script>

<template>
  <MDListItem
    :mode="canDisconnect ? 'multi-action' : 'single-action'"
    :label-text="name"
    :supporting-text="description"
    @action="onClickItem"
  >
    <template #leading>
      <MDSymbol name="folder_managed" />
    </template>

    <template v-if="canDisconnect" #trailingAction>
      <MDIconButton
        tooltip="Disconnect Mioframe space"
        md-symbol-name="link_off"
        color="standard"
        @click="onClickDisconnect"
      />
    </template>
  </MDListItem>
</template>
