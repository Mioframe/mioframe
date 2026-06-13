<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs, useSlots } from 'vue';
import type { GoogleSessionDisplay } from '@shared/service';
import GoogleSessionAvatar from './GoogleSessionAvatar.vue';

const props = defineProps<{
  session: GoogleSessionDisplay;
}>();

const emit = defineEmits<{
  click: [];
}>();

defineSlots<{
  trailingAction(): unknown;
}>();
const slots = useSlots();

const { session } = toRefs(props);

const headline = computed(() => session.value.profile.name ?? 'Google profile');
const supportingText = computed(() => session.value.profile.email);

const onListItemClick = () => {
  emit('click');
};
</script>

<template>
  <MDListItem
    :mode="slots.trailingAction ? 'multi-action' : 'single-action'"
    :label-text="headline"
    :supporting-text="supportingText"
    @action="onListItemClick"
  >
    <template #leading>
      <GoogleSessionAvatar :profile-image-url="session.profile.picture" />
    </template>

    <template v-if="slots.trailingAction" #trailingAction>
      <slot name="trailingAction" />
    </template>
  </MDListItem>
</template>
