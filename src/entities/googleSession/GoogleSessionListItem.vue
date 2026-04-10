<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import type { GoogleSessionDisplay } from '@shared/service/google';
import GoogleSessionAvatar from './GoogleSessionAvatar.vue';

const props = defineProps<{
  session: GoogleSessionDisplay;
}>();

const { session } = toRefs(props);

defineSlots<{
  trailingIcon(): unknown;
}>();

const headline = computed(() => session.value.profile.name ?? 'Google profile');
const supportingText = computed(() => session.value.profile.email);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <MDListItem
    is="button"
    :headline="headline"
    :supporting-text="supportingText"
    @click="emit('click')"
  >
    <template #leadingAvatarContainer>
      <GoogleSessionAvatar :profile-image-url="session.profile.picture" />
    </template>

    <template #trailingIcon>
      <slot name="trailingIcon" />
    </template>
  </MDListItem>
</template>
