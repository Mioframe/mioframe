<script setup lang="ts">
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { OPFSName } from '@shared/service/directories';

const props = defineProps<{
  name: string;
  description?: string | undefined;
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
  <MDListItem is="button" :headline="name" :supporting-text="description" @click="onClickItem">
    <template #leadingIcon>
      <MDSymbol name="folder_managed" />
    </template>

    <template v-if="name !== OPFSName" #trailingIcon>
      <MDIconButton
        tooltip="Disconnect Mioframe space"
        md-symbol-name="link_off"
        @click="onClickDisconnect"
      />
    </template>
  </MDListItem>
</template>
