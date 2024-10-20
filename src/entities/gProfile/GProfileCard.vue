<script setup lang="ts">
defineProps<{
  picture?: string;
  name?: string;
  email?: string;
}>();

defineSlots<{
  mediaRight(): unknown;
}>();
</script>

<template>
  <div class="media">
    <div v-if="picture" class="media-left">
      <figure class="image is-48x48">
        <img :src="picture" :alt="name" />
      </figure>
    </div>

    <div class="media-content">
      <p class="title is-4">{{ name }}</p>

      <a class="subtitle is-6" :href="`mailto:${email}`">{{ email }}</a>
    </div>

    <div class="media-right">
      <slot name="mediaRight" />
    </div>
  </div>
</template>
